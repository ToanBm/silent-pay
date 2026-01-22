import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient, useReadContract, useWriteContract } from "wagmi";
import { parseUnits, type Hex, pad, toHex } from "viem";
import { CONFIDENTIAL_USDC_ADDRESS, MOCK_USDC_ADDRESS } from "@/utils/constants";
import { CONFIDENTIAL_USDC_ABI } from "@/utils/abis/confidentialUSDC";
import { MOCK_USDC_ABI } from "@/utils/abis/mockUSDC";
import { decryptValue, encryptValue, publicClient as incoPublicClient } from "@/utils/inco";

export function useUSDC() {
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    const [balance, setBalance] = useState<string | undefined>(undefined);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const [isTransacting, setIsTransacting] = useState(false);

    // Read Allowance for Wrap
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: MOCK_USDC_ADDRESS,
        abi: MOCK_USDC_ABI,
        functionName: "allowance",
        args: address ? [address, CONFIDENTIAL_USDC_ADDRESS] : undefined,
    });

    // Read Public USDC Balance (MOCK_USDC)
    const { data: publicBalanceData, refetch: refetchPublicBalance } = useReadContract({
        address: MOCK_USDC_ADDRESS,
        abi: MOCK_USDC_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
    });

    const publicBalance = publicBalanceData ? (Number(publicBalanceData) / 1e6).toFixed(2) : undefined;


    const refreshBalance = useCallback(async () => {
        if (!address || !publicClient || !walletClient) return;
        setIsLoadingBalance(true);
        try {
            const balanceHandle = await publicClient.readContract({
                address: CONFIDENTIAL_USDC_ADDRESS,
                abi: CONFIDENTIAL_USDC_ABI,
                functionName: "balanceOf",
                args: [address],
            });

            const decryptedValue = await decryptValue({
                walletClient: walletClient,
                handle: balanceHandle as string,
            });

            const balanceInUSDC = (Number(decryptedValue) / 1e6).toFixed(2);
            setBalance(balanceInUSDC);
        } finally {
            setIsLoadingBalance(false);
        }
    }, [address, publicClient, walletClient]);

    const wrap = async (amount: string) => {
        if (!amount) throw new Error("Amount required");
        setIsTransacting(true);
        try {
            const amountInUnits = parseUnits(amount, 6);

            // Check allowance
            const currentAllowance = allowance ? BigInt(allowance.toString()) : BigInt(0);
            if (currentAllowance < amountInUnits) {
                const approveHash = await writeContractAsync({
                    address: MOCK_USDC_ADDRESS,
                    abi: MOCK_USDC_ABI,
                    functionName: "approve",
                    args: [CONFIDENTIAL_USDC_ADDRESS, amountInUnits],
                });
                await incoPublicClient.waitForTransactionReceipt({ hash: approveHash });
                refetchAllowance();
            }

            const hash = await writeContractAsync({
                address: CONFIDENTIAL_USDC_ADDRESS,
                abi: CONFIDENTIAL_USDC_ABI,
                functionName: "deposit",
                args: [amountInUnits],
            });
            await incoPublicClient.waitForTransactionReceipt({ hash });
            refetchPublicBalance();
            // Latency fix: Refetch again after delay
            setTimeout(() => refetchPublicBalance(), 2000);
            setTimeout(() => refetchPublicBalance(), 5000);

            return hash;
        } finally {
            setIsTransacting(false);
        }
    };

    const unwrap = async (amount: string) => {
        if (!amount) throw new Error("Amount required");
        if (!address || !walletClient) throw new Error("Wallet not connected");

        setIsTransacting(true);
        try {
            const amountInUnits = parseUnits(amount, 6);

            const hash = await writeContractAsync({
                address: CONFIDENTIAL_USDC_ADDRESS,
                abi: CONFIDENTIAL_USDC_ABI,
                functionName: "requestWithdraw",
                args: [amountInUnits],
            });
            const receipt = await incoPublicClient.waitForTransactionReceipt({ hash: hash });

            if (receipt.status === "reverted") {
                throw new Error("Pending withdrawal detected. Please reload to resolve.");
            }

            // Step 2: Get the Pending Handle & Verification Proof (Attestation)
            // RPC Latency fix: Wait 2s for storage propagation before reading handle
            await new Promise(r => setTimeout(r, 2000));

            let pendingHandle: string | undefined;
            for (let i = 0; i < 10; i++) {
                const handle = await incoPublicClient.readContract({
                    address: CONFIDENTIAL_USDC_ADDRESS,
                    abi: CONFIDENTIAL_USDC_ABI,
                    functionName: "pendingWithdrawals",
                    args: [address],
                });

                if (handle && BigInt(handle as string) !== BigInt(0)) {
                    pendingHandle = handle as string;
                    break;
                }
                await new Promise(r => setTimeout(r, 1000));
            }

            if (!pendingHandle) {
                throw new Error("Pending withdrawal not found after retries. Please try again later.");
            }

            // 2b. Request Attestation from Inco Validators
            const { getDecryptionProof } = await import("@/utils/inco");

            let proof: any;
            for (let i = 0; i < 5; i++) {
                try {
                    proof = await getDecryptionProof({
                        walletClient: walletClient,
                        handle: pendingHandle,
                    });
                    break;
                } catch (err: any) {
                    if (i === 4) throw err;
                    await new Promise(r => setTimeout(r, 3000));
                }
            }

            // Step 3: Claim Withdraw with Proof
            const claimHash = await writeContractAsync({
                address: CONFIDENTIAL_USDC_ADDRESS,
                abi: CONFIDENTIAL_USDC_ABI,
                functionName: "claimWithdraw",
                args: [{
                    handle: pad(toHex(proof.attestation.handle), { size: 32 }),
                    value: pad(toHex(proof.attestation.value), { size: 32 }),
                }, proof.signatures as Hex[]],
            });

            await incoPublicClient.waitForTransactionReceipt({ hash: claimHash });

            refetchPublicBalance();
            setTimeout(() => refetchPublicBalance(), 3000);

            return claimHash;
        } catch (err) {
            throw err;
        } finally {
            setIsTransacting(false);
        }
    };

    const transfer = async (recipient: string, amount: string) => {
        if (!amount || !recipient || !address) throw new Error("Invalid params");
        setIsTransacting(true);
        try {
            const numericValue = BigInt(Math.floor(Number(amount) * 1e6));

            const encryptedVal = await encryptValue({
                value: numericValue,
                address: address as `0x${string}`,
                contractAddress: CONFIDENTIAL_USDC_ADDRESS,
            });

            const fee = await incoPublicClient.readContract({
                address: CONFIDENTIAL_USDC_ADDRESS,
                abi: CONFIDENTIAL_USDC_ABI,
                functionName: "getIncoFee",
            });

            const hash = await writeContractAsync({
                address: CONFIDENTIAL_USDC_ADDRESS,
                abi: CONFIDENTIAL_USDC_ABI,
                functionName: "transfer",
                args: [recipient as `0x${string}`, encryptedVal as Hex],
                value: (fee as bigint) ?? undefined,
                gas: BigInt(5000000),
            });
            await incoPublicClient.waitForTransactionReceipt({ hash });

            return hash;
        } finally {
            setIsTransacting(false);
        }
    };

    return {
        balance,
        publicBalance,
        refetchPublicBalance,
        isLoadingBalance,
        isTransacting,
        refreshBalance,
        wrap,
        unwrap,
        transfer
    };
}
