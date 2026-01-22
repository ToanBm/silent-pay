import { useState } from "react";
import { toast } from "sonner";
import { useReadContract } from "wagmi";
import { useUSDC } from "@/hooks/useUSDC";
import { MOCK_USDC_ADDRESS, CONFIDENTIAL_USDC_ADDRESS } from "@/utils/constants";
import { MOCK_USDC_ABI } from "@/utils/abis/mockUSDC";
import { CONFIDENTIAL_USDC_ABI } from "@/utils/abis/confidentialUSDC";


type TabType = "wrap" | "unwrap" | "transfer";

export const USDCBalanceDisplay = ({
    balance,
    onRefresh,
    isLoading
}: {
    balance: string | undefined,
    onRefresh: () => void,
    isLoading: boolean
}) => {
    return (
        <div className="bg-doma-card border border-doma-border rounded-[20px] px-4 flex items-center justify-between h-[72px]">
            <div className="flex flex-col justify-center">
                <span className="text-sm font-bold text-white">Your cUSDC Balance</span>
                <span className="text-xs text-doma-text-muted">Personal Wallet</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="text-right flex flex-col justify-center">
                    <span className="text-lg font-bold text-white leading-tight">
                        {balance !== undefined ? balance : "---"}
                    </span>
                    <span className="text-[10px] font-bold text-doma-blue leading-tight">cUSDC</span>
                </div>
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="bg-doma-blue-muted border border-doma-blue/20 text-doma-blue px-3 py-1 rounded-[14px] text-xs hover:bg-doma-blue/20 transition-colors disabled:opacity-50 font-medium h-8 min-w-[60px]"
                    title={balance === undefined ? "Show Balance" : "Refresh Balance"}
                >
                    {isLoading ? "..." : (balance === undefined ? "Show" : "Refresh")}
                </button>
            </div>
        </div>
    );
};

