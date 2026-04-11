# Secure File Sharing Project

This project allows users to securely upload, encrypt, and share files using IPFS and Ethereum.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [MetaMask](https://metamask.io/) browser extension
- [Ganache](https://trufflesuite.com/ganache/) (Local Blockchain)
- [IPFS Desktop](https://docs.ipfs.tech/install/ipfs-desktop/) or IPFS CLI

## Setup Instructions

### 1. Install Dependencies
Run the following command in the root directory:
```bash
npm install
```

### 2. Start Local Blockchain
- Open **Ganache** and create a new workspace.
- Ensure it is running on `http://127.0.0.1:7545`.
- Import one of the Ganache accounts into **MetaMask** using its private key.

### 3. Deploy Smart Contract
- Compile the contract:
  ```bash
  npx hardhat compile
  ```
- Deploy the contract to the local blockchain:
  ```bash
  node scripts/deploy.js
  ```
- **Copy the deployed contract address** from the terminal output.

### 4. Update Configuration
- Open `backend/server.js`.
- Update the `CONTRACT_ADDRESS` constant (line 21) with your new contract address.

### 5. Start IPFS
- Ensure your IPFS node is running.
- The default API port should be `5001` and Gateway port `8080`.

### 6. Start the Backend Server
```bash
node backend/server.js
```
*Note: If the server is set to port 80, you might need `sudo node backend/server.js` or change the port in `backend/server.js` (line 200).*

### 7. Access the Application
- Open your browser and navigate to `http://localhost`.
- Connect your MetaMask wallet (ensure it's connected to the Ganache network).
- Sign the authentication message to log in.

## Project Structure
- `contracts/`: Solidity smart contracts.
- `backend/`: Express server handling encryption, IPFS, and blockchain logic.
- `frontend/`: Web interface (HTML/JS/CSS).
- `scripts/`: Deployment scripts.
