import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { usePayroll } from "@/hooks/usePayroll";
import { toast } from "sonner";


export default function PayrollDashboard() {
    const { address } = useAccount();
    const {
        isLoading: isGlobalLoading, // Renamed to differentiate
        getPayrollBalance,
        getTotalSalary,
        fundPayroll,
        addEmployee,
        withdrawFunds,
        startNewPeriod,
        createPayroll,
        getPayrollsByOwner
    } = usePayroll();

    const [payrollId, setPayrollId] = useState("");
    const [activeTab, setActiveTab] = useState<"overview" | "employees" | "fund" | "settings">("overview");

    // Local state for loading tracking
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    // Local state for forms
    const [balance, setBalance] = useState<string | null>(null);
    const [totalSalary, setTotalSalary] = useState<string | null>(null);

    // Fund form
    const [fundAmount, setFundAmount] = useState("");

    // Employee form
    const [empAddress, setEmpAddress] = useState("");
    const [empSalary, setEmpSalary] = useState("");

    // Withdraw form
    const [withdrawAmount, setWithdrawAmount] = useState("");
    // Finance Sub-tab state
    const [financeTab, setFinanceTab] = useState<"deposit" | "withdraw">("deposit");
    // Management Sub-tab state
    const [manageTab, setManageTab] = useState<"add" | "remove">("add");

    // Auto-fetch IDs on load
    useEffect(() => {
        const fetchIDs = async () => {
            if (address && getPayrollsByOwner) {
                const ids = await getPayrollsByOwner(address);
                if (ids && ids.length > 0) {
                    const latestId = ids[ids.length - 1]; // Get latest
                    setPayrollId(latestId);
                }
            }
        };
        fetchIDs();
    }, [address]);

    const handleCheckOverview = async () => {
        setLoadingAction("loadPayroll");
        await handleRefreshBalance(false); // Pass false to avoid overriding loading state if needed, or handle internally
        await handleRefreshObligation(false);
        setLoadingAction(null);
    };

    const handleRefreshBalance = async (independent = true) => {
        if (!payrollId) return;
        if (independent) setLoadingAction("refreshBalance");
        try {
            const bal = await getPayrollBalance(payrollId);
            setBalance(bal);
        } catch (e: any) {
        }
        if (independent) setLoadingAction(null);
    };

    const handleRefreshObligation = async (independent = true) => {
        if (!payrollId) return;
        if (independent) setLoadingAction("refreshObligation");
        try {
            const total = await getTotalSalary(payrollId);
            setTotalSalary(total);
        } catch (e: any) {
        }
        if (independent) setLoadingAction(null);
    };

    const handleCreateNew = async () => {
        setLoadingAction("createPayroll");
        try {
            const res = await createPayroll();
            if (res.id) {
                setPayrollId(res.id);
                toast.success(`Payroll #${res.id} created!`);
            } else {
                toast.error("Payroll created but ID missing?");
            }
        } catch (e: any) {
            toast.error("Create failed: " + (e.message || e));
        }
        setLoadingAction(null);
    };

    const handleFund = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingAction("fund");
        try {
            await fundPayroll(payrollId, fundAmount);
            toast.success("Funding successful!");
            setFundAmount("");
        } catch (e: any) {
            toast.error("Funding failed: " + (e.message || e));
        }
        setLoadingAction(null);
    };

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingAction("addEmployee");
        try {
            await addEmployee(payrollId, empAddress, empSalary);
            toast.success("Employee added successfully!");
            setEmpAddress("");
            setEmpSalary("");
        } catch (e: any) {
            toast.error("Add employee failed: " + (e.message || e));
        }
        setLoadingAction(null);
    };

    const handleRemoveEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        toast.info("Remove Employee functionality requires Smart Contract update. Please deploy the updated contract first.");
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingAction("withdraw");
        try {
            await withdrawFunds(payrollId, withdrawAmount);
            toast.success("Withdraw successful!");
            setWithdrawAmount("");
            handleRefreshBalance(false);
        } catch (e: any) {
            toast.error("Withdraw failed: " + (e.message || e));
        }
        setLoadingAction(null);
    };

    const handleStartPeriod = async () => {
        setLoadingAction("startPeriod");
        try {
            await startNewPeriod(payrollId);
            toast.success("New period started! Check Metamask for confirmation.");
        } catch (e: any) {
            toast.error("Start period failed: " + (e.message || e));
        }
        setLoadingAction(null);
    };

    if (!address) {
        return <div className="text-center p-8 text-gray-500">Please connect wallet to manage payroll.</div>;
    }

    // Helper to check if a specific action is loading OR global loading is active (but we prioritize local action for UI feedback)
    const isBusy = (action: string) => loadingAction === action || (isGlobalLoading && loadingAction === action);
    const isAnyBusy = isGlobalLoading || loadingAction !== null;

    return (
        <div className="space-y-6">


            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* LEFT COLUMN: FINANCE & TREASURY */}
                <div className="bg-doma-card rounded-[20px] border border-doma-border overflow-hidden flex flex-col h-full">
                    <div className="p-4 bg-transparent border-b border-doma-border flex items-center justify-between">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            Finance & Treasury
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="text-xs text-doma-text-muted font-medium px-2 py-1 bg-doma-border/30 rounded border border-doma-border">
                                Balances & Funds
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-8 flex-1">
                        {!payrollId ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60 py-10">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">🔒</span>
                                </div>
                                <div className="max-w-[200px]">
                                    <p className="text-sm font-bold text-white">Payroll Not Selected</p>
                                    <p className="text-xs text-doma-text-muted mt-1">Select or create a payroll ID to manage funds.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* 1. Stats Stack */}
                                <div className="space-y-4">
                                    {/* Fund Balance */}
                                    <div className="bg-transparent border border-doma-border rounded-[14px] px-4 py-3 flex items-center justify-between h-[72px]">
                                        {/* Label Group */}
                                        <div className="flex flex-col min-w-[140px]">
                                            <h4 className="text-sm font-bold text-white">Fund Balance</h4>
                                            <p className="text-xs text-doma-text-muted font-medium">Available funds</p>
                                        </div>

                                        {/* Value Group */}
                                        <div className="flex flex-col items-center flex-1">
                                            <span className="text-xl font-bold text-white leading-tight">{balance ?? "--"}</span>
                                            <span className="text-[10px] font-bold text-doma-blue uppercase tracking-wider">cUSDC</span>
                                        </div>

                                        {/* Action Group */}
                                        <button
                                            onClick={() => handleRefreshBalance(true)}
                                            disabled={isBusy("refreshBalance")}
                                            className="px-3 py-1.5 bg-doma-blue-muted text-doma-blue border border-doma-blue/20 rounded-[14px] hover:bg-doma-blue/20 disabled:opacity-50 text-xs font-bold transition-colors"
                                        >
                                            {isBusy("refreshBalance") ? "..." : "Refresh"}
                                        </button>
                                    </div>

                                    {/* Monthly Obligation */}
                                    <div className="bg-transparent border border-doma-border rounded-[14px] px-4 py-3 flex items-center justify-between h-[72px]">
                                        {/* Label Group */}
                                        <div className="flex flex-col min-w-[140px]">
                                            <h4 className="text-sm font-bold text-white">Monthly Obligation</h4>
                                            <p className="text-xs text-doma-text-muted font-medium">Total salary</p>
                                        </div>

                                        {/* Value Group */}
                                        <div className="flex flex-col items-center flex-1">
                                            <span className="text-xl font-bold text-white leading-tight">{totalSalary ?? "--"}</span>
                                            <span className="text-[10px] font-bold text-doma-blue uppercase tracking-wider">cUSDC</span>
                                        </div>

                                        {/* Action Group */}
                                        <button
                                            onClick={() => handleRefreshObligation(true)}
                                            disabled={isBusy("refreshObligation")}
                                            className="px-3 py-1.5 bg-doma-blue-muted text-doma-blue border border-doma-blue/20 rounded-[14px] hover:bg-doma-blue/20 disabled:opacity-50 text-xs font-bold transition-colors"
                                        >
                                            {isBusy("refreshObligation") ? "..." : "Refresh"}
                                        </button>
                                    </div>
                                </div>

                                {/* 2. Unified Treasury Tabs */}
                                <div>
                                    {/* Tabs Header */}
                                    <div className="flex bg-doma-border/50 p-1 rounded-[14px] mb-4">
                                        <button
                                            onClick={() => setFinanceTab("deposit")}
                                            className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${financeTab === "deposit" ? "bg-doma-blue-muted text-doma-blue" : "text-doma-text-muted hover:text-white"}`}
                                        >
                                            Deposit
                                        </button>
                                        <button
                                            onClick={() => setFinanceTab("withdraw")}
                                            className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${financeTab === "withdraw" ? "bg-doma-blue-muted text-doma-blue" : "text-doma-text-muted hover:text-white"}`}
                                        >
                                            Withdraw
                                        </button>
                                    </div>

                                    {/* Tab Content */}
                                    {financeTab === "deposit" ? (
                                        <form onSubmit={handleFund} className="space-y-6">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    required
                                                    value={fundAmount}
                                                    onChange={(e) => setFundAmount(e.target.value)}
                                                    className="w-full h-[42px] px-4 border border-doma-border bg-transparent rounded-[14px] focus:ring-2 focus:ring-doma-blue/30 outline-none text-sm font-semibold text-white placeholder:text-doma-text-muted"
                                                    placeholder="Amount to Deposit (cUSDC)"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isBusy("fund")}
                                                className="w-full h-[56px] bg-doma-blue-muted text-doma-blue rounded-[20px] hover:bg-doma-blue/20 disabled:opacity-50 font-bold transition-colors flex items-center justify-center"
                                            >
                                                {isBusy("fund") ? "Processing..." : "Confirm Deposit"}
                                            </button>
                                        </form>
                                    ) : (
                                        <form onSubmit={handleWithdraw} className="space-y-6">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    required
                                                    value={withdrawAmount}
                                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                                    className="w-full h-[42px] px-4 border border-doma-border bg-transparent rounded-[14px] focus:ring-2 focus:ring-doma-blue/30 outline-none text-sm font-semibold text-white placeholder:text-doma-text-muted"
                                                    placeholder="Amount to Withdraw"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isBusy("withdraw")}
                                                className="w-full h-[56px] bg-doma-blue-muted text-doma-blue rounded-[20px] hover:bg-doma-blue/20 disabled:opacity-50 font-bold transition-colors flex items-center justify-center"
                                            >
                                                {isBusy("withdraw") ? "Processing..." : "Confirm Withdraw"}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div >

                {/* RIGHT COLUMN: WORKFORCE MANAGEMENT */}
                < div className="bg-doma-card rounded-[20px] border border-doma-border overflow-hidden flex flex-col h-full" >
                    <div className="p-4 bg-transparent border-b border-doma-border flex items-center justify-between">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            Workforce Management
                        </h3>
                        <div className="text-xs text-doma-text-muted font-medium px-2 py-1 bg-doma-border/30 rounded border border-doma-border">
                            HR & Cycles
                        </div>
                    </div>

                    <div className="p-6 space-y-8 flex-1">
                        {/* 0. Payroll ID Selector (Moved Here) */}
                        <div className="space-y-4">
                            <div className="bg-transparent border border-doma-border rounded-[14px] px-4 py-3 flex items-center justify-between h-[72px]">
                                <div className="flex flex-col justify-center">
                                    <h4 className="text-sm font-bold text-white">Payroll ID</h4>
                                    <p className="text-xs text-doma-text-muted">Select to manage</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={payrollId}
                                        onChange={(e) => setPayrollId(e.target.value)}
                                        placeholder="#"
                                        autoComplete="off"
                                        spellCheck="false"
                                        className="w-[60px] px-2 py-1.5 border border-doma-border bg-transparent rounded-[14px] text-center text-xs focus:outline-none focus:border-doma-blue/50 focus:ring-2 focus:ring-doma-blue/10 font-bold text-white transition-all"
                                    />
                                    <button
                                        id="btn-load-payroll"
                                        onClick={handleCheckOverview}
                                        disabled={!payrollId || isBusy("loadPayroll")}
                                        className="px-3 py-1.5 bg-doma-blue-muted text-doma-blue border border-doma-blue/20 rounded-[14px] hover:bg-doma-blue/20 disabled:opacity-50 text-xs font-bold transition-colors"
                                    >
                                        {isBusy("loadPayroll") ? "..." : "Load"}
                                    </button>
                                    <button
                                        onClick={handleCreateNew}
                                        disabled={isBusy("createPayroll")}
                                        className="px-3 py-1.5 bg-doma-blue-muted text-doma-blue border border-doma-blue/20 rounded-[14px] hover:bg-doma-blue/20 disabled:opacity-50 text-xs font-bold flex items-center gap-1 transition-all"
                                        title="Create New Payroll"
                                    >
                                        {isBusy("createPayroll") ? "Creating..." : "New"}
                                    </button>
                                </div>
                            </div>

                            {payrollId && (
                                <>
                                    {/* 1. Cycle Management */}
                                    <div className="bg-transparent border border-doma-border rounded-[14px] px-4 py-3 flex items-center justify-between h-[72px]">
                                        <div>
                                            <h4 className="text-sm font-bold text-white">Next Pay Cycle</h4>
                                            <p className="text-xs text-doma-text-muted">Unlock salaries</p>
                                        </div>
                                        <button
                                            onClick={handleStartPeriod}
                                            disabled={isBusy("startPeriod")}
                                            className="px-3 py-1.5 bg-doma-blue-muted text-doma-blue border border-doma-blue/20 rounded-[14px] hover:bg-doma-blue/20 disabled:opacity-50 text-xs font-bold transition-colors"
                                        >
                                            {isBusy("startPeriod") ? "Starting..." : "Start Period"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {payrollId && (
                            <>
                                {/* 2. Management Tabs (Add / Remove) */}
                                <div>
                                    {/* Tabs Header */}
                                    <div className="flex bg-doma-border/50 p-1 rounded-[14px] mb-4">
                                        <button
                                            onClick={() => setManageTab("add")}
                                            className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${manageTab === "add" ? "bg-doma-blue-muted text-doma-blue" : "text-doma-text-muted hover:text-white"}`}
                                        >
                                            Add Employee
                                        </button>
                                        <button
                                            onClick={() => setManageTab("remove")}
                                            className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${manageTab === "remove" ? "bg-doma-blue-muted text-doma-blue" : "text-doma-text-muted hover:text-white"}`}
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    {manageTab === "add" ? (
                                        <form onSubmit={handleAddEmployee} className="space-y-6">
                                            <div className="grid grid-cols-[7fr_3fr] gap-3">
                                                <input
                                                    type="text"
                                                    required
                                                    value={empAddress}
                                                    onChange={(e) => setEmpAddress(e.target.value)}
                                                    autoComplete="off"
                                                    spellCheck="false"
                                                    className="w-full h-[42px] px-4 border border-doma-border bg-transparent rounded-[14px] focus:outline-none focus:border-doma-blue/50 focus:ring-2 focus:ring-doma-blue/10 font-mono text-sm font-normal text-white placeholder:text-doma-text-muted transition-all"
                                                    placeholder="Addr (0x...)"
                                                />
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        required
                                                        value={empSalary}
                                                        onChange={(e) => setEmpSalary(e.target.value)}
                                                        autoComplete="off"
                                                        spellCheck="false"
                                                        className="w-full h-[42px] pl-8 pr-4 border border-doma-border bg-transparent rounded-[14px] focus:outline-none focus:border-doma-blue/50 focus:ring-2 focus:ring-doma-blue/10 text-sm font-semibold text-white placeholder:text-doma-text-muted transition-all"
                                                        placeholder="Salary"
                                                    />
                                                    <span className="absolute left-3 top-[9px] text-doma-text-muted font-bold">$</span>
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isBusy("addEmployee")}
                                                className="w-full h-[56px] bg-doma-blue-muted text-doma-blue rounded-[20px] hover:bg-doma-blue/20 disabled:opacity-50 font-bold transition-colors flex items-center justify-center"
                                            >
                                                {isBusy("addEmployee") ? "Adding..." : "Add New Employee"}
                                            </button>
                                        </form>
                                    ) : (
                                        <form onSubmit={handleRemoveEmployee} className="space-y-6">
                                            <input
                                                type="text"
                                                required
                                                value={empAddress}
                                                onChange={(e) => setEmpAddress(e.target.value)}
                                                autoComplete="off"
                                                spellCheck="false"
                                                className="w-full h-[42px] px-4 border border-doma-border bg-transparent rounded-[14px] focus:outline-none focus:border-doma-blue/50 focus:ring-2 focus:ring-doma-blue/10 font-mono text-sm font-normal text-white placeholder:text-doma-text-muted transition-all"
                                                placeholder="Employee Address to Remove (0x...)"
                                            />
                                            <button
                                                type="submit"
                                                disabled={isGlobalLoading}
                                                className="w-full h-[56px] bg-doma-blue-muted text-doma-blue rounded-[20px] hover:bg-doma-blue/20 disabled:opacity-50 font-bold transition-colors flex items-center justify-center"
                                            >
                                                Confirm Remove Employee
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div >

            </div >
        </div >
    );
}
