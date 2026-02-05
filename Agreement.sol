// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Freelance Agreement Smart Contract
 * @dev Implements a simple escrow system for freelance work.
 */
contract Agreement {
    // State variables
    address public client;
    address payable public freelancer;
    string public agreementText;
    uint256 public paymentAmount;
    
    // Enum to track contract status
    enum Status { CREATED, WORK_CONFIRMED, COMPLETED }
    Status public currentStatus;

    // Events for logging
    event ContractCreated(address client, address freelancer, uint256 amount);
    event WorkConfirmed();
    event PaymentReleased(address freelancer, uint256 amount);

    /**
     * @dev Constructor to initialize the agreement and lock funds.
     * @param _freelancer The address of the freelancer wallet.
     * @param _agreementText A short description of the work.
     */
    constructor(address payable _freelancer, string memory _agreementText) payable {
        require(msg.value > 0, "Payment amount must be greater than 0");
        require(_freelancer != address(0), "Invalid freelancer address");
        
        client = msg.sender; // The one deploying is the client
        freelancer = _freelancer;
        agreementText = _agreementText;
        paymentAmount = msg.value;
        currentStatus = Status.CREATED;

        emit ContractCreated(client, freelancer, paymentAmount);
    }

    /**
     * @dev Function to confirm that the work has been completed satisfactorily.
     * Can only be called by the client.
     */
    function confirmWork() public {
        require(msg.sender == client, "Only client can confirm work");
        require(currentStatus == Status.CREATED, "Work already confirmed or contract completed");
        
        currentStatus = Status.WORK_CONFIRMED;
        emit WorkConfirmed();
    }

    /**
     * @dev Function to release the locked funds to the freelancer.
     * Can be called by client after confirming work, or potentially automated in future versions.
     * Here we verify status is WORK_CONFIRMED.
     */
    function releasePayment() public {
        require(msg.sender == client, "Only client can release payment");
        require(currentStatus == Status.WORK_CONFIRMED, "Work must be confirmed first");
        require(address(this).balance >= paymentAmount, "Insufficient funds in contract");

        currentStatus = Status.COMPLETED;
        
        // Transfer funds to freelancer
        (bool success, ) = freelancer.call{value: paymentAmount}("");
        require(success, "Transfer failed");

        emit PaymentReleased(freelancer, paymentAmount);
    }

    /**
     * @dev Helper function to get contract details.
     */
    function getDetails() public view returns (address, address, string memory, uint256, Status) {
        return (client, freelancer, agreementText, paymentAmount, currentStatus);
    }
}
