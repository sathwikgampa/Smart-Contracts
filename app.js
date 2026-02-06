import { AGREEMENT_ABI, AGREEMENT_BYTECODE } from './abis.js';

const statusMap = ["CREATED", "WORK_CONFIRMED", "COMPLETED"];
let provider, signer, agreementContract;

// DOM Elements
const connectBtn = document.getElementById('connectBtn');
const walletAddressDisplay = document.getElementById('walletAddress');

const createContractBtn = document.getElementById('createContractBtn');
const deployStatus = document.getElementById('deployStatus');

const contractAddressInput = document.getElementById('contractAddress');
const loadContractBtn = document.getElementById('loadContractBtn');
const contractDetails = document.getElementById('contractDetails');
const actionStatus = document.getElementById('actionStatus');

// Debug Logger
const debugArea = document.createElement('div');
debugArea.style.padding = "10px";
debugArea.style.marginTop = "20px";
debugArea.style.borderTop = "1px solid #ccc";
debugArea.style.fontSize = "12px";
debugArea.style.color = "#333";
debugArea.style.fontFamily = "monospace";
document.body.appendChild(debugArea);

function logToScreen(msg, type = 'info') {
    console.log(msg);
    const line = document.createElement('div');
    line.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
    if (type === 'error') line.style.color = 'red';
    debugArea.prepend(line);
}

// Wallet Connection
if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
        logToScreen("Connect button clicked...");
        if (typeof window.ethereum !== 'undefined') {
            try {
                connectBtn.innerText = "Connecting...";
                connectBtn.disabled = true;

                provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);

                if (accounts.length === 0) throw new Error("No accounts found");

                signer = await provider.getSigner();
                const address = await signer.getAddress();

                logToScreen(`Connected: ${address}`);
                walletAddressDisplay.innerText = `Connected: ${address.substring(0, 6)}...${address.substring(38)}`;
                connectBtn.innerText = "Wallet Connected";
                connectBtn.classList.remove('primary-btn');
                connectBtn.classList.add('success-btn');

                // Network Check
                const network = await provider.getNetwork();
                logToScreen(`Network: ${network.name} (Chain ID: ${network.chainId})`);

                if (contractAddressInput.value) {
                    loadContractBtn.click();
                }

            } catch (error) {
                logToScreen(`Connection Error: ${error.message || error}`, 'error');
                alert("Connection Failed. See debug log at bottom of page.");
                connectBtn.innerText = "Connect Wallet";
                connectBtn.disabled = false;
            }
        } else {
            alert("MetaMask is not installed!");
            window.open('https://metamask.io/download/', '_blank');
        }
    });
}

// Create Contract
if (createContractBtn) {
    createContractBtn.addEventListener('click', async () => {
        if (!signer) return alert("Please connect wallet first");

        // Check if Bytecode is updated
        if (!AGREEMENT_BYTECODE || AGREEMENT_BYTECODE.includes("YOUR_BYTECODE")) {
            alert("Bytecode missing! Check deployment.");
            return;
        }

        const freelancerAddr = document.getElementById('freelancerAddress').value;
        const agreementText = document.getElementById('agreementText').value;
        const paymentEth = document.getElementById('paymentAmount').value;

        if (!freelancerAddr || !agreementText || !paymentEth) return alert("Please fill all fields");
        if (!ethers.isAddress(freelancerAddr)) return alert("Invalid Freelancer Address");

        deployStatus.innerText = "Deploying... Please confirm in MetaMask.";
        logToScreen("Initiating deployment...");

        try {
            const factory = new ethers.ContractFactory(AGREEMENT_ABI, AGREEMENT_BYTECODE, signer);
            const amountWei = ethers.parseEther(paymentEth);

            const contract = await factory.deploy(freelancerAddr, agreementText, { value: amountWei });
            deployStatus.innerText = "Waiting for confirmation...";
            logToScreen("Transaction sent. Waiting for confirmation...");

            await contract.waitForDeployment();
            const address = await contract.getAddress();

            deployStatus.innerText = `Contract Deployed at: ${address}`;
            contractAddressInput.value = address;
            logToScreen(`Contract Deployed! Address: ${address}`);

            // Auto load
            loadContract(address);
        } catch (error) {
            console.error(error);
            logToScreen(`Deployment Error: ${error.message}`, 'error');
            deployStatus.innerText = `Error: ${error.message}`;
        }
    });
}

