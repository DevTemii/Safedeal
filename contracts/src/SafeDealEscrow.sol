// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

contract SafeDealEscrow {
    using SafeERC20 for IERC20;

    enum DealStatus {
        Created,
        Funded,
        Delivered,
        Completed,
        Disputed
    }

    struct Deal {
        address buyer;
        address seller;
        address token;
        uint256 amount;
        uint64 deadline;
        DealStatus status;
        uint64 createdAt;
        uint64 fundedAt;
        uint64 deliveredAt;
        uint64 disputedAt;
        uint64 releasedAt;
    }

    error DealNotFound(uint256 dealId);
    error InvalidAmount();
    error InvalidSeller();
    error InvalidState(DealStatus expected, DealStatus actual);
    error InvalidToken();
    error OnlyBuyer();
    error OnlySeller();
    error SelfDeal();
    error NotImplemented();

    uint256 public nextDealId;
    mapping(uint256 dealId => Deal deal) public deals;

    event DealCreated(
        uint256 indexed dealId,
        address indexed buyer,
        address indexed seller,
        address token,
        uint256 amount,
        uint64 deadline
    );

    event DealFunded(uint256 indexed dealId, address indexed buyer, uint256 amount);

    event DealDelivered(uint256 indexed dealId, address indexed seller);

    event DealReleased(uint256 indexed dealId, address indexed buyer, address indexed seller, uint256 amount);

    event DealDisputed(uint256 indexed dealId, address indexed raisedBy);

    function createDeal(address seller, address token, uint256 amount, uint64 deadline) external returns (uint256 dealId) {
        if (seller == address(0)) revert InvalidSeller();
        if (token == address(0)) revert InvalidToken();
        if (amount == 0) revert InvalidAmount();
        if (seller == msg.sender) revert SelfDeal();

        dealId = nextDealId++;

        deals[dealId] = Deal({
            buyer: msg.sender,
            seller: seller,
            token: token,
            amount: amount,
            deadline: deadline,
            status: DealStatus.Created,
            createdAt: uint64(block.timestamp),
            fundedAt: 0,
            deliveredAt: 0,
            disputedAt: 0,
            releasedAt: 0
        });

        emit DealCreated(dealId, msg.sender, seller, token, amount, deadline);
    }

    function fundDeal(uint256 dealId) external {
        Deal storage deal = _getDeal(dealId);

        if (msg.sender != deal.buyer) revert OnlyBuyer();
        if (deal.status != DealStatus.Created) revert InvalidState(DealStatus.Created, deal.status);

        deal.status = DealStatus.Funded;
        deal.fundedAt = uint64(block.timestamp);

        IERC20(deal.token).safeTransferFrom(msg.sender, address(this), deal.amount);

        emit DealFunded(dealId, msg.sender, deal.amount);
    }

    function markDelivered(uint256 dealId) external {
        Deal storage deal = _getDeal(dealId);

        if (msg.sender != deal.seller) revert OnlySeller();
        if (deal.status != DealStatus.Funded) revert InvalidState(DealStatus.Funded, deal.status);

        deal.status = DealStatus.Delivered;
        deal.deliveredAt = uint64(block.timestamp);

        emit DealDelivered(dealId, msg.sender);
    }

    function releaseDeal(uint256 dealId) external {
        Deal storage deal = _getDeal(dealId);

        if (msg.sender != deal.buyer) revert OnlyBuyer();
        if (deal.status != DealStatus.Delivered) revert InvalidState(DealStatus.Delivered, deal.status);

        deal.status = DealStatus.Completed;
        deal.releasedAt = uint64(block.timestamp);

        IERC20(deal.token).safeTransfer(deal.seller, deal.amount);

        emit DealReleased(dealId, msg.sender, deal.seller, deal.amount);
    }

    function raiseDispute(uint256 dealId) external {
        dealId;
        revert NotImplemented();
    }

    function _getDeal(uint256 dealId) internal view returns (Deal storage deal) {
        deal = deals[dealId];

        if (deal.buyer == address(0)) revert DealNotFound(dealId);
    }
}
