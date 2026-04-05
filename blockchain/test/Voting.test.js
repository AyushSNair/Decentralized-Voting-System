// test/Voting.test.js
// ─────────────────────────────────────────────────────────────────────────────
// Unit tests for the Voting smart contract using Hardhat + Chai.
// Run: npx hardhat test
// ─────────────────────────────────────────────────────────────────────────────

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", function () {
  let voting;
  let owner;        // The admin account (deployer)
  let voter1;       // A regular voter
  let voter2;       // Another voter

  // Deploy a fresh contract before every test
  beforeEach(async function () {
    [owner, voter1, voter2] = await ethers.getSigners();

    const Voting = await ethers.getContractFactory("Voting");
    // Deploy with 60-minute voting window
    voting = await Voting.deploy(60);
    await voting.waitForDeployment();
  });

  // ── Deployment Tests ──────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await voting.owner()).to.equal(owner.address);
    });

    it("Should start with zero candidates", async function () {
      expect(await voting.getCandidateCount()).to.equal(0);
    });

    it("Should report voting as active right after deployment", async function () {
      expect(await voting.isVotingActive()).to.equal(true);
    });
  });

  // ── Candidate Management Tests ────────────────────────────────────────────

  describe("Adding Candidates", function () {
    it("Should allow owner to add a candidate", async function () {
      await voting.addCandidate("Alice");
      expect(await voting.getCandidateCount()).to.equal(1);

      const candidates = await voting.getCandidates();
      expect(candidates[0].name).to.equal("Alice");
      expect(candidates[0].voteCount).to.equal(0);
    });

    it("Should emit CandidateAdded event", async function () {
      await expect(voting.addCandidate("Bob"))
        .to.emit(voting, "CandidateAdded")
        .withArgs(0, "Bob");
    });

    it("Should NOT allow non-owner to add a candidate", async function () {
      await expect(
        voting.connect(voter1).addCandidate("Eve")
      ).to.be.revertedWith("Only the admin can perform this action.");
    });
  });

  // ── Voting Tests ──────────────────────────────────────────────────────────

  describe("Voting", function () {
    beforeEach(async function () {
      // Add candidates before each voting test
      await voting.addCandidate("Alice");
      await voting.addCandidate("Bob");
    });

    it("Should allow a voter to cast a vote", async function () {
      await voting.connect(voter1).vote(0);

      const candidates = await voting.getCandidates();
      expect(candidates[0].voteCount).to.equal(1);
    });

    it("Should mark the voter as having voted", async function () {
      await voting.connect(voter1).vote(0);
      expect(await voting.hasVoted(voter1.address)).to.equal(true);
    });

    it("Should emit VoteCast event", async function () {
      await expect(voting.connect(voter1).vote(1))
        .to.emit(voting, "VoteCast")
        .withArgs(voter1.address, 1);
    });

    it("Should PREVENT double voting", async function () {
      await voting.connect(voter1).vote(0);
      await expect(
        voting.connect(voter1).vote(1)
      ).to.be.revertedWith("You have already voted.");
    });

    it("Should REJECT voting for invalid candidate ID", async function () {
      await expect(
        voting.connect(voter1).vote(99)
      ).to.be.revertedWith("Invalid candidate ID.");
    });

    it("Should allow multiple different voters to vote", async function () {
      await voting.connect(voter1).vote(0);
      await voting.connect(voter2).vote(0);

      const candidates = await voting.getCandidates();
      expect(candidates[0].voteCount).to.equal(2);
    });
  });

  // ── View Function Tests ───────────────────────────────────────────────────

  describe("View Functions", function () {
    it("Should return all candidates via getCandidates()", async function () {
      await voting.addCandidate("Alice");
      await voting.addCandidate("Bob");

      const candidates = await voting.getCandidates();
      expect(candidates.length).to.equal(2);
      expect(candidates[1].name).to.equal("Bob");
    });

    it("Should return remaining time greater than 0 during voting", async function () {
      const remaining = await voting.getRemainingTime();
      expect(remaining).to.be.gt(0);
    });
  });
});
