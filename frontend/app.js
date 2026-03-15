// app.js
let currentUserAddress = null;
let currentSignature = null;
let currentShareIndex = null;
const AUTH_MESSAGE = "Authenticate to Secure File Sharing";

// UI Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginBtn = document.getElementById('loginBtn');
const loginStatus = document.getElementById('loginStatus');
const logoutBtn = document.getElementById('logoutBtn');
const currentAddrDisplay = document.getElementById('currentUserAddr');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');
const myFilesList = document.getElementById('myFilesList');
const refreshBtn = document.getElementById('refreshBtn');
const uploadArea = document.getElementById('uploadArea');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const fileCountBadge = document.getElementById('fileCountBadge');

// Modal Elements
const shareModal = document.getElementById('shareModal');
const shareAddressInput = document.getElementById('shareAddress');
const confirmShareBtn = document.getElementById('confirmShare');
const closeModalBtn = document.getElementById('closeModal');
const shareStatus = document.getElementById('shareStatus');

// MetaMask Login Logic
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        showStatus(loginStatus, 'Please install MetaMask to use SecureVault.', 'error');
        return;
    }

    try {
        loginBtn.textContent = 'Connecting...';
        loginBtn.classList.remove('pulse');
        
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        
        showStatus(loginStatus, 'Please sign the secure vault key in MetaMask...', '');

        const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [AUTH_MESSAGE, address],
        });

        currentUserAddress = address;
        currentSignature = signature;
        
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        currentAddrDisplay.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        
        fetchFiles();
    } catch (err) {
        console.error(err);
        showStatus(loginStatus, 'Authentication failed: ' + err.message, 'error');
        loginBtn.classList.add('pulse');
    } finally {
        loginBtn.textContent = 'Connect MetaMask';
    }
}
