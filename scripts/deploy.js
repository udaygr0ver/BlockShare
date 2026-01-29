import { ethers } from "ethers";
import fs from "fs";
import path from "path";

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
  // Use the first account from the provider
  const signer = await provider.getSigner();

  const artifactPath = path.resolve("./artifacts/contracts/FileStorage.sol/FileStorage.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  console.log("Contract deployed at:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
