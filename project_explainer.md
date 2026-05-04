# 🗳️ Decentralized Voting System — Project Explainer

> A full-stack DApp where votes are cast and stored permanently on the Ethereum blockchain.
> No central server. No tampering. No double-voting.

---

## 📐 Architecture at a Glance

```
┌──────────────────────────────────────────────────┐
│                   USER'S BROWSER                 │
│                                                  │
│  React Frontend  ←→  MetaMask Wallet Extension   │
│       ↕ ethers.js (reads & writes)               │
└──────────────┬───────────────────────────────────┘
               │  JSON-RPC (HTTP/WebSocket)
               ▼
┌──────────────────────────────────────────────────┐
│          ETHEREUM BLOCKCHAIN (Sepolia)            │
│                                                  │
│   Voting.sol Smart Contract                      │
│   ├── Stores candidates & vote counts            │
│   ├── Enforces one vote per address              │
│   └── Controls voting time window               │
└──────────────────────────────────────────────────┘
```

**Two main parts:**
| Layer | Technology | Purpose |
|---|---|---|
| **Blockchain** | Solidity + Hardhat | Smart contract: the source of truth |
| **Frontend** | React + ethers.js | UI that reads/writes to the contract |

---

## 1. The Smart Contract — `Voting.sol`

This is the **heart of the project**. It lives on the blockchain and enforces all rules automatically.

### 1.1 State Variables

```solidity
address public owner;       // Admin who deployed the contract
uint256 public votingStart; // Unix timestamp: when voting begins
uint256 public votingEnd;   // Unix timestamp: when voting ends

struct Candidate {
    uint256 id;
    string  name;
    uint256 voteCount;
}

Candidate[] public candidates;           // List of all candidates
mapping(address => bool) public hasVoted; // Tracks who voted
```

- `candidates[]` is an **array** — each element is a `Candidate` struct.
- `hasVoted` is a **mapping** — think of it as a dictionary: `wallet_address → true/false`.

---

### 1.2 Access Control — Modifiers

Modifiers are **reusable conditions** attached to functions. If the condition fails, the whole call reverts.

```solidity
// Only the admin (deployer) can add candidates
modifier onlyOwner() {
    require(msg.sender == owner, "Only the admin can perform this action.");
    _;
}

// Votes are only accepted during the active time window
modifier votingActive() {
    require(block.timestamp >= votingStart, "Voting has not started yet.");
    require(block.timestamp <= votingEnd,   "Voting has ended.");
    _;
}
```

> [!NOTE]
> `msg.sender` is a built-in Solidity variable — it's the wallet address of whoever called the function.
> `block.timestamp` is the current time on the blockchain (in Unix seconds).

---

### 1.3 Constructor — Setting the Clock

```solidity
constructor(uint256 _durationInMinutes) {
    owner      = msg.sender;
    votingStart = block.timestamp;
    votingEnd   = block.timestamp + (_durationInMinutes * 1 minutes);
}
```

When the contract is **deployed**, the deployer becomes `owner`, and the voting window starts **immediately** and lasts for `_durationInMinutes` minutes.

---

### 1.4 The `vote()` Function — Core Logic

```solidity
function vote(uint256 _candidateId) public votingActive {
    require(!hasVoted[msg.sender], "You have already voted.");
    require(_candidateId < candidates.length, "Invalid candidate ID.");

    hasVoted[msg.sender] = true;          // Mark this address as voted
    candidates[_candidateId].voteCount += 1; // Increment vote count

    emit VoteCast(msg.sender, _candidateId); // Fire an event
}
```

**Three layers of protection:**
1. `votingActive` modifier → rejects calls outside the time window
2. `hasVoted[msg.sender]` → rejects if this wallet already voted
3. `_candidateId < candidates.length` → rejects invalid IDs

> [!IMPORTANT]
> Because this is on the blockchain, **all three rules are enforced by math**, not by a server you could hack. Once `hasVoted[address] = true` is written to the chain, it's permanent and public.

---

### 1.5 Events — The Blockchain's Log System

```solidity
event CandidateAdded(uint256 indexed id, string name);
event VoteCast(address indexed voter, uint256 indexed candidateId);
```

Events are **immutable logs** emitted to the blockchain. The frontend listens to `VoteCast` to refresh vote counts in real-time without polling.

---

### 1.6 View Functions — Read Without Paying Gas

```solidity
function getCandidates()    public view returns (Candidate[] memory) { ... }
function getRemainingTime() public view returns (uint256) { ... }
function isVotingActive()   public view returns (bool)    { ... }
```

`view` functions **don't change state** → they're free to call (no gas fees) and return data directly.

---

## 2. Deployment — `deploy.js`

