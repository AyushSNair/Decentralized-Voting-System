// scripts/deploy.js
// ─────────────────────────────────────────────────────────────────────────────
// This script deploys the Voting contract to the chosen network.
// Run: npx hardhat run scripts/deploy.js --network localhost
// ─────────────────────────────────────────────────────────────────────────────

const hre = require("hardhat");

async function main() {
  // ── Get the deployer account ─────────────────────────────────────────────
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // ── Deploy the contract ──────────────────────────────────────────────────
  // Voting window = 3 minutes from deployment time (short for demo purposes)
  const DURATION_MINUTES = 4;

  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(DURATION_MINUTES);

  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();
  console.log("\n✅ Voting contract deployed!");
  console.log("   Contract address:", contractAddress);
  console.log("   Voting duration:  ", DURATION_MINUTES, "minutes");

  // ── Add some default candidates ──────────────────────────────────────────
  console.log("\nAdding initial candidates...");

  const candidateNames = ["Ayush Nair", "Siddhi Patil", "Amogh Pandirkar"];

  for (const name of candidateNames) {
    const tx = await voting.addCandidate(name);
    await tx.wait();
    console.log(`   ✓ Added candidate: ${name}`);
  }

  console.log("\n🎉 Setup complete! Paste this into your frontend .env:");
  console.log(`   REACT_APP_CONTRACT_ADDRESS=${contractAddress}`);

  // ── Register the deployer as a voter (demo) ──────────────────────────────
  // In a real system, loop through a list of approved voter addresses.
  console.log("\nRegistering deployer as a voter...");
  const regTx = await voting.registerVoter(deployer.address);
  await regTx.wait();
  console.log(`   ✓ Registered voter: ${deployer.address}`);
  console.log("\n✅ Done! The deployer wallet can now vote.");
  console.log("   To register more voters, call registerVoter(<address>) from the owner wallet.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
