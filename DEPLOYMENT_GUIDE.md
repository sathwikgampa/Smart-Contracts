# Deployment Guide

This guide covers how to deploy the Freelance Smart Agreement application.

## Prerequisites

1.  **MetaMask Installed**: Ensure you have the MetaMask browser extension.
2.  **Testnet ETH**: You will need Sepolia ETH (or another testnet coin) to deploy contracts. Get it from a faucet like [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia).
3.  **Vercel Account**: For hosting the frontend.

---

## Part 1: Smart Contract Deployment

You have two options to deploy the contract: **Option A (Via App)** or **Option B (Via Remix)**.

### Option A: Deploy via the App (Recommended for Testing)
The app has a "Create Agreement" button that uses the Bytecode in `abis.js` to deploy a new contract instance directly from the browser.

1.  Open your web app (locally or deployed).
2.  Connect your Wallet (ensure you are on **Sepolia** network).
3.  Fill in the "Create New Agreement" fields.
4.  Click **Create Contract**.
5.  Confirm the transaction in MetaMask.
6.  Once deployed, copy the **Contract Address** shown on the screen.

### Option B: Deploy via Remix IDE (Manual)
If you want to customize the contract or if Option A fails:

1.  Go to [Remix IDE](https://remix.ethereum.org/).
2.  Create a new file `Agreement.sol` and paste the content from your local `Agreement.sol`.
3.  Go to the **Solidity Compiler** tab and click **Compile Agreement.sol**.
4.  Go to the **Deploy & Run Transactions** tab.
    -   Environment: Select **Injected Provider - MetaMask**.
    -   Accept the connection request in MetaMask.
5.  Enter the constructor arguments (`_freelancer` address and `_agreementText`).
6.  Click **Transact** / **Deploy**.
7.  Copy the deployed contract address.

---

## Part 2: Frontend Deployment (Vercel)

Since you have a `vercel.json` file, you are ready to deploy.

1.  **Push to GitHub**
    -   Push your code to a GitHub repository.

2.  **Deploy on Vercel**
    -   Go to [Vercel Dashboard](https://vercel.com/dashboard).
    -   Click **Add New...** > **Project**.
    -   Import your GitHub repository.
    -   Keep the default settings (Framework Preset: Other / Static).
    -   Click **Deploy**.

3.  **Access your site**
    -   Vercel will give you a domain (e.g., `your-project.vercel.app`).

---

## Troubleshooting: "Connect with MetaMask is not done"

If clicking "Connect Wallet" does nothing or fails on the deployed site:

### 1. Check Network (HTTPS vs HTTP)
-   **If deploying to Vercel (HTTPS)**: You generally **CANNOT** connect to a `localhost` blockchain (HTTP) due to browser security (Mixed Content blocking).
-   **Solution**: Switch your MetaMask to a Testnet like **Sepolia** or **Goerli**. Do not use "Localhost 8545" unless you configure your browser to allow insecure content (not recommended).

### 2. Check Console for Errors
-   Press `F12` (or right-click > Inspect) and go to the **Console** tab.
-   Look for red error messages.
-   Common error: `User rejected the request` (you cancelled the popup).
-   Common error: `Already processing` (click the extension icon to see pending requests).

### 3. Clear Cache / Reset Vercel
-   Sometimes old cached versions cause issues. Hard refresh with `Ctrl + Shift + R`.

### 4. Bytecode Issues
-   If "Create Contract" fails, ensure the `AGREEMENT_BYTECODE` in `abis.js` is correct. If you changed `Agreement.sol`, you **MUST** recompile in Remix, copy the new `Bytecode` (from the compilation details), and paste it into `abis.js`.

---

## Updating the Code (Workflow)

If you modify `Agreement.sol`:
1.  **Compile** in Remix.
2.  **Copy ABI**: Paste it into `AGREEMENT_ABI` in `abis.js`.
3.  **Copy Bytecode**: Paste it into `AGREEMENT_BYTECODE` in `abis.js`.
4.  **Save & Push** to GitHub (Vercel will auto-redeploy).
