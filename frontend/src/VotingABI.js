// src/VotingABI.js
// ─────────────────────────────────────────────────────────────────────────────
// ABI (Application Binary Interface) for the Voting smart contract.
// This tells ethers.js how to talk to the contract on the blockchain.
//
// ⚠️  After deploying, copy the auto-generated ABI from:
//     blockchain/artifacts/contracts/Voting.sol/Voting.json  →  "abi" array
// and paste it below (replace the existing array).
// ─────────────────────────────────────────────────────────────────────────────

const VotingABI = [
  // ── Constructor ─────────────────────────────────────────────────────────────
  {
    "inputs": [{ "internalType": "uint256", "name": "_durationInMinutes", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },

  // ── Events ───────────────────────────────────────────────────────────────────
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "uint256", "name": "id",   "type": "uint256" },
      { "indexed": false, "internalType": "string",  "name": "name", "type": "string"  }
    ],
    "name": "CandidateAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "voter",       "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "candidateId", "type": "uint256" }
    ],
    "name": "VoteCast",
    "type": "event"
  },

  // ── State Variable Getters (public) ──────────────────────────────────────────
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "votingStart",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "votingEnd",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "hasVoted",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },

  // ── Write Functions ───────────────────────────────────────────────────────────
  {
    "inputs": [{ "internalType": "string", "name": "_name", "type": "string" }],
    "name": "addCandidate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_candidateId", "type": "uint256" }],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // ── Read Functions ────────────────────────────────────────────────────────────
  {
    "inputs": [],
    "name": "getCandidates",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id",        "type": "uint256" },
          { "internalType": "string",  "name": "name",      "type": "string"  },
          { "internalType": "uint256", "name": "voteCount", "type": "uint256" }
        ],
        "internalType": "struct Voting.Candidate[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCandidateCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRemainingTime",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isVotingActive",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
];

export default VotingABI;
