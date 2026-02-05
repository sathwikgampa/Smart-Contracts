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

// Wallet Connection
connectBtn.addEventListener('click', async () => {
    if (window.ethereum) {
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = await provider.getSigner();
            const address = await signer.getAddress();

            walletAddressDisplay.innerText = `Connected: ${address.substring(0, 6)}...${address.substring(38)}`;
            connectBtn.innerText = "Wallet Connected";
            connectBtn.disabled = true;
        } catch (error) {
            console.error(error);
            alert("Failed to connect wallet: " + (error.message || error));
        }
    } else {
        alert("Please install MetaMask!");
    }
});

// Create Contract
createContractBtn.addEventListener('click', async () => {
    if (!signer) return alert("Please connect wallet first");

    // Check if Bytecode is updated
    if (!AGREEMENT_BYTECODE || AGREEMENT_BYTECODE.includes("YOUR_BYTECODE")) {
        alert("Bytecode missing! Please compile Agreement.sol in Remix, copy the Bytecode, and paste it into abis.js");
        return;
    }

    const freelancerAddr = document.getElementById('freelancerAddress').value;
    const agreementText = document.getElementById('agreementText').value;
    const paymentEth = document.getElementById('paymentAmount').value;

    if (!freelancerAddr || !agreementText || !paymentEth) return alert("Please fill all fields");

    deployStatus.innerText = "Deploying... Please confirm in MetaMask.";

    try {
        const factory = new ethers.ContractFactory(AGREEMENT_ABI, AGREEMENT_BYTECODE, signer);
        const amountWei = ethers.parseEther(paymentEth);

        const contract = await factory.deploy(freelancerAddr, agreementText, { value: amountWei });
        deployStatus.innerText = "Waiting for confirmation...";

        await contract.waitForDeployment();
        const address = await contract.getAddress();

        deployStatus.innerText = `Contract Deployed at: ${address}`;
        contractAddressInput.value = address;

        // Auto load
        loadContract(address);
    } catch (error) {
        console.error(error);
        deployStatus.innerText = `Error: ${error.message}`;
    }
});

// Load Contract
loadContractBtn.addEventListener('click', () => {
    const address = contractAddressInput.value;
    if (ethers.isAddress(address)) {
        loadContract(address);
    } else {
        alert("Invalid address");
    }
});

async function loadContract(address) {
    if (!signer) return alert("Connect wallet first");

    try {
        agreementContract = new ethers.Contract(address, AGREEMENT_ABI, signer);
        await refreshContractDetails();
        contractDetails.classList.remove('hidden');
    } catch (error) {
        console.error(error);
        alert("Failed to load contract");
    }
}

async function refreshContractDetails() {
    if (!agreementContract) return;

    try {
        const details = await agreementContract.getDetails();
        // details = [client, freelancer, text, amount, status]

        const statusIdx = Number(details[4]); // Convert bigint to number if needed
        document.getElementById('displayFreelancer').innerText = details[1];
        document.getElementById('displayAmount').innerText = ethers.formatEther(details[3]);
        document.getElementById('contractStatus').innerText = statusMap[statusIdx];
    } catch (error) {
        console.error("Error fetching details:", error);
    }
}

// Confirm Work
document.getElementById('confirmWorkBtn').addEventListener('click', async () => {
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

// Release Payment
document.getElementById('releasePaymentBtn').addEventListener('click', async () => {
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
