// import "@nomicfoundation/hardhat-toolbox";

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: "0.8.20",
    settings: {
      evmVersion: "london",
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:7545",
    },
  },
};

export default config;
