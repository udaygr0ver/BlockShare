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

loginBtn.addEventListener('click', connectWallet);

// Handle Account Changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => handleLogout());
}

function handleLogout() {
    currentUserAddress = null;
    currentSignature = null;
    loginSection.style.display = 'block';
    dashboardSection.style.display = 'none';
    myFilesList.innerHTML = '';
    if (fileNameDisplay) fileNameDisplay.textContent = '';
    fileInput.value = '';
    loginStatus.textContent = '';
    loginBtn.classList.add('pulse');
}

logoutBtn.addEventListener('click', handleLogout);

// Fetch and Render Files
async function fetchFiles() {
    if (!currentUserAddress || !currentSignature) return;
    
    myFilesList.innerHTML = '<div class="loading">Scanning Secure Vault...</div>';
    
    try {
        const response = await fetch(`/my-files/${currentUserAddress}?signature=${currentSignature}`);
        const files = await response.json();
        
        if (!response.ok) throw new Error(files.error);

        myFilesList.innerHTML = '';
        fileCountBadge.textContent = files.length;
        
        if (files.length === 0) {
            myFilesList.innerHTML = '<div class="no-files">Your vault is empty.</div>';
            return;
        }
        
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <span class="file-icon">📄</span>
                    <div class="file-details">
                        <span class="file-name">${file.name || 'Unnamed Asset'}</span>
                        <span class="file-cid">${file.cid.substring(0, 10)}...${file.cid.substring(file.cid.length - 4)}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="action-btn" title="Download" onclick="downloadFile(${file.index}, '${file.name}')">📥</button>
                    <button class="action-btn" title="Share" onclick="openShareModal(${file.index})">🔗</button>
                    <button class="action-btn delete" title="Delete" onclick="deleteFile(${file.index})">🗑️</button>
                </div>
            `;
            myFilesList.appendChild(fileItem);
        });
    } catch (err) {
        myFilesList.innerHTML = `<div class="status-msg error">Vault Sync Error: ${err.message}</div>`;
    }
}

refreshBtn.addEventListener('click', fetchFiles);
