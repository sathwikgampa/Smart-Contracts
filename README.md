# Freelance Smart Payment Agreement

## Abstract
This project implements a decentralized freelance payment system using Ethereum smart contracts. It solves the issue of trust between clients and freelancers by locking payment funds in a smart contract (escrow) until the work is completed and confirmed by the client.

## Problem Statement
In traditional freelance work, trust is a major issue:
1. **Freelancers** fear not getting paid after doing the work.
2. **Clients** fear paying upfront and not receiving quality work.
Existing platforms (Upwork, Fiverr) charge high fees (20%+) to mediate this trust.

## Objectives
1.  **Secure Escrow**: Lock funds on the blockchain.
2.  **Trustless**: Remove the need for a middleman to hold funds.
3.  **Low Fees**: Only pay standard blockchain gas fees.
4.  **Transparency**: Agreement terms and status are visible on-chain.

## System Architecture
-   **Frontend**: HTML/CSS/JS interface for easy interaction.
-   **Wallet**: MetaMask for signing transactions.
-   **Smart Contract**: Solidity contract deployed on Ethereum (Sepolia Testnet).
-   **Library**: Ethers.js for blockchain communication.

---

## Setup & Deployment Guide

### Prerequisites
1.  **MetaMask Extension**: Installed in your browser.
2.  **Sepolia Test ETH**: You need free test funds.
    -   Go to [Google Sepolia Faucet](https://cloud.google.com/application/blockchain/faucet/ethereum/sepolia) or [Alchemy Faucet](https://sepoliafaucet.com/).
    -   Enter your wallet address and get ETH.

### 1. Deploy Smart Contract (via Remix IDE) -> Recommended for beginners
1.  Open [Remix IDE](https://remix.ethereum.org/).
2.  Create a new file `Agreement.sol` and paste the code from the `Agreement.sol` file in this project.
3.  Go to the **Solidity Compiler** tab and click **Compile Agreement.sol**.
4.  Go to the **Deploy & Run Transactions** tab.
    -   Environment: Select **Injected Provider - MetaMask**.
    -   Account: Select your account with Sepolia ETH.
    -   **Deploy Section**:
        -   Expand the `Deploy` section.
        -   Enter `_freelancer` address (e.g., a second wallet you own).
        -   Enter `_agreementText` (e.g., "Logo Design").
        -   **Value**: Enter amount to lock (e.g., 1 Ether or 1000000000000000 wei).
    -   Click **Transact**. Confirm in MetaMask.

### 2. Connect Frontend
1.  You can open `index.html` directly in your browser or use a live server.
2.  **IMPORTANT Setup for "Create Contract" Button**:
    -   The frontend `Create` button requires the contract **Bytecode**.
    -   In Remix, go to the **Compiler** tab, copy the **Bytecode** JSON object.
    -   Open `abis.js` in this folder.
    -   Replace `YOUR_BYTECODE_HERE...` with the actual bytecode string.
3.  Refresh the page.

---

## Step-by-Step Test Flow (User Manual)

### Scenario: Client hiring a Freelancer

1.  **Connect Wallet**:
    -   Open the web page.
    -   Click **Connect Wallet**. Ensure you are on **Sepolia Network**.

2.  **Create Agreement (Client)**:
    -   Enter Freelancer's Wallet Address (ask a friend or use a secondary account).
    -   Enter task description: "Build a website".
    -   Enter Amount: `0.01` ETH.
    -   Click **Create Contract**.
    -   *Note: If you skipped the bytecode step, simply deploy in Remix and copy the address to the "Load Contract" section instead.*

3.  **Verify Status**:
    -   Once deployed/loaded, the status should show **CREATED**.
    -   Funds are now locked in the contract, not with the Client or Freelancer.

4.  **Confirm Work (Client)**:
    -   Suppose Freelancer finishes the work.
    -   Client reviews it.
    -   Click **Confirm Work**.
    -   Status changes to **WORK_CONFIRMED**.

5.  **Release Payment (Client)**:
    -   Click **Release Payment**.
    -   The contract sends the locked 0.01 ETH to the Freelancer.
    -   Status changes to **COMPLETED**.

## Future Scope
-   **Dispute Resolution**: Add a third-party arbiter if client refuses to confirm work.
-   **Deadlines**: Automatically refund client if work isn't done by a date.
-   **Stablecoins**: Use USDC/USDT to avoid ETH price volatility.

