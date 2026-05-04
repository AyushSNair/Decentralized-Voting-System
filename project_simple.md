# 🗳️ Decentralized Voting System — How It Works

---

## What is it?

A voting app where votes are stored on the **Ethereum blockchain** instead of a regular database. This means votes **cannot be faked, deleted, or changed** by anyone — including the creator.

---

## The Two Parts

| Part | What it does |
|---|---|
| **Smart Contract** (Solidity) | Stores candidates & votes on the blockchain, enforces the rules |
| **Frontend** (React) | The website users interact with via their MetaMask wallet |

---

## How it Works — Step by Step

### 1. Admin Deploys the Contract
The admin runs a script that publishes the `Voting.sol` contract to Ethereum. This sets:
- A **voting time window** (e.g. 4 minutes)
- The **list of candidates** (e.g. Ayush Nair, Siddhi Patil, Amogh Pandirkar)

```js
const voting = await Voting.deploy(4); // 4-minute voting window
await voting.addCandidate("Ayush Nair");
```

---

### 2. User Connects Their Wallet
The voter opens the website and clicks **"Connect MetaMask"**. The app:
- Asks MetaMask for the user's wallet address
- Automatically switches to **Sepolia Testnet** if needed
- Loads the candidate list and remaining time from the blockchain

---

### 3. User Casts a Vote
The voter clicks **"Vote"** on a candidate. The app:
1. Sends a transaction to the smart contract's `vote()` function
2. MetaMask asks the user to **confirm and pay a small gas fee**
3. The vote is written permanently to the blockchain

```solidity
function vote(uint256 _candidateId) public {
    require(!hasVoted[msg.sender], "Already voted.");  // No double voting
    hasVoted[msg.sender] = true;
    candidates[_candidateId].voteCount += 1;
}
```

---

### 4. Timer Runs Out → Results Appear
When the countdown hits **0:00**, the site automatically switches to the Results page showing:
- 🏆 The winner (or a tie)
- Vote count and percentage for each candidate

---

## Key Rules (Enforced by the Contract)

- ✅ **One vote per wallet** — the contract tracks every address that voted
- ✅ **Time-limited** — votes are only accepted within the time window
- ✅ **Admin-only setup** — only the deployer can add candidates
- ✅ **Tamper-proof** — once written to the blockchain, votes can never be changed

---

## Tech Used

`Solidity` · `Hardhat` · `React` · `ethers.js` · `MetaMask` · `Sepolia Testnet`