// Load Contract
if (loadContractBtn) {
    loadContractBtn.addEventListener('click', () => {
        const address = contractAddressInput.value;
        if (ethers.isAddress(address)) {
            loadContract(address);
        } else {
            alert("Invalid address");
        }
    });
}

async function loadContract(address) {
    if (!signer) return alert("Connect wallet first");

    try {
        logToScreen(`Loading contract at ${address}...`);
        agreementContract = new ethers.Contract(address, AGREEMENT_ABI, signer);
        await refreshContractDetails();
        contractDetails.classList.remove('hidden');
        logToScreen("Contract loaded successfully.");
    } catch (error) {
        console.error(error);
        logToScreen(`Load Error: ${error.message}`, 'error');
        alert("Failed to load contract");
    }
}

async function refreshContractDetails() {
    if (!agreementContract) return;

    try {
        const details = await agreementContract.getDetails();
        // details = [client, freelancer, text, amount, status]
        const clientAddr = details[0];
        const freelancerAddr = details[1];

        const statusIdx = Number(details[4]); // Convert bigint to number if needed
        document.getElementById('displayFreelancer').innerText = freelancerAddr;
        document.getElementById('displayAmount').innerText = ethers.formatEther(details[3]);
        document.getElementById('contractStatus').innerText = statusMap[statusIdx];

        // Check Role
        if (signer) {
            const userAddress = await signer.getAddress();
            const actionContainer = document.querySelector('.action-buttons');
            const roleInfo = document.getElementById('roleInfo');

            if (!roleInfo) {
                // Create if not exists
                const p = document.createElement('p');
                p.id = 'roleInfo';
                p.style.fontWeight = 'bold';
                p.style.marginTop = '10px';
                document.getElementById('contractDetails').insertBefore(p, actionContainer);
            }

            const roleDisplay = document.getElementById('roleInfo');
            const confirmBtn = document.getElementById('confirmWorkBtn');
            const releaseBtn = document.getElementById('releasePaymentBtn');

            if (userAddress.toLowerCase() === clientAddr.toLowerCase()) {
                roleDisplay.innerText = "You are the Client";
                roleDisplay.style.color = "green";
                confirmBtn.disabled = false;
                releaseBtn.disabled = false;
                confirmBtn.style.opacity = "1";
                releaseBtn.style.opacity = "1";
            } else if (userAddress.toLowerCase() === freelancerAddr.toLowerCase()) {
                roleDisplay.innerText = "You are the Freelancer";
                roleDisplay.style.color = "blue";
                confirmBtn.disabled = true;
                releaseBtn.disabled = true;
                confirmBtn.style.opacity = "0.5";
                releaseBtn.style.opacity = "0.5";
                confirmBtn.title = "Only Client can confirm work";
                releaseBtn.title = "Only Client can release payment";
            } else {
                roleDisplay.innerText = "You are an Observer";
                roleDisplay.style.color = "gray";
                confirmBtn.disabled = true;
                releaseBtn.disabled = true;
                confirmBtn.style.opacity = "0.5";
                releaseBtn.style.opacity = "0.5";
            }
        }
    } catch (error) {
        logToScreen(`Refresh Error: ${error.message}`, 'error');
    }
}

// Confirm Work
const confirmWorkBtn = document.getElementById('confirmWorkBtn');
if (confirmWorkBtn) {
    confirmWorkBtn.addEventListener('click', async () => {
        if (!agreementContract) return;
        actionStatus.innerText = "Processing Confirm Work...";

        try {
            const tx = await agreementContract.confirmWork();
            await tx.wait();
            actionStatus.innerText = "Work Confirmed!";
            await refreshContractDetails();
        } catch (error) {
            console.error(error);
            actionStatus.innerText = "Error: " + (error.reason || error.message);
        }
    });
}

// Release Payment
const releasePaymentBtn = document.getElementById('releasePaymentBtn');
if (releasePaymentBtn) {
    releasePaymentBtn.addEventListener('click', async () => {
        if (!agreementContract) return;
        actionStatus.innerText = "Processing Payment Release...";

        try {
            const tx = await agreementContract.releasePayment();
            await tx.wait();
            actionStatus.innerText = "Payment Released!";
            await refreshContractDetails();
        } catch (error) {
            console.error(error);
            actionStatus.innerText = "Error: " + (error.reason || error.message);
        }
    });
}