This Hardhat script deploys the contract and seeds it with candidates.

```js
const DURATION_MINUTES = 4; // Voting window: 4 minutes

const Voting = await hre.ethers.getContractFactory("Voting");
const voting = await Voting.deploy(DURATION_MINUTES);
await voting.waitForDeployment();

const candidateNames = ["Ayush Nair", "Siddhi Patil", "Amogh Pandirkar"];
for (const name of candidateNames) {
    const tx = await voting.addCandidate(name);
    await tx.wait(); // Wait for each tx to be mined
}
```

**What happens:**
1. Hardhat compiles `Voting.sol` → generates bytecode + ABI
2. Script deploys the bytecode to the network (Sepolia or localhost)
3. `addCandidate()` is called 3 times → 3 candidates stored on-chain
4. The contract address is printed → pasted into the frontend `.env`

### Hardhat Network Config

```js
// hardhat.config.js
networks: {
    localhost: { url: "http://127.0.0.1:8545" },  // Local dev
    sepolia: {
        url: process.env.ALCHEMY_SEPOLIA_URL,      // Public testnet via Alchemy
        accounts: [process.env.SEPOLIA_PRIVATE_KEY],
    },
}
```

---

## 3. The ABI — The Bridge Between JS and Solidity

`VotingABI.js` is a JSON description of every function and event in the contract.

```js
// Example: the vote() function definition
{
    "inputs": [{ "name": "_candidateId", "type": "uint256" }],
    "name": "vote",
    "stateMutability": "nonpayable",
    "type": "function"
}
```

**Why it's needed:** JavaScript has no idea what functions exist on the contract. The ABI tells `ethers.js` exactly how to encode function calls into raw blockchain transactions.

> [!TIP]
> After every redeployment, the ABI in `blockchain/artifacts/contracts/Voting.sol/Voting.json` is regenerated. If you change the contract, copy the new ABI into `VotingABI.js`.

---

## 4. Frontend — React App

### 4.1 State Management in `App.js`

```js
const [account, setAccount]         = useState(null);  // Connected wallet
const [contract, setContract]       = useState(null);  // Ethers contract instance
const [candidates, setCandidates]   = useState([]);    // Candidates from chain
const [hasVoted, setHasVoted]       = useState(false); // Did user vote?
const [isActive, setIsActive]       = useState(false); // Is window open?
const [remainingTime, setRemainingTime] = useState(0); // Countdown seconds
```

Everything the UI needs is in React state. When state changes → React re-renders the affected components.

---

### 4.2 Wallet Connection Flow

```js
const connectWallet = async () => {
    // 1. Check MetaMask exists
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

    // 2. Verify correct network (Sepolia = Chain ID 11155111)
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (parseInt(chainId, 16) !== 11155111) {
        // Auto-switch or add Sepolia network
        await window.ethereum.request({ method: "wallet_switchEthereumChain", ... });
    }

    // 3. Create ethers provider + signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer   = await provider.getSigner();

    // 4. Attach to the deployed contract
    const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, VotingABI, signer);

    // 5. Load all data in parallel
    await Promise.all([
        loadCandidates(contractInstance),
        loadVotingStatus(contractInstance),
        checkIfVoted(contractInstance, userAddress),
    ]);
};
```

**Step by step:**
| Step | What it does |
|---|---|
| `eth_requestAccounts` | Pops up MetaMask asking user permission |
| Chain ID check | Ensures they're on Sepolia, auto-switches if not |
| `BrowserProvider` | Wraps MetaMask as an ethers.js provider |
| `ethers.Contract(...)` | Creates a JS object that mirrors the Solidity contract |
| `Promise.all` | Fetches candidates, time, voted-status simultaneously |

---

### 4.3 Casting a Vote

```js
const castVote = async (candidateId) => {
    const tx = await contract.vote(candidateId); // Sends a blockchain transaction
    showStatus("Transaction submitted! Waiting for confirmation...");

    await tx.wait(); // Waits until the tx is mined into a block

    setHasVoted(true);
    await loadCandidates(contract); // Refresh vote counts from chain
};
```

**What `contract.vote(candidateId)` actually does:**
1. ethers.js encodes the call using the ABI
2. MetaMask pops up asking the user to sign & pay gas
3. The signed transaction is broadcast to the Ethereum network
4. Miners include it in the next block
5. The Solidity `vote()` function executes on-chain
6. `tx.wait()` resolves once the tx is confirmed

> [!WARNING]
> After a successful vote, **only** `loadCandidates()` is refreshed — NOT `getRemainingTime()`. This is intentional: MetaMask can cache stale chain values, causing the timer to jump. The local JavaScript countdown is already accurate.

---

### 4.4 The Countdown Timer

