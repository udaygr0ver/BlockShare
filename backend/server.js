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
