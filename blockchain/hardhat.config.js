require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",          // Must match pragma in Voting.sol

  networks: {
    // Default local Hardhat network (in-memory, fastest for testing)
    hardhat: {},

    // Localhost node started with `npx hardhat node`
    localhost: {
      url: "http://127.0.0.1:8545",
    },

    // ── Sepolia Testnet (public, free) ────────────────────────────────────────
    sepolia: {
      url: process.env.ALCHEMY_SEPOLIA_URL || "",
      accounts: process.env.SEPOLIA_PRIVATE_KEY
        ? [process.env.SEPOLIA_PRIVATE_KEY]
        : [],
    },
  },
};