export default function USDCWallet() {
    const { balance, publicBalance, refreshBalance, isLoadingBalance, isTransacting, wrap, unwrap, transfer } = useUSDC();

    const [activeTab, setActiveTab] = useState<TabType>("wrap");
    const [amount, setAmount] = useState("");
    const [recipient, setRecipient] = useState("");

    // Fetch token symbols from contracts
    const { data: publicSymbol } = useReadContract({
        address: MOCK_USDC_ADDRESS,
        abi: MOCK_USDC_ABI,
        functionName: "symbol",
    });

    const { data: confidentialSymbol } = useReadContract({
        address: CONFIDENTIAL_USDC_ADDRESS,
        abi: MOCK_USDC_ABI, // Use generic ERC20 ABI for symbol to avoid type error
        functionName: "symbol",
    });




    const handleSubmit = async () => {
        try {
            let hash: string | undefined;
            if (activeTab === "wrap") {
                hash = await wrap(amount);
                toast.success("Wrap successful!", {
                    action: {
                        label: "View Explorer",
                        onClick: () => window.open(`https://sepolia.basescan.org/tx/${hash}`, "_blank"),
                    },
                });
            } else if (activeTab === "unwrap") {
                hash = await unwrap(amount);
                toast.success("Unwrap successful!", {
                    action: {
                        label: "View Explorer",
                        onClick: () => window.open(`https://sepolia.basescan.org/tx/${hash}`, "_blank"),
                    },
                });
            } else {
                hash = await transfer(recipient, amount);
                toast.success("Transfer successful!", {
                    action: {
                        label: "View Explorer",
                        onClick: () => window.open(`https://sepolia.basescan.org/tx/${hash}`, "_blank"),
                    },
                });
            }

            setAmount("");
            if (activeTab === "transfer") setRecipient("");
        } catch (e: any) {
            toast.error(`${activeTab} failed: ${e.message || "Unknown error"}`);
        }
    };

    // Helper to determine button text
    const getButtonText = () => {
        if (isTransacting) return "Processing...";
        if (activeTab === "wrap") return "Wrap USDC";
        if (activeTab === "unwrap") return "Unwrap to USDC";
        return "Transfer cUSDC";
    };

    return (
        <div className="space-y-6">
            {/* Card 1: Balance - Self contained style */}
            <USDCBalanceDisplay
                balance={balance}
                onRefresh={refreshBalance}
                isLoading={isLoadingBalance}
            />

            {/* Card 2: Actions */}
            <div className="bg-doma-card rounded-[20px] border border-doma-border overflow-hidden">
                <div className="p-6">
                    {/* Tabs */}
                    <div className="flex bg-doma-border/50 p-1 rounded-[14px] mb-6">
                        {(["wrap", "unwrap", "transfer"] as TabType[]).map((tab) => {
                            const isActive = activeTab === tab;
                            let activeClass = "";
                            if (isActive) {
                                activeClass = "bg-doma-blue-muted text-doma-blue";
                            } else {
                                activeClass = "text-doma-text-muted hover:text-white";
                            }

                            return (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setAmount(""); }}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg capitalize transition-all ${activeClass}`}
                                >
                                    {tab}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        {activeTab === "transfer" ? (
                            <div className="grid grid-cols-[70fr_30fr] gap-3">
                                <div>
                                    <label className="block text-sm font-bold text-white mb-1">Recipient Address</label>
                                    <input
                                        type="text"
                                        placeholder="0x..."
                                        autoComplete="off"
                                        spellCheck="false"
                                        className="w-full h-[42px] px-4 bg-transparent border border-doma-border rounded-[14px] focus:outline-none focus:border-doma-blue/50 focus:ring-2 focus:ring-doma-blue/10 text-sm text-white placeholder:text-doma-text-muted transition-all"
                                        value={recipient}
                                        onChange={(e) => setRecipient(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-white mb-1">Amount</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            autoComplete="off"
                                            spellCheck="false"
                                            className="w-full h-[42px] px-4 pr-16 bg-transparent border border-doma-border rounded-[14px] focus:outline-none focus:border-doma-blue/50 focus:ring-2 focus:ring-doma-blue/10 text-sm font-semibold text-white placeholder:text-doma-text-muted transition-all"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                        <div className="absolute right-4 top-[11px] text-sm font-semibold text-doma-text-muted pointer-events-none">
                                            {confidentialSymbol || "cUSDC"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-bold text-white">Amount</label>
                                    {activeTab === "wrap" && (
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-doma-text-muted">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-doma-blue">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
                                            </svg>
                                            <span>{publicBalance ?? "0.00"} {publicSymbol || "mUSDC"}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        autoComplete="off"
                                        spellCheck="false"
                                        className="w-full h-[42px] px-4 pr-16 bg-transparent border border-doma-border rounded-[14px] focus:outline-none focus:border-doma-blue/50 focus:ring-2 focus:ring-doma-blue/10 text-sm font-semibold text-white placeholder:text-doma-text-muted transition-all"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                    <div className="absolute right-4 top-[11px] text-sm font-semibold text-doma-text-muted pointer-events-none">
                                        {activeTab === "wrap" ? (publicSymbol || "mUSDC") : (confidentialSymbol || "cUSDC")}
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={!amount || isTransacting || (activeTab === "transfer" && !recipient)}
                            className="w-full h-[56px] rounded-[20px] bg-doma-blue-muted text-doma-blue font-bold transition-colors flex items-center justify-center mt-8 hover:bg-doma-blue/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {getButtonText()}
                        </button>
                    </div>
                </div>

                {/* Info Footer */}
                <div className="bg-transparent p-4 border-t border-doma-border text-xs text-doma-text-muted text-center">
                    {activeTab === "wrap" && "Converts public USDC to confidential cUSDC"}
                    {activeTab === "unwrap" && "Converts confidential cUSDC back to public USDC"}
                    {activeTab === "transfer" && "Sends encrypted cUSDC. Amount remains hidden on-chain."}
                </div>
            </div>
        </div>
    );
}

// Standalone component using the hook
export function USDCBalance() {
    const { balance, refreshBalance, isLoadingBalance } = useUSDC();
    return (
        <USDCBalanceDisplay
            balance={balance}
            onRefresh={refreshBalance}
            isLoading={isLoadingBalance}
        />
    );
}
