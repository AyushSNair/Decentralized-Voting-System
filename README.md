# 🗳️ DecentraVote — Decentralized Voting System

A full-stack decentralized voting DApp built as a college mini-project using:
**Solidity · Hardhat · Ethereum · React.js · Ethers.js · MetaMask**

---

## 📁 Folder Structure

```
Decentralized Voting System/
├── blockchain/                  ← Smart contract & Hardhat project
│   ├── contracts/
│   │   └── Voting.sol           ← Main smart contract
│   ├── scripts/
│   │   └── deploy.js            ← Deployment script
│   ├── test/
│   │   └── Voting.test.js       ← Unit tests
│   ├── hardhat.config.js
│   └── package.json
│
└── frontend/                    ← React DApp
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Header.js        ← Top navbar with timer & wallet
    │   │   └── CandidateCard.js ← Candidate vote card
    │   ├── App.js               ← Main app logic
    │   ├── VotingABI.js         ← Contract ABI (interface)
    │   ├── index.js             ← React entry point
    │   └── index.css            ← Styles
    ├── .env.example
    └── package.json
```

---

## ⚙️ Prerequisites

Make sure you have the following installed:

| Tool       | Version     | Download |
|------------|-------------|---------|
| Node.js    | ≥ 18.x      | https://nodejs.org |
| npm        | ≥ 9.x       | Comes with Node.js |
| MetaMask   | Browser ext | https://metamask.io |

---

## 🚀 Step-by-Step Setup

### Step 1 — Install Blockchain Dependencies

```bash
cd blockchain
npm install
```

### Step 2 — Compile the Smart Contract

```bash
npx hardhat compile
```

You should see: `Compiled 1 Solidity file successfully`

### Step 3 — Run Tests (Optional but Recommended)

```bash
npx hardhat test
```

Expected output: all tests pass ✅

### Step 4 — Start the Local Blockchain

Open a **new terminal** and run:

```bash
npx hardhat node
```

> This starts a local Ethereum node at `http://127.0.0.1:8545`  
> It prints 20 test accounts with private keys — **keep this terminal open!**

### Step 5 — Deploy the Contract

In a **second terminal** (while the node is running):

```bash
npx hardhat run scripts/deploy.js --network localhost
```

You will see output like:

```
✅ Voting contract deployed!
   Contract address: 0xYourContractAddress...
   Voting duration:   60 minutes

Adding initial candidates...
   ✓ Added candidate: Alice Johnson
   ✓ Added candidate: Bob Smith
   ✓ Added candidate: Carol Williams

🎉 Setup complete! Paste this into your frontend .env:
   REACT_APP_CONTRACT_ADDRESS=0xYourContractAddress...
```

**Copy that contract address!**

### Step 6 — Configure the Frontend

```bash
cd ../frontend
cp .env.example .env
```

Open `.env` and paste your contract address:

```
REACT_APP_CONTRACT_ADDRESS=0xYourContractAddress...
```

> **Alternative:** You can also directly paste the address into `src/App.js` line where `CONTRACT_ADDRESS` is defined.

### Step 7 — Install Frontend Dependencies

```bash
npm install
```

### Step 8 — Start the React App

```bash
npm start
```

Opens at: **http://localhost:3000**

---

## 🦊 MetaMask Setup (IMPORTANT)

### Add the Local Hardhat Network to MetaMask:

1. Open MetaMask → Click the network dropdown → **Add Network**
2. Fill in:
   - **Network Name:** Hardhat Local
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
3. Click **Save**

### Import a Test Account:

1. From the `npx hardhat node` output, copy a private key
2. MetaMask → Account icon → **Import Account**
3. Paste the private key → **Import**

> These test accounts come pre-loaded with 10,000 ETH for testing!

---

## 📖 How the System Works (Step-by-Step)

### 1. Deployment
- The admin (deployer) runs `deploy.js`
- The `Voting` contract is deployed with a 60-minute voting window
- Three candidates are automatically added

