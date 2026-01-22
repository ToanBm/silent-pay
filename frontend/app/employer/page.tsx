"use client";

import Header from "@/components/header";
import Padder from "@/components/padder";
import PayrollDashboard from "@/components/payroll-dashboard";

const EmployerPage = () => {
    return (
        <Padder>
            <Header />
            <div className="max-w-4xl mx-auto space-y-8 mt-10">
                <PayrollDashboard />
            </div>
        </Padder>
    );
};

export default EmployerPage;
