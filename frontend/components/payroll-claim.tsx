import { useState } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { usePayroll } from "@/hooks/usePayroll";
import { USDCBalance } from "@/components/usdc-wallet";

const PayrollClaim = () => {
    const { address } = useAccount();
    const { getEmployeeOverview, claimSalary, isLoading } = usePayroll();

    const [payrollId, setPayrollId] = useState("");
    const [periodId, setPeriodId] = useState("1");
    const [salary, setSalary] = useState<string | null>(null);
    const [isClaimed, setIsClaimed] = useState<boolean | null>(null);
    const [isFetching, setIsFetching] = useState(false);

    const handleFetchInfo = async () => {
        if (!payrollId || !periodId) {
            toast.error("Please enter Payroll ID and Period");
            return;
        }

        setIsFetching(true);
        try {
            const data = await getEmployeeOverview(payrollId, periodId);
            if (data) {
                setSalary(data.salary ?? "0.00");
                setIsClaimed(data.status ?? false);
            }
        } catch (e: any) {
            toast.error("Failed to fetch salary information");
        } finally {
            setIsFetching(false);
        }
    };

    const handleClaim = async () => {
        if (!payrollId || !periodId) return;
        try {
            await claimSalary(payrollId, periodId);
            toast.success(`Claimed salary for Period ${periodId}!`);
            setSalary(null);
            setIsClaimed(null);
        } catch (e: any) {
            toast.error("Claim failed: " + (e.message || e));
        }
    };

    if (!address) return null;

    return (
        <div className="space-y-6">
            {/* 1. Wallet Balance */}
            <USDCBalance />

            {/* 2. Salary Information Card (Main Wrapper) */}
            <div className="bg-doma-card rounded-[20px] border border-doma-border overflow-hidden">
                {/* Header */}
                <div className="p-4 bg-transparent border-b border-doma-border">
                    <h3 className="text-base font-bold text-white">
                        Salary Information
                    </h3>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* Control Bar: Find Payroll */}
                    <div className="bg-transparent rounded-[14px] p-4 border border-doma-border flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <span className="text-sm font-bold text-white block">Find Payroll</span>
                            <span className="text-xs text-doma-text-muted font-medium">Enter ID & Period</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center bg-transparent rounded-[14px] border border-doma-border h-[36px] px-3">
                                <span className="text-[10px] text-doma-text-muted font-bold mr-2 uppercase">ID</span>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-12 text-xs font-bold text-white focus:outline-none text-center bg-transparent"
                                    value={payrollId}
                                    onChange={(e) => setPayrollId(e.target.value)}
                                />
                                <div className="w-px h-4 bg-doma-border mx-2"></div>
                                <span className="text-[10px] text-doma-text-muted font-bold mr-2 uppercase">PRD</span>
                                <input
                                    type="number"
                                    placeholder="1"
                                    className="w-10 text-xs font-bold text-white focus:outline-none text-center bg-transparent"
                                    value={periodId}
                                    onChange={(e) => setPeriodId(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleFetchInfo}
                                disabled={isFetching || !payrollId || !periodId}
                                className="px-3 py-1.5 bg-doma-blue-muted text-doma-blue border border-doma-blue/20 rounded-[14px] hover:bg-doma-blue/20 disabled:opacity-50 text-xs font-bold transition-colors h-[36px] min-w-[70px]"
                            >
                                {isFetching ? "..." : "Load"}
                            </button>
                        </div>
                    </div>


                    {/* Stats Stack (Vertical) */}
                    <div className="space-y-4">

                        {/* Consolidated Salary & Status Row */}
                        <div className="bg-transparent border border-doma-border rounded-[14px] px-4 py-3 flex items-center justify-between">
                            {/* Left: Label */}
                            <div className="flex flex-col min-w-[120px]">
                                <span className="text-sm font-bold text-white">Earned Amount</span>
                                <span className="text-xs text-doma-text-muted font-medium">Your salary</span>
                            </div>

                            {/* Center: Value */}
                            <div className="flex flex-col items-center flex-1 px-4">
                                <span className="text-xl font-bold text-white leading-tight">
                                    {salary || "---"}
                                </span>
                                <span className="text-[10px] font-bold text-doma-blue">cUSDC</span>
                            </div>

                            {/* Right: Status */}
                            <div className="flex flex-col items-end min-w-[80px]">
                                {isClaimed === null ? (
                                    <span className="text-xl font-bold text-doma-text-muted uppercase leading-tight">---</span>
                                ) : (
                                    <span className={`text-xl font-bold uppercase leading-tight ${isClaimed ? 'text-white' : 'text-doma-blue'}`}>
                                        {isClaimed ? "PAID" : "UNPAID"}
                                    </span>
                                )}
                                <span className="text-[10px] font-bold text-doma-blue mt-0.5">Status</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={handleClaim}
                            disabled={isLoading || !salary || isClaimed !== false}
                            className={`w-full h-[56px] rounded-[20px] font-bold transition-all flex items-center justify-center gap-2 ${isLoading || !salary || isClaimed !== false
                                ? "bg-transparent text-doma-text-muted cursor-not-allowed border border-doma-border"
                                : "bg-doma-blue-muted text-doma-blue hover:bg-doma-blue/20"
                                }`}
                        >
                            {isLoading ? "Processing..." : isClaimed ? "Already Claimed" : "Claim Salary Now"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayrollClaim;