### 2. Frontend Loads
- React app starts; user clicks **Connect MetaMask**
- Ethers.js creates a `BrowserProvider` from `window.ethereum`
- The app reads all candidates from the blockchain via `getCandidates()`
- It checks if the current wallet has already voted via `hasVoted(address)`

### 3. Voting
- User clicks **Vote** on a candidate card
- MetaMask pops up asking to confirm the transaction
- User confirms → transaction is sent to the blockchain
- The `vote()` function on the contract runs:
  - Checks voting is active (time window)
  - Checks `hasVoted[msg.sender]` is false
  - Sets `hasVoted[msg.sender] = true`
  - Increments `candidates[id].voteCount`
  - Emits `VoteCast` event
- Frontend listens for the event and refreshes vote counts

### 4. Results
- All vote counts are publicly visible on-chain
- The progress bars update in real-time as votes come in
- The countdown timer shows remaining voting time

---

## 🔐 How Double Voting is Prevented

```solidity
mapping(address => bool) public hasVoted;

function vote(uint256 _candidateId) public votingActive {
    require(!hasVoted[msg.sender], "You have already voted.");  // 🔒 Check
    hasVoted[msg.sender] = true;                               // 🔒 Mark
    candidates[_candidateId].voteCount += 1;
    emit VoteCast(msg.sender, _candidateId);
}
```

- Every Ethereum address is **unique** (tied to a private key)
- The `hasVoted` mapping stores `true` once an address votes
- This check happens **inside the blockchain** — it cannot be bypassed
- Even if someone has multiple MetaMask accounts, each address gets exactly one vote

---

## 💾 What is Stored on the Blockchain?

| Data | Type | Description |
|------|------|-------------|
| `owner` | `address` | Admin who deployed the contract |
| `votingStart` | `uint256` | Unix timestamp of voting start |
| `votingEnd` | `uint256` | Unix timestamp of voting end |
| `candidates[]` | `Candidate[]` | Array of structs (id, name, voteCount) |
| `hasVoted` | `mapping(address→bool)` | Tracks who has voted |

Everything above is **immutable, transparent, and tamper-proof** — anyone can verify the results by querying the contract.

---

## ⛽ Gas Fees Explained

Gas is the fee paid to Ethereum miners/validators for running computations.

| Action | Estimated Gas | Why? |
|--------|--------------|------|
| `addCandidate()` | ~80,000 gas | Writes a new struct to storage |
| `vote()` | ~50,000 gas | Writes to mapping + increments counter |
| `getCandidates()` | 0 gas | Read-only (view function) |
| `hasVoted()` | 0 gas | Read-only (view function) |

**On the local Hardhat network**, gas is free (test ETH).  
**On Ethereum mainnet**, gas costs real ETH (e.g., ~$0.50–$5 depending on network congestion).

---

## 🛠️ Available Commands

### Blockchain (in `blockchain/` folder)

```bash
npx hardhat compile         # Compile contracts
npx hardhat test            # Run tests
npx hardhat node            # Start local network
npx hardhat run scripts/deploy.js --network localhost  # Deploy
```

### Frontend (in `frontend/` folder)

```bash
npm start    # Start dev server at localhost:3000
npm run build   # Build for production
```

---

## ✅ Features Checklist

- [x] Admin can add candidates (protected by `onlyOwner`)
- [x] Users can vote for candidates
- [x] Double voting prevented (mapping + require)
- [x] Events emitted on every vote (`VoteCast`)
- [x] Voting time window (start + end time)
- [x] MetaMask wallet connection
- [x] Live vote count display with progress bars
- [x] Countdown timer
- [x] "Already voted" message shown
- [x] Handles MetaMask account changes
- [x] Full unit test suite

---

## 🎓 Built For: College Mini Project
**Tech Stack:** Solidity · Hardhat · Ethers.js v6 · React 18 · MetaMask
