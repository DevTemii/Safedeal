// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {SafeDealEscrow} from "../src/SafeDealEscrow.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock USD", "mUSD") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract SafeDealEscrowTest is Test {
    uint256 internal constant DEAL_AMOUNT = 25e6;
    uint64 internal constant DEAL_DEADLINE = 1_900_000_000;

    SafeDealEscrow internal escrow;
    MockERC20 internal token;

    address internal buyer = makeAddr("buyer");
    address internal seller = makeAddr("seller");
    address internal outsider = makeAddr("outsider");

    function setUp() public {
        escrow = new SafeDealEscrow();
        token = new MockERC20();

        token.mint(buyer, DEAL_AMOUNT * 10);

        vm.prank(buyer);
        token.approve(address(escrow), type(uint256).max);
    }

    function testCreateDealStoresCorrectValues() public {
        vm.warp(1_700_000_000);

        vm.prank(buyer);
        uint256 dealId = escrow.createDeal(seller, address(token), DEAL_AMOUNT, DEAL_DEADLINE);

        (
            address storedBuyer,
            address storedSeller,
            address storedToken,
            uint256 storedAmount,
            uint64 storedDeadline,
            SafeDealEscrow.DealStatus storedStatus,
            uint64 createdAt,
            uint64 fundedAt,
            uint64 deliveredAt,
            uint64 disputedAt,
            uint64 releasedAt
        ) = escrow.deals(dealId);

        assertEq(dealId, 0);
        assertEq(storedBuyer, buyer);
        assertEq(storedSeller, seller);
        assertEq(storedToken, address(token));
        assertEq(storedAmount, DEAL_AMOUNT);
        assertEq(storedDeadline, DEAL_DEADLINE);
        assertEq(uint8(storedStatus), uint8(SafeDealEscrow.DealStatus.Created));
        assertEq(createdAt, uint64(block.timestamp));
        assertEq(fundedAt, 0);
        assertEq(deliveredAt, 0);
        assertEq(disputedAt, 0);
        assertEq(releasedAt, 0);
    }

    function testFundDealTransfersERC20IntoEscrow() public {
        uint256 dealId = _createDeal();

        uint256 buyerBalanceBefore = token.balanceOf(buyer);

        vm.prank(buyer);
        escrow.fundDeal(dealId);

        (,,,,, SafeDealEscrow.DealStatus storedStatus,, uint64 fundedAt,,,) = escrow.deals(dealId);

        assertEq(token.balanceOf(address(escrow)), DEAL_AMOUNT);
        assertEq(token.balanceOf(buyer), buyerBalanceBefore - DEAL_AMOUNT);
        assertEq(uint8(storedStatus), uint8(SafeDealEscrow.DealStatus.Funded));
        assertEq(fundedAt, uint64(block.timestamp));
    }

    function testReleaseFlowTransfersFullAmountToSeller() public {
        uint256 dealId = _createDeal();

        vm.prank(buyer);
        escrow.fundDeal(dealId);

        vm.warp(block.timestamp + 1 hours);

        vm.prank(seller);
        escrow.markDelivered(dealId);

        vm.warp(block.timestamp + 1 hours);

        uint256 sellerBalanceBefore = token.balanceOf(seller);

        vm.prank(buyer);
        escrow.releaseDeal(dealId);

        (,,,,, SafeDealEscrow.DealStatus storedStatus,,, uint64 deliveredAt,, uint64 releasedAt) = escrow.deals(dealId);

        assertEq(token.balanceOf(address(escrow)), 0);
        assertEq(token.balanceOf(seller), sellerBalanceBefore + DEAL_AMOUNT);
        assertEq(uint8(storedStatus), uint8(SafeDealEscrow.DealStatus.Completed));
        assertEq(deliveredAt, uint64(block.timestamp - 1 hours));
        assertEq(releasedAt, uint64(block.timestamp));
    }

    function testEitherParticipantCanRaiseDispute() public {
        uint256 buyerRaisedDealId = _createDeal();
        uint256 sellerRaisedDealId = _createDeal();

        vm.prank(buyer);
        escrow.raiseDispute(buyerRaisedDealId);

        (,,,,, SafeDealEscrow.DealStatus buyerRaisedStatus,,,, uint64 buyerDisputedAt,) =
            escrow.deals(buyerRaisedDealId);

        assertEq(uint8(buyerRaisedStatus), uint8(SafeDealEscrow.DealStatus.Disputed));
        assertEq(buyerDisputedAt, uint64(block.timestamp));

        vm.warp(block.timestamp + 1 hours);

        vm.prank(seller);
        escrow.raiseDispute(sellerRaisedDealId);

        (,,,,, SafeDealEscrow.DealStatus sellerRaisedStatus,,,, uint64 sellerDisputedAt,) =
            escrow.deals(sellerRaisedDealId);

        assertEq(uint8(sellerRaisedStatus), uint8(SafeDealEscrow.DealStatus.Disputed));
        assertEq(sellerDisputedAt, uint64(block.timestamp));
    }

    function testCreateDealRevertsOnInvalidParams() public {
        vm.startPrank(buyer);

        vm.expectRevert(SafeDealEscrow.InvalidSeller.selector);
        escrow.createDeal(address(0), address(token), DEAL_AMOUNT, DEAL_DEADLINE);

        vm.expectRevert(SafeDealEscrow.InvalidToken.selector);
        escrow.createDeal(seller, address(0), DEAL_AMOUNT, DEAL_DEADLINE);

        vm.expectRevert(SafeDealEscrow.InvalidAmount.selector);
        escrow.createDeal(seller, address(token), 0, DEAL_DEADLINE);

        vm.expectRevert(SafeDealEscrow.SelfDeal.selector);
        escrow.createDeal(buyer, address(token), DEAL_AMOUNT, DEAL_DEADLINE);

        vm.stopPrank();
    }

    function testOnlyBuyerCanFund() public {
        uint256 dealId = _createDeal();

        vm.prank(outsider);
        vm.expectRevert(SafeDealEscrow.OnlyBuyer.selector);
        escrow.fundDeal(dealId);
    }

    function testCannotFundTwice() public {
        uint256 dealId = _createFundedDeal();

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                SafeDealEscrow.InvalidState.selector,
                SafeDealEscrow.DealStatus.Created,
                SafeDealEscrow.DealStatus.Funded
            )
        );
        escrow.fundDeal(dealId);
    }

    function testOnlySellerCanMarkDelivered() public {
        uint256 dealId = _createFundedDeal();

        vm.prank(buyer);
        vm.expectRevert(SafeDealEscrow.OnlySeller.selector);
        escrow.markDelivered(dealId);
    }

    function testCannotMarkDeliveredBeforeFunding() public {
        uint256 dealId = _createDeal();

        vm.prank(seller);
        vm.expectRevert(
            abi.encodeWithSelector(
                SafeDealEscrow.InvalidState.selector,
                SafeDealEscrow.DealStatus.Funded,
                SafeDealEscrow.DealStatus.Created
            )
        );
        escrow.markDelivered(dealId);
    }

    function testOnlyBuyerCanRelease() public {
        uint256 dealId = _createDeliveredDeal();

        vm.prank(seller);
        vm.expectRevert(SafeDealEscrow.OnlyBuyer.selector);
        escrow.releaseDeal(dealId);
    }

    function testCannotReleaseBeforeFunded() public {
        uint256 dealId = _createDeal();

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                SafeDealEscrow.InvalidState.selector,
                SafeDealEscrow.DealStatus.Delivered,
                SafeDealEscrow.DealStatus.Created
            )
        );
        escrow.releaseDeal(dealId);
    }

    function testCannotReleaseBeforeDelivered() public {
        uint256 dealId = _createFundedDeal();

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                SafeDealEscrow.InvalidState.selector,
                SafeDealEscrow.DealStatus.Delivered,
                SafeDealEscrow.DealStatus.Funded
            )
        );
        escrow.releaseDeal(dealId);
    }

    function testOutsiderCannotRaiseDispute() public {
        uint256 dealId = _createFundedDeal();

        vm.prank(outsider);
        vm.expectRevert(SafeDealEscrow.OnlyParticipant.selector);
        escrow.raiseDispute(dealId);
    }

    function testDisputeBlocksRelease() public {
        uint256 dealId = _createDeliveredDeal();

        vm.prank(seller);
        escrow.raiseDispute(dealId);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                SafeDealEscrow.InvalidState.selector,
                SafeDealEscrow.DealStatus.Delivered,
                SafeDealEscrow.DealStatus.Disputed
            )
        );
        escrow.releaseDeal(dealId);
    }

    function testCompletedDealRejectsFurtherActions() public {
        uint256 dealId = _createCompletedDeal();

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                SafeDealEscrow.InvalidState.selector,
                SafeDealEscrow.DealStatus.Created,
                SafeDealEscrow.DealStatus.Completed
            )
        );
        escrow.fundDeal(dealId);

        vm.prank(seller);
        vm.expectRevert(
            abi.encodeWithSelector(
                SafeDealEscrow.InvalidState.selector,
                SafeDealEscrow.DealStatus.Funded,
                SafeDealEscrow.DealStatus.Completed
            )
        );
        escrow.markDelivered(dealId);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                SafeDealEscrow.InvalidState.selector,
                SafeDealEscrow.DealStatus.Delivered,
                SafeDealEscrow.DealStatus.Completed
            )
        );
        escrow.releaseDeal(dealId);

        vm.prank(seller);
        vm.expectRevert(
            abi.encodeWithSelector(SafeDealEscrow.DisputeNotAllowed.selector, SafeDealEscrow.DealStatus.Completed)
        );
        escrow.raiseDispute(dealId);
    }

    function _createDeal() internal returns (uint256 dealId) {
        vm.prank(buyer);
        dealId = escrow.createDeal(seller, address(token), DEAL_AMOUNT, DEAL_DEADLINE);
    }

    function _createFundedDeal() internal returns (uint256 dealId) {
        dealId = _createDeal();

        vm.prank(buyer);
        escrow.fundDeal(dealId);
    }

    function _createDeliveredDeal() internal returns (uint256 dealId) {
        dealId = _createFundedDeal();

        vm.prank(seller);
        escrow.markDelivered(dealId);
    }

    function _createCompletedDeal() internal returns (uint256 dealId) {
        dealId = _createDeliveredDeal();

        vm.prank(buyer);
        escrow.releaseDeal(dealId);
    }
}
