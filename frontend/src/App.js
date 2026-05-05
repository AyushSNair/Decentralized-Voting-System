// src/App.js
// ─────────────────────────────────────────────────────────────────────────────
// Main application component.
// Handles:
//  - MetaMask wallet connection
//  - Reading candidates from the smart contract
//  - Casting votes via the smart contract
//  - Displaying live vote counts and status messages
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import Header from "./components/Header";
import CandidateCard from "./components/CandidateCard";
import ResultsPage from "./components/ResultsPage";
import VotingABI from "./VotingABI";
import "./index.css";

// ── Contract address: paste here after deployment ──────────────────────────
// You can find this in the deploy script output or in .env file.
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "PASTE_CONTRACT_ADDRESS_HERE";

function App() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [account, setAccount]           = useState(null);       // Connected wallet address
  const [contract, setContract]         = useState(null);       // Ethers contract instance
  const [candidates, setCandidates]     = useState([]);         // List of candidates
  const [hasVoted, setHasVoted]         = useState(false);      // Whether current user voted
  const [isRegistered, setIsRegistered] = useState(false);      // Whether current user is a registered voter
  const [isActive, setIsActive]         = useState(false);      // Is voting window open?
  const [remainingTime, setRemainingTime] = useState(0);        // Seconds left
  const [votingFor, setVotingFor]       = useState(null);       // ID being voted on (pending tx)
  const [statusMsg, setStatusMsg]       = useState("");         // User feedback message
  const [statusType, setStatusType]     = useState("info");     // "info" | "success" | "error"
  const [loading, setLoading]           = useState(false);      // Page loading flag

  // ── Helper: show a status message ─────────────────────────────────────────
  const showStatus = (msg, type = "info") => {
    setStatusMsg(msg);
    setStatusType(type);
  };

  // ── Load candidates from contract ─────────────────────────────────────────
  const loadCandidates = useCallback(async (contractInstance) => {
    try {
      const rawCandidates = await contractInstance.getCandidates();
      // Convert BigInt values from ethers v6 to plain numbers for display
      const parsed = rawCandidates.map((c) => ({
        id: Number(c.id),
        name: c.name,
        voteCount: Number(c.voteCount),
      }));
      setCandidates(parsed);
    } catch (err) {
      console.error("Error loading candidates:", err);
    }
  }, []);

  // ── Load voting status (active, remaining time) ────────────────────────────
  const loadVotingStatus = useCallback(async (contractInstance) => {
    try {
      const active    = await contractInstance.isVotingActive();
      const timeLeft  = await contractInstance.getRemainingTime();
      setIsActive(active);
      setRemainingTime(Number(timeLeft));
    } catch (err) {
      console.error("Error loading voting status:", err);
    }
  }, []);

  // ── Check if connected account already voted ───────────────────────────────
  const checkIfVoted = useCallback(async (contractInstance, userAddress) => {
    try {
      const voted = await contractInstance.hasVoted(userAddress);
      setHasVoted(voted);
    } catch (err) {
      console.error("Error checking vote status:", err);
    }
  }, []);

  // ── Check if connected account is a registered voter ──────────────────────
  const checkIfRegistered = useCallback(async (contractInstance, userAddress) => {
    try {
      const registered = await contractInstance.isRegisteredVoter(userAddress);
      setIsRegistered(registered);
    } catch (err) {
      console.error("Error checking registration status:", err);
    }
  }, []);

  // ── Connect MetaMask wallet ────────────────────────────────────────────────
  const connectWallet = async () => {
    if (!window.ethereum) {
      showStatus("MetaMask is not installed. Please install it to continue.", "error");
      return;
    }

    try {
      showStatus("Connecting to MetaMask...", "info");

      // Request account access from MetaMask
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const userAddress = accounts[0];
      setAccount(userAddress);

      // ── Network Check: Auto-switch to Sepolia Testnet (Chain ID 11155111) ──
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      const chainIdDecimal = parseInt(chainId, 16);
      if (chainIdDecimal !== 11155111) {
        showStatus("Wrong network detected — switching to Sepolia Testnet...", "info");
        try {
          // Try to switch to Sepolia
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }], // 11155111 in hex
          });
        } catch (switchErr) {
          // If the network doesn't exist in MetaMask yet, add it
          if (switchErr.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: "0xaa36a7",
                chainName: "Sepolia Testnet",
                rpcUrls: ["https://rpc.sepolia.org"],
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              }],
            });
          } else {
            throw switchErr;
          }
        }
        // After switching, reload so everything re-initialises on correct network
        window.location.reload();
        return;
      }


      // Create ethers provider and signer (ethers v6 syntax)
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();

      // Instantiate the contract with the ABI and signer
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, VotingABI, signer);
      setContract(contractInstance);

      // Load initial data
      setLoading(true);
      await Promise.all([
        loadCandidates(contractInstance),
        loadVotingStatus(contractInstance),
        checkIfVoted(contractInstance, userAddress),
        checkIfRegistered(contractInstance, userAddress),
      ]);
      setLoading(false);

      showStatus(`Connected: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`, "success");

      // Listen for real-time VoteCast events on the blockchain
      contractInstance.on("VoteCast", async () => {
        // Refresh candidates whenever any vote is cast
        await loadCandidates(contractInstance);
      });
    } catch (err) {
      console.error("Wallet connection error:", err);
      showStatus("Failed to connect wallet. Make sure MetaMask is unlocked.", "error");
      setLoading(false);
    }
  };


  // ── Cast a vote ────────────────────────────────────────────────────────────
  const castVote = async (candidateId) => {
    if (!contract) {
      showStatus("Please connect your wallet first.", "error");
      return;
    }
    if (!isRegistered) {
      showStatus("Your wallet address is not registered to vote in this election.", "error");
      return;
    }
    if (hasVoted) {
      showStatus("You have already cast your vote.", "error");
      return;
    }
    if (!isActive) {
      showStatus("Voting is not currently active.", "error");
      return;
    }

    try {
      setVotingFor(candidateId);
      showStatus("Sending transaction... Please confirm in MetaMask.", "info");

      // Call the vote() function on the smart contract
      const tx = await contract.vote(candidateId);

      showStatus("Transaction submitted! Waiting for confirmation...", "info");

      // Wait for the tx to be mined
      await tx.wait();

      setHasVoted(true);
      setVotingFor(null);
      showStatus("🎉 Your vote has been recorded on the blockchain!", "success");

      // Only refresh candidates — do NOT re-fetch votingStatus here.
      // Re-fetching getRemainingTime() after a tx can return a stale/cached
      // value from MetaMask, causing the timer to jump back to the old value.
      // The local countdown is already accurate.
      await loadCandidates(contract);
    } catch (err) {
      console.error("Vote error:", err);
      setVotingFor(null);

      // On Sepolia, revert reasons often come back as null.
      // Re-check the chain to give the user a meaningful message.
      const reason = err?.reason || err?.message || "";

      if (reason.includes("user rejected") || reason.includes("ACTION_REJECTED")) {
        showStatus("Transaction rejected in MetaMask.", "error");
        return;
      }

      if (reason.includes("already voted")) {
        showStatus("You have already voted!", "error");
        setHasVoted(true);
        return;
      }

      if (reason.includes("not a registered voter")) {
        showStatus("Your wallet is not registered to vote in this election.", "error");
        setIsRegistered(false);
        return;
      }

      if (reason.includes("ended")) {
        showStatus("Voting has ended.", "error");
        setIsActive(false);
        return;
      }

      // CALL_EXCEPTION with null reason (common on Sepolia) — re-check chain state
      if (err?.code === "CALL_EXCEPTION" || reason === "") {
        try {
          const stillActive = await contract.isVotingActive();
          const alreadyVoted = await contract.hasVoted(account);
          if (!stillActive) {
            showStatus("⏰ Voting has ended — the 2-minute window closed before your transaction was confirmed. Please redeploy the contract to start a new round.", "error");
            setIsActive(false);
          } else if (alreadyVoted) {
            showStatus("You have already voted!", "error");
            setHasVoted(true);
          } else {
            showStatus("Transaction failed. Please try again.", "error");
          }
        } catch {
          showStatus("Transaction failed on-chain. The voting window may have expired.", "error");
        }
        return;
      }

      showStatus(`Error: ${reason}`, "error");
    }
  };

  // ── Countdown timer (ticks every second) ──────────────────────────────────
  // NOTE: We intentionally do NOT re-sync from the chain inside this interval.
  // On a local Hardhat node, block.timestamp only advances when transactions
  // are mined, so re-syncing would reset the timer backwards every 30s.
  // The initial value is fetched once on connect via loadVotingStatus().
  useEffect(() => {
    if (!contract) return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        const next = prev > 0 ? prev - 1 : 0;
        if (next === 0) setIsActive(false);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [contract]); // ← only re-run if contract changes, not every second

  // ── Handle MetaMask account changes ───────────────────────────────────────
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        // Reload page to re-initialize with new account
        window.location.reload();
      });
    }
  }, []);

  // ── Compute total votes for percentage bars ────────────────────────────────
  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <Header account={account} isActive={isActive} remainingTime={remainingTime} />

      <main className="main-content">
        {/* ── Status Banner ── */}
        {statusMsg && (
          <div className={`status-banner ${statusType}`}>
            {statusType === "success" && "✅ "}
            {statusType === "error"   && "❌ "}
            {statusType === "info"    && "ℹ️ "}
            {statusMsg}
          </div>
        )}

        {/* ── Not Connected State ── */}
        {!account ? (
          <div className="connect-section">
            <div className="connect-card">
              <div className="connect-icon">🦊</div>
              <h2>Connect Your Wallet</h2>
              <p>Connect MetaMask to participate in the election.</p>
              <button className="connect-btn" onClick={connectWallet}>
                Connect MetaMask
              </button>
              <p className="hint">
                Make sure MetaMask is installed, unlocked, and connected to
                the <strong>Sepolia Testnet</strong> (Chain ID: 11155111).
                Get free Sepolia ETH at{" "}
                <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer">sepoliafaucet.com</a>.
              </p>
            </div>
          </div>
        ) : loading ? (
          /* ── Loading Spinner ── */
          <div className="loading-section">
            <div className="spinner-large">⏳</div>
            <p>Loading candidates from blockchain...</p>
          </div>
        ) : (
          <>
            {/* ── Already Voted Banner (only during active voting) ── */}
            {hasVoted && isActive && (
              <div className="voted-banner">
                ✅ You have already voted in this election. Your vote is recorded on the blockchain.
              </div>
            )}

            {/* ── RESULTS PAGE: shown when voting has ended ── */}
            {!isActive ? (
              <ResultsPage
                candidates={candidates}
                totalVotes={totalVotes}
                hasVoted={hasVoted}
              />
            ) : (
              <>
                {/* ── Summary Bar ── */}
                <div className="summary-bar">
                  <div className="summary-item">
                    <span className="summary-num">{candidates.length}</span>
                    <span className="summary-label">Candidates</span>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-item">
                    <span className="summary-num">{totalVotes}</span>
                    <span className="summary-label">Total Votes</span>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-item">
                    <span className="summary-num green">Active</span>
                    <span className="summary-label">Status</span>
                  </div>
                </div>

                {/* ── Candidates Grid ── */}
                {candidates.length === 0 ? (
                  <div className="no-candidates">
                    No candidates have been added yet.
                  </div>
                ) : (
                  <div className="candidates-grid">
                    {candidates.map((candidate) => (
                      <CandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        totalVotes={totalVotes}
                        onVote={castVote}
                        hasVoted={hasVoted}
                        isActive={isActive}
                        votingFor={votingFor}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <p>
          🔗 Powered by Ethereum · Smart Contract:{" "}
          <a
            href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {CONTRACT_ADDRESS !== "PASTE_CONTRACT_ADDRESS_HERE"
              ? `${CONTRACT_ADDRESS.slice(0, 10)}...`
              : "Not deployed"}
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