```js
useEffect(() => {
    if (!contract) return;

    const interval = setInterval(() => {
        setRemainingTime((prev) => {
            const next = prev > 0 ? prev - 1 : 0;
            if (next === 0) setIsActive(false); // Triggers Results page
            return next;
        });
    }, 1000); // Ticks every second

    return () => clearInterval(interval); // Cleanup on unmount
}, [contract]); // Only starts after wallet is connected
```

- Fetched once from `getRemainingTime()` on connect
- Then ticked down locally every second (avoids stale chain reads)
- When it hits 0: `setIsActive(false)` → UI switches to `<ResultsPage>`

---

### 4.5 Real-Time Updates via Events

```js
// Listen for VoteCast events from the blockchain
contractInstance.on("VoteCast", async () => {
    await loadCandidates(contractInstance); // Refresh counts for everyone
});
```

If **another user** votes, the blockchain emits a `VoteCast` event. All connected frontends listening to this event will automatically see updated vote counts — no polling needed.

---

## 5. React Components

### Component Tree

```
<App>
├── <Header>         — Logo, countdown timer, wallet address badge
├── <CandidateCard>  — One card per candidate (shown during active voting)
└── <ResultsPage>    — Winner + full breakdown (shown after voting ends)
```

---

### `Header.js` — Timer Badge

```js
const formatTime = (seconds) => {
    const m   = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

// Renders either "⏱ 03:42 left" (active) or "⛔ Voting Ended"
<div className={`timer-badge ${isActive ? "active" : "ended"}`}>
    {isActive ? `⏱ ${formatTime(remainingTime)} left` : "⛔ Voting Ended"}
</div>
```

---

### `CandidateCard.js` — Vote Button Logic

```js
// Button is disabled if:
// - User already voted (hasVoted)
// - Voting window is closed (!isActive)
// - A transaction for THIS candidate is pending (isVotingForThis)
<button
    onClick={() => onVote(Number(candidate.id))}
    disabled={hasVoted || !isActive || isVotingForThis}
>
    {isVotingForThis ? "⏳" : hasVoted ? "✓ Voted" : "Vote"}
</button>
```

The progress bar width is computed as `(voteCount / totalVotes) * 100%` and reflects live data from the chain.

---

### `ResultsPage.js` — Winner Calculation

```js
// Sort candidates by votes (descending)
const sorted = [...candidates].sort((a, b) => b.voteCount - a.voteCount);
const winner = sorted[0];

// Handle tie: check if top 2 have same count
const isTie = sorted.length > 1 && sorted[0].voteCount === sorted[1].voteCount;
```

Animated progress bars are triggered by a small `useEffect` with a 100ms delay, giving a smooth CSS transition effect on load.

---

## 6. Complete User Journey (End-to-End)

```
User opens the DApp
        │
        ▼
Clicks "Connect MetaMask"
        │
        ├── MetaMask pops up → user approves
        ├── Network check → auto-switch to Sepolia if needed
        └── ethers.js attaches to the Voting contract
                │
                ▼
        Candidates loaded from blockchain
        Countdown timer starts ticking
                │
           ┌────┴──────┐
      hasVoted?       NOT voted?
           │               │
           ▼               ▼
    Shows "✓ Voted"   Clicks "Vote" button
    banner              │
                        ├── MetaMask pops up → user approves gas
                        ├── Transaction broadcast to Sepolia
                        ├── Mined into a block (~12 seconds)
                        └── Vote count refreshed on UI
                                │
                          Timer hits 0:00
                                │
                                ▼
                    Results page animates in
                    🏆 Winner announced
                    Full breakdown with % bars
```

---

## 7. Security Properties

| Property | How it's enforced |
|---|---|
| **One vote per person** | `hasVoted[msg.sender]` mapping on-chain — cannot be bypassed |
| **Time-limited voting** | `block.timestamp` check in `votingActive` modifier |
| **Admin-only candidate adding** | `onlyOwner` modifier checks `msg.sender == owner` |
| **Immutable results** | Votes written to blockchain storage — cannot be deleted or edited |
| **Transparent** | All votes are public events on Etherscan; anyone can audit |
| **No central server** | Smart contract runs on decentralized Ethereum nodes |

---

## 8. Tech Stack Summary

| Tool | Role |
|---|---|
| **Solidity 0.8.19** | Smart contract language |
| **Hardhat** | Compile, test, deploy contracts |
| **ethers.js v6** | JS library to interact with Ethereum |
| **React** | Frontend UI framework |
| **MetaMask** | Browser wallet (signs transactions) |
| **Sepolia Testnet** | Public Ethereum test network (free ETH) |
| **Alchemy** | RPC provider (gateway to Sepolia) |
