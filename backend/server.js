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
