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
if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
        console.log("Connect button clicked");
        if (typeof window.ethereum !== 'undefined') {
            try {
                connectBtn.innerText = "Connecting...";
                connectBtn.disabled = true;

                provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);

                if (accounts.length === 0) throw new Error("No accounts found");

                signer = await provider.getSigner();
                const address = await signer.getAddress();

                console.log("Connected to:", address);
                walletAddressDisplay.innerText = `Connected: ${address.substring(0, 6)}...${address.substring(38)}`;
                connectBtn.innerText = "Wallet Connected";
                connectBtn.classList.remove('primary-btn');
                connectBtn.classList.add('success-btn'); // optional visual change

                // Trigger detail refresh if address is loaded
                if (contractAddressInput.value) {
                    loadContractBtn.click();
                }

            } catch (error) {
                console.error("Connection Error:", error);
                alert("Connection Failed: " + (error.message || error));
                connectBtn.innerText = "Connect Wallet";
                connectBtn.disabled = false;
            }
        } else {
            alert("MetaMask is not installed. Please install it to use this app.");
            window.open('https://metamask.io/download/', '_blank');
        }
    });
} else {
    console.error("Connect Button not found in DOM");
}

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
    if (!ethers.isAddress(freelancerAddr)) return alert("Invalid Freelancer Address");

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
            const roleInfo = document.getElementById('roleInfo'); // We will add this element

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
