// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Voting
 * @dev A decentralized voting smart contract.
 *      Only the owner (admin) can add candidates.
 *      Each address can vote only once.
 *      Voting is only allowed within the defined time window.
 */
contract Voting {
    // ─── State Variables ───────────────────────────────────────────────────────

    address public owner;           // Admin who deployed the contract
    uint256 public votingStart;     // Unix timestamp when voting begins
    uint256 public votingEnd;       // Unix timestamp when voting ends

    // Struct to hold each candidate's info
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    // Dynamic array of all candidates
    Candidate[] public candidates;

    // Mapping to track who has already voted (address => bool)
    mapping(address => bool) public hasVoted;

    // ─── Events ────────────────────────────────────────────────────────────────

    // Emitted when a new candidate is added
    event CandidateAdded(uint256 indexed id, string name);

    // Emitted when a vote is cast
    event VoteCast(address indexed voter, uint256 indexed candidateId);

    // ─── Modifiers ─────────────────────────────────────────────────────────────

    // Restrict function access to owner only
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the admin can perform this action.");
        _;
    }

    // Ensure voting is currently active (within time window)
    modifier votingActive() {
        require(block.timestamp >= votingStart, "Voting has not started yet.");
        require(block.timestamp <= votingEnd, "Voting has ended.");
        _;
    }

    // ─── Constructor ───────────────────────────────────────────────────────────

    /**
     * @param _durationInMinutes  How long the voting lasts (in minutes from now)
     */
    constructor(uint256 _durationInMinutes) {
        owner = msg.sender;
        votingStart = block.timestamp;                          // Starts immediately
        votingEnd   = block.timestamp + (_durationInMinutes * 1 minutes);
    }

    // ─── Admin Functions ───────────────────────────────────────────────────────

    /**
     * @notice Add a new candidate. Only the owner can call this.
     * @param _name  Full name of the candidate
     */
    function addCandidate(string memory _name) public onlyOwner {
        uint256 newId = candidates.length;          // ID = current length before push
        candidates.push(Candidate({
            id: newId,
            name: _name,
            voteCount: 0
        }));
        emit CandidateAdded(newId, _name);
    }

    // ─── Voting Function ───────────────────────────────────────────────────────

    /**
     * @notice Cast a vote for a candidate by their ID.
     * @param _candidateId  The index of the candidate in the candidates array
     */
    function vote(uint256 _candidateId) public votingActive {
        // Prevent double voting
        require(!hasVoted[msg.sender], "You have already voted.");

        // Ensure candidate ID is valid
        require(_candidateId < candidates.length, "Invalid candidate ID.");

        // Mark voter as having voted
        hasVoted[msg.sender] = true;

        // Increment the candidate's vote count
        candidates[_candidateId].voteCount += 1;

        // Emit event for transparency
        emit VoteCast(msg.sender, _candidateId);
    }

    // ─── View / Read Functions ─────────────────────────────────────────────────

    /**
     * @notice Returns the full list of candidates (name + vote count)
     */
    function getCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }

    /**
     * @notice Returns the total number of candidates
     */
    function getCandidateCount() public view returns (uint256) {
        return candidates.length;
    }

    /**
     * @notice Returns the remaining voting time in seconds (0 if ended)
     */
    function getRemainingTime() public view returns (uint256) {
        if (block.timestamp >= votingEnd) return 0;
        return votingEnd - block.timestamp;
    }

    /**
     * @notice Check if the voting window is currently active
     */
    function isVotingActive() public view returns (bool) {
        return (block.timestamp >= votingStart && block.timestamp <= votingEnd);
    }
}
