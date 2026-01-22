"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import { toast } from "sonner";
import Header from "@/components/header";
import Padder from "@/components/padder";
import { MOCK_USDC_ADDRESS } from "@/utils/constants";
import { MOCK_USDC_ABI } from "@/utils/abis/mockUSDC";

const FaucetPage = () => {
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();

    const [isMinting, setIsMinting] = useState(false);

    // Read Balance
    const { data: balance, refetch } = useReadContract({
        address: MOCK_USDC_ADDRESS,
        abi: MOCK_USDC_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
    });

    const displayBalance = balance ? (Number(balance) / 1e6).toLocaleString() : "0";

    const handleMint = async () => {
        if (!address) return;
        setIsMinting(true);
        try {
            // Mint 1000 USDC
            const amount = parseUnits("1000", 6);
            const hash = await writeContractAsync({
                address: MOCK_USDC_ADDRESS,
                abi: MOCK_USDC_ABI,
                functionName: "mint",
                args: [address, amount],
            });
            await publicClient?.waitForTransactionReceipt({ hash });
            toast.success("Minted 1,000 mUSDC successfully!");
            refetch();
        } catch (e: any) {
            console.error(e);
            toast.error("Mint failed: " + (e.message || e));
        } finally {
            setIsMinting(false);
        }
    };

    return (
        <Padder>
            <Header />
            <div className="max-w-lg mx-auto mt-10">
                <div className="bg-doma-card rounded-[20px] border border-doma-border overflow-hidden">
                    <div className="p-8 text-center space-y-6">

                        <div>
                            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">USDC Faucet</h2>
                            <p className="text-doma-text-muted mt-2 text-sm">Get testnet Mock USDC to try SilentPay features.</p>
                        </div>

                        <div className="bg-transparent rounded-[14px] p-4 border border-doma-border">
                            <span className="text-xs font-bold text-doma-text-muted uppercase tracking-wider block mb-1">Your Balance</span>
                            <div className="flex items-baseline justify-center gap-2">
                                <span className="text-3xl font-bold text-white">{displayBalance}</span>
                                <span className="text-sm font-bold text-doma-blue uppercase">mUSDC</span>
                            </div>
                        </div>

                        <button
                            onClick={handleMint}
                            disabled={!address || isMinting}
                            className="w-full h-[56px] bg-doma-blue-muted text-doma-blue border border-doma-blue/20 rounded-[20px] font-bold transition-all hover:bg-doma-blue/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isMinting ? "Minting..." : "Mint 1,000 mUSDC"}
                        </button>

                        {!address && (
                            <p className="text-xs text-red-400 font-medium">Please connect your wallet first.</p>
                        )}
                    </div>
                </div>
            </div>
        </Padder>
    );
};

export default FaucetPage;
