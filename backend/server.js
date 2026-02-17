import express from "express";
import cors from "cors";
import CryptoJS from "crypto-js";
import { create } from "ipfs-http-client";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.static(path.resolve("./frontend")));

const ipfs = create({ host: "127.0.0.1", port: 5001, protocol: "http" });

const artifactPath = path.resolve("./artifacts/contracts/FileStorage.sol/FileStorage.json");
const ENCRYPTION_KEY = "secure-key";
const AUTH_MESSAGE = "Authenticate to Secure File Sharing";

// Contract Configuration
const CONTRACT_ADDRESS = "0xEC02f863553f20Fc9B86A4dd0CF5BBA39701714C";
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");

function getContract(signerOrProvider) {
  if (!fs.existsSync(artifactPath)) {
    throw new Error("Contract artifact not found. Please compile the contract.");
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  return new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, signerOrProvider);
}

// Security: Verify signature
function verifyAuth(userAddress, signature) {
    if (!userAddress || !signature) return false;
    try {
        const recoveredAddress = ethers.verifyMessage(AUTH_MESSAGE, signature);
        return recoveredAddress.toLowerCase() === userAddress.toLowerCase();
    } catch (e) {
        return false;
    }
}

// 1. Upload API
app.post("/upload", async (req, res) => {
  try {
    let { fileData, fileName, userAddress, signature } = req.body;
    
    if (!verifyAuth(userAddress, signature)) {
        return res.status(401).json({ error: "Unauthorized: Invalid signature" });
    }

    userAddress = ethers.getAddress(userAddress);
    const encrypted = CryptoJS.AES.encrypt(fileData, ENCRYPTION_KEY).toString();
    const result = await ipfs.add(encrypted);
    const cid = result.cid.toString();

    const signer = await provider.getSigner(userAddress);
    const contract = getContract(signer);
    
    const tx = await contract.uploadFile(cid, fileName);
    await tx.wait();

    res.json({ message: "Upload successful", cid, txHash: tx.hash });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Retrieval API (Checks access)
app.get("/file/:index", async (req, res) => {
  try {
    const { index } = req.params;
    const { userAddress, signature } = req.query;

    if (!verifyAuth(userAddress, signature)) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const signer = await provider.getSigner(userAddress);
    const contract = getContract(signer);

    const allowed = await contract.hasAccess(index, userAddress);
    if (!allowed) {
      return res.status(403).json({ error: "Access Denied" });
    }

    // Log Access (Tx to emit event)
    try {
        const tx = await contract.logAccess(index, userAddress);
        await tx.wait();
    } catch (e) {
        // Fallback if logAccess fails or is not in contract
    }

    // Send proxy URL to frontend for decryption
    // Use the request host to make it work on any IP/Domain
    const protocol = req.protocol;
    const host = req.get('host');
    const file = await contract.getFile(index);
    res.json({ cid: file.hash, downloadUrl: `${protocol}://${host}/download/${file.hash}` });
  } catch (err) {
    console.error("Retrieval error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Download and Decrypt API
app.get("/download/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    const response = await fetch(`http://127.0.0.1:8080/ipfs/${cid}`);
    const encryptedData = await response.text();

    if (!encryptedData) return res.status(404).send("File not found on IPFS");

    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    res.send(decryptedData);
  } catch (err) {
    res.status(500).send("Decryption Error");
  }
});

// 4. Share API
app.post("/share", async (req, res) => {
  try {
    const { index, shareWith, userAddress, signature } = req.body;

    if (!verifyAuth(userAddress, signature)) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const signer = await provider.getSigner(userAddress);
    const contract = getContract(signer);

    const tx = await contract.grantAccess(index, shareWith);
    await tx.wait();

    res.json({ message: "Access granted successfully", txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
