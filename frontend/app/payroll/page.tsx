"use client";

import { useState } from "react";
import Header from "@/components/header";
import Padder from "@/components/padder";
import PayrollDashboard from "@/components/payroll-dashboard";
import PayrollClaim from "@/components/payroll-claim";


const PayrollPage = () => {
    const [activeTab, setActiveTab] = useState<"employer" | "employee">("employer");

    return (
        <Padder>
            <Header />
            <div className="max-w-4xl mx-auto space-y-8">




                {/* Main Tabs */}
                <div className="flex justify-center items-center gap-3">
                    <button
                        onClick={() => setActiveTab("employer")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-sm font-bold transition-all border ${activeTab === "employer"
                            ? "bg-doma-blue-muted text-doma-blue border-doma-blue/20"
                            : "bg-transparent text-doma-text-muted border-doma-border hover:bg-doma-blue/10 hover:text-white"
                            }`}
                    >
                        Employer
                    </button>
                    <button
                        onClick={() => setActiveTab("employee")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-sm font-bold transition-all border ${activeTab === "employee"
                            ? "bg-doma-blue-muted text-doma-blue border-doma-blue/20"
                            : "bg-transparent text-doma-text-muted border-doma-border hover:bg-doma-blue/10 hover:text-white"
                            }`}
                    >
                        Employee
                    </button>
                </div>

                {/* Content Area */}
                <div className="min-h-[400px]">
                    {activeTab === "employer" ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <PayrollDashboard />
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-lg mx-auto">
                            <PayrollClaim />
                        </div>
                    )}
                </div>
            </div>
        </Padder>
    );
};

export default PayrollPage;
