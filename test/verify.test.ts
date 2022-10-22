import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";
import path from "path";
import { MerkleTree } from "../utils/merkleTree";
import { groth16, rbuffer, toBigIntLE, toBufferLE, pedersenHash, genProofArgs } from "../utils/circuit";
import { Verifier as VerifierContract } from "../typechain-types/contracts"

let verifier: VerifierContract;

const levels = Number(process.env.MERKLE_TREE_HEIGHT) || 20;

const wasmPath = path.join(__dirname, "../build/circuits/circuit.wasm");
const zkeyPath = path.join(__dirname, "../build/circuits/circuit_final.zkey");

const rbigint = (nbytes: number) => toBigIntLE(rbuffer(nbytes));

const secret = rbigint(31);
const nullifier = rbigint(31);
const preimage = Buffer.concat([toBufferLE(nullifier, 31), toBufferLE(secret, 31)])
const fee = BigInt(1e17);

const commitment = pedersenHash(preimage);

const leafIndex = 2;
const leaves = ["123", "456", commitment.toString(), "789"];
const tree = new MerkleTree(levels, leaves);
const merkleProof = tree.proof(leafIndex);

// `beforeEach` will run before each `it(...)`
beforeEach(async function () {
  const Verifier = await ethers.getContractFactory("Verifier");
  verifier = await Verifier.deploy();
  await verifier.deployed();
});

describe("Verifier #verifyProof", () => {
  it("should be verified", async function () {
    // signal input root;
    // signal input nullifierHash;
    // signal input recipient; // not taking part in any computations
    // signal input relayer;  // not taking part in any computations
    // signal input fee;      // not taking part in any computations
    // signal input refund;   // not taking part in any computations
    // signal private input nullifier;
    // signal private input secret;
    // signal private input pathElements[levels];
    // signal private input pathIndices[levels];'
    const input = {
      root: merkleProof.root,
      nullifierHash: pedersenHash(toBufferLE(nullifier, 31)),
      nullifier: nullifier,
      relayer: ethers.constants.AddressZero,
      recipient: ethers.constants.AddressZero,
      fee,
      refund: BigInt(0),
      secret,
      pathElements: merkleProof.pathElements,
      pathIndices: merkleProof.pathIndices,
    };

    let { proof, publicSignals } = await groth16.fullProve(input, wasmPath, zkeyPath);
    const args = await genProofArgs(proof, publicSignals);
    expect(await verifier.verifyProof(...args)).to.equal(true);
  });
});
