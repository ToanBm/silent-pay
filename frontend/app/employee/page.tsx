"use client";

import Header from "@/components/header";
import Padder from "@/components/padder";
import PayrollClaim from "@/components/payroll-claim";

const EmployeePage = () => {
    return (
        <Padder>
            <Header />
            <div className="max-w-4xl mx-auto space-y-8 mt-10">
                <div className="max-w-lg mx-auto">
                    <PayrollClaim />
                </div>
            </div>
        </Padder>
    );
};

export default EmployeePage;
