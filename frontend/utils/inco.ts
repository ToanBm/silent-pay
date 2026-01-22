import { AttestedComputeSupportedOps, Lightning } from "@inco/js/lite";
import { handleTypes } from "@inco/js";
import type { WalletClient, Transport, Account, Chain } from "viem";
import { bytesToHex, createPublicClient, http, pad, toHex } from "viem";
import { baseSepolia } from "viem/chains";

export type IncoWalletClient = WalletClient<Transport, Chain, Account>;

const ALCHEMY_URL = "https://base-sepolia.g.alchemy.com/v2/XSbbfgyxRi2r_JqJo1ZzlbUGcJxPECxl";

// Force Alchemy RPC by overriding the default chain config
const customBaseSepolia = {
  ...baseSepolia,
  rpcUrls: {
    ...baseSepolia.rpcUrls,
    default: { http: [ALCHEMY_URL] },
    public: { http: [ALCHEMY_URL] },
  },
};

export const publicClient = createPublicClient({
  chain: customBaseSepolia,
  transport: http(ALCHEMY_URL),
});

export async function getConfig() {
  const chainId = publicClient.chain.id;

  // @ts-ignore - The Inco SDK supports a provider option in its latest versions
  return await Lightning.latest("testnet", chainId, {
    provider: publicClient
  });
}

export async function encryptValue({
  value,
  address,
  contractAddress,
}: {
  value: bigint;
  address: `0x${string}`;
  contractAddress: `0x${string}`;
}): Promise<`0x${string}`> {
  const inco = await getConfig();

  const encryptedData = await inco.encrypt(value, {
    accountAddress: address,
    dappAddress: contractAddress,
    handleType: handleTypes.euint256,
  });

  return encryptedData as `0x${string}`;
}

export async function decryptValue({
  walletClient,
  handle,
}: {
  walletClient: IncoWalletClient;
  handle: string;
}): Promise<bigint> {
  const values = await decryptValues({
    walletClient,
    handles: [handle],
  });
  return values[0];
}

export async function decryptValues({
  walletClient,
  handles,
}: {
  walletClient: IncoWalletClient;
  handles: string[];
}): Promise<bigint[]> {
  const inco = await getConfig();

  const attestedDecrypt = await inco.attestedDecrypt(
    walletClient,
    handles as `0x${string}`[]
  );

  return attestedDecrypt.map((item: any) => item.plaintext.value as bigint);
}

export const attestedCompute = async ({
  walletClient,
  lhsHandle,
  op,
  rhsPlaintext,
}: {
  walletClient: IncoWalletClient;
  lhsHandle: `0x${string}`;
  op: (typeof AttestedComputeSupportedOps)[keyof typeof AttestedComputeSupportedOps];
  rhsPlaintext: bigint | boolean;
}) => {
  const incoConfig = await getConfig();

  const result = await incoConfig.attestedCompute(
    walletClient,
    lhsHandle as `0x${string}`,
    op,
    rhsPlaintext
  );

  // Convert Uint8Array signatures to hex strings
  const signatures = result.covalidatorSignatures.map((sig: Uint8Array) =>
    bytesToHex(sig)
  );

  // Encode the plaintext value as bytes32
  // For boolean: true = 1, false = 0, padded to 32 bytes
  const encodedValue = pad(toHex(result.plaintext.value ? 1 : 0), { size: 32 });

  // Return in format expected by contract:
  // - plaintext: the actual decrypted value
  // - attestation: { handle, value } for the DecryptionAttestation struct
  // - signature array for verification
  return {
    plaintext: result.plaintext.value,
    attestation: {
      handle: result.handle,
      value: encodedValue,
    },
    signature: signatures,
  };
};

/**
 * Get the fee required for Inco operations
 */
export async function getFee(): Promise<bigint> {
  const inco = await getConfig();

  // Read the fee from the Lightning contract
  const fee = await publicClient.readContract({
    address: inco.executorAddress,
    abi: [
      {
        type: "function",
        inputs: [],
        name: "getFee",
        outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
        stateMutability: "pure",
      },
    ],
    functionName: "getFee",
  });

  return fee;
}

/**
 * Get the Attested Decryption Proof for a given handle.
 * Used for Trustless Withdrawals (claimWithdraw).
 */
export async function getDecryptionProof({
  walletClient,
  handle,
}: {
  walletClient: IncoWalletClient;
  handle: string;
}) {
  const inco = await getConfig();

  const result = await inco.attestedDecrypt(walletClient, [
    handle as `0x${string}`,
  ]);

  const item = result[0];

  // Convert Uint8Array signatures to hex strings
  const signatures = item.covalidatorSignatures.map((sig: Uint8Array) =>
    bytesToHex(sig)
  );

  return {
    attestation: {
      handle: BigInt(item.handle),
      value: BigInt(item.plaintext.value),
    },
    signatures: signatures,
  };
}
