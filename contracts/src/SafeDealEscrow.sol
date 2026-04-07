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
        seller;
        token;
        amount;
        deadline;
        dealId = 0;
        revert NotImplemented();
    }

    function fundDeal(uint256 dealId) external {
        dealId;
        revert NotImplemented();
    }

    function markDelivered(uint256 dealId) external {
        dealId;
        revert NotImplemented();
    }

    function releaseDeal(uint256 dealId) external {
        dealId;
        revert NotImplemented();
    }

    function raiseDispute(uint256 dealId) external {
        dealId;
        revert NotImplemented();
    }
}
