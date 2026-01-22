import { useState, useCallback } from "react";
import { useAccount, useWalletClient, usePublicClient, useWriteContract } from "wagmi";
import { CONFIDENTIAL_PAYROLL_ADDRESS, CONFIDENTIAL_USDC_ADDRESS } from "@/utils/constants";
import { PAYROLL_ABI } from "@/utils/abis/payroll";
import { CONFIDENTIAL_USDC_ABI } from "@/utils/abis/confidentialUSDC";
import { encryptValue, decryptValue, decryptValues, publicClient as incoPublicClient } from "@/utils/inco";
import { type Hex, decodeEventLog } from "viem";

export function usePayroll() {
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    const [isLoading, setIsLoading] = useState(false);

    // Read functions
    const getPayrollBalance = async (payrollId: string) => {
        if (!payrollId || !address || !walletClient || !publicClient) return null;
        try {
            const balanceHandle = await publicClient.readContract({
                address: CONFIDENTIAL_PAYROLL_ADDRESS,
                abi: PAYROLL_ABI,
                functionName: "getPayrollBalance",
                args: [BigInt(payrollId)],
            });

            const decryptedValue = await decryptValue({
                walletClient: walletClient,
                handle: balanceHandle as string,
            });

            return (Number(decryptedValue) / 1e6).toFixed(2);
        } finally {
        }
    };

    const getTotalSalary = async (payrollId: string) => {
        if (!payrollId || !address || !walletClient || !publicClient) return null;
        try {
            const handle = await publicClient.readContract({
                address: CONFIDENTIAL_PAYROLL_ADDRESS,
                abi: PAYROLL_ABI,
                functionName: "getTotalSalary",
                args: [BigInt(payrollId)],
            });

            const decryptedValue = await decryptValue({
                walletClient: walletClient,
                handle: handle as string,
            });

            return (Number(decryptedValue) / 1e6).toFixed(2);
        } finally {
        }
    };

    const getPayrollsByOwner = async (ownerAddress: string) => {
        if (!publicClient) return [];
        try {
            const ids = await publicClient.readContract({
                address: CONFIDENTIAL_PAYROLL_ADDRESS,
                abi: PAYROLL_ABI,
                functionName: "getPayrollsByOwner",
                args: [ownerAddress as `0x${string}`],
            });
            // Convert BigInt[] to string[]
            // @ts-ignore - Explicitly casting for mapping
            return ids.map((id) => id.toString());
        } catch (error) {
            return [];
        }
    };

    // Write functions
    const fundPayroll = async (payrollId: string, amount: string) => {
        if (!payrollId || !amount || !address) throw new Error("Missing params");
        setIsLoading(true);
        try {
            const numericValue = BigInt(Math.floor(Number(amount) * 1e6));

            const fee = await incoPublicClient.readContract({
                address: CONFIDENTIAL_PAYROLL_ADDRESS,
                abi: PAYROLL_ABI,
                functionName: "getIncoFee",
            });

            // Step 1: Encrypt for cUSDC Approve
            const encryptedForApprove = await encryptValue({
                value: numericValue,
                address: address as `0x${string}`,
                contractAddress: CONFIDENTIAL_USDC_ADDRESS,
            });

            // Approve spending
            const approveHash = await writeContractAsync({
                address: CONFIDENTIAL_USDC_ADDRESS,
                abi: CONFIDENTIAL_USDC_ABI,
                functionName: "approve",
                args: [CONFIDENTIAL_PAYROLL_ADDRESS as `0x${string}`, encryptedForApprove as `0x${string}`],
                value: fee ? (fee as bigint) * BigInt(3) : undefined,
                gas: BigInt(2000000),
            });
            await incoPublicClient.waitForTransactionReceipt({ hash: approveHash });

            // Step 2: Encrypt for Funding
            const encryptedForFund = await encryptValue({
                value: numericValue,
                address: address as `0x${string}`,
                contractAddress: CONFIDENTIAL_PAYROLL_ADDRESS,
            });

            // Execute Fund Transaction
            const hash = await writeContractAsync({
                address: CONFIDENTIAL_PAYROLL_ADDRESS,
                abi: PAYROLL_ABI,
                functionName: "fundPayroll",
                args: [BigInt(payrollId), encryptedForFund as `0x${string}`],
                value: fee ? (fee as bigint) * BigInt(25) : undefined,
                gas: BigInt(5000000),
            });
            await incoPublicClient.waitForTransactionReceipt({ hash: hash });

            return hash;
        } finally {
            setIsLoading(false);
        }
    };

    const addEmployee = async (payrollId: string, employeeAddress: string, salary: string) => {
        if (!payrollId || !employeeAddress || !salary || !address) throw new Error("Missing params");
        setIsLoading(true);
        try {
            const numericValue = BigInt(Math.floor(Number(salary) * 1e6));

            const encryptedSalary = await encryptValue({
                value: numericValue,
                address: address as `0x${string}`,
                contractAddress: CONFIDENTIAL_PAYROLL_ADDRESS,
            });

            const fee = await incoPublicClient.readContract({
                address: CONFIDENTIAL_PAYROLL_ADDRESS,
                abi: PAYROLL_ABI,
                functionName: "getIncoFee",
            });

            const hash = await writeContractAsync({
                address: CONFIDENTIAL_PAYROLL_ADDRESS,
                abi: PAYROLL_ABI,
                functionName: "addEmployee",
                args: [BigInt(payrollId), employeeAddress as `0x${string}`, encryptedSalary as `0x${string}`],
                value: fee ? (fee as bigint) * BigInt(20) : undefined,
                gas: BigInt(1000000),
            });
            await incoPublicClient.waitForTransactionReceipt({ hash });

            return hash;
        } finally {
            setIsLoading(false);
        }
    };

    const removeEmployee = async (payrollId: string, employeeAddress: string) => {
        if (!payrollId || !employeeAddress || !address) throw new Error("Missing params");
        setIsLoading(true);
        try {
            const fee = await incoPublicClient.readContract({
                address: CONFIDENTIAL_PAYROLL_ADDRESS,
                abi: PAYROLL_ABI,
                functionName: "getIncoFee",
            });

            const hash = await writeContractAsync({
                address: CONFIDENTIAL_PAYROLL_ADDRESS,
                abi: PAYROLL_ABI,
                // @ts-ignore - ABI mismatch warning suppression
                functionName: "removeEmployee",
                args: [BigInt(payrollId), employeeAddress as `0x${string}`],
                value: fee ? (fee as bigint) * BigInt(3) : undefined,
                gas: BigInt(3000000),
            });
            await incoPublicClient.waitForTransactionReceipt({ hash });
            return hash;
        } finally {
            setIsLoading(false);
        }
    };

    const withdrawFunds = async (payrollId: string, amount: string) => {
        if (!payrollId || !amount || !address) throw new Error("Missing params");
        setIsLoading(true);
        try {
            const numericValue = BigInt(Math.floor(Number(amount) * 1e6));

            const encryptedVal = await encryptValue({
                value: numericValue,
                address: address as `0x${string}`,
                contractAddress: CONFIDENTIAL_PAYROLL_ADDRESS,
            });

            const fee = await incoPublicClient.readContract({
                address: CONFIDENTIAL_PAYROLL_ADDRESS,
                abi: PAYROLL_ABI,
                functionName: "getIncoFee",
            });

            const hash = await writeContractAsync({
                address: CONFIDENTIAL_PAYROLL_ADDRESS,
                abi: PAYROLL_ABI,
                // @ts-ignore - ABI mismatch warning suppression
                functionName: "withdraw",
                args: [BigInt(payrollId), encryptedVal as `0x${string}`],
                // @ts-ignore - Fee handling mismatch suppression
                value: fee ? (BigInt(fee.toString()) * BigInt(20)) : undefined,
                gas: BigInt(3000000),
            });
            await incoPublicClient.waitForTransactionReceipt({ hash });
            return hash;
        } finally {
            setIsLoading(false);
        }
    };

    const startNewPeriod = async (payrollId: string) => {
        if (!payrollId) throw new Error("Missing params");
        setIsLoading(true);
        try {
            const hash = await writeContractAsync({
                address: CONFIDENTIAL_PAYROLL_ADDRESS,
                abi: PAYROLL_ABI,
                functionName: "startNewPeriod",
                args: [BigInt(payrollId)],
                gas: BigInt(2000000),
            });
            await incoPublicClient.waitForTransactionReceipt({ hash });
            return hash;
        } finally {
            setIsLoading(false);
        }
    };

    const checkClaimStatus = async (payrollId: string, periodId: string) => {
        if (!payrollId || !periodId || !address || !walletClient || !publicClient) return null;
        try {
            const handle = await publicClient.readContract({
                address: CONFIDENTIAL_PAYROLL_ADDRESS,
                abi: PAYROLL_ABI,
                functionName: "checkClaimStatus",
                args: [BigInt(payrollId), BigInt(periodId), address],
            });

            if (!handle || handle === "0x0" || BigInt(handle as string) === BigInt(0)) {
                return false;
            }

            const decryptedValue = await decryptValue({
                walletClient: walletClient,
                handle: handle as string,
            });

            return Number(decryptedValue) === 1;
        } catch (error: any) {
            return false;
        }
    };

    const getEmployeeOverview = async (payrollId: string, periodId: string) => {
        if (!payrollId || !periodId || !address || !walletClient || !publicClient) return null;
        try {
            // Step 1: Read both handles from contracts
            const [salaryHandle, statusHandle] = await Promise.all([
                publicClient.readContract({
                    address: CONFIDENTIAL_PAYROLL_ADDRESS,
                    abi: PAYROLL_ABI,
                    functionName: "getEmployeeSalary",
                    args: [BigInt(payrollId), address],
                }),
                publicClient.readContract({
                    address: CONFIDENTIAL_PAYROLL_ADDRESS,
                    abi: PAYROLL_ABI,
                    functionName: "checkClaimStatus",
                    args: [BigInt(payrollId), BigInt(periodId), address],
                })
            ]);

            const handlesToDecrypt: string[] = [];
            const resultsMap: { salary?: string, status?: boolean } = {
                salary: "0.00",
                status: false
            };

            // Check if handles are valid before adding to batch
            const isVal = (h: any) => h && h !== "0x0" && BigInt(h as string) !== BigInt(0);

            if (isVal(salaryHandle)) handlesToDecrypt.push(salaryHandle as string);
            if (isVal(statusHandle)) handlesToDecrypt.push(statusHandle as string);

            if (handlesToDecrypt.length === 0) return resultsMap;

            // Step 2: Batch decrypt in ONE signature
            const decryptedValues = await decryptValues({
                walletClient,
                handles: handlesToDecrypt
            });

            // Step 3: Map back results
            let idx = 0;
            if (isVal(salaryHandle)) {
                resultsMap.salary = (Number(decryptedValues[idx]) / 1e6).toFixed(2);
                idx++;
            }
            if (isVal(statusHandle)) {
                resultsMap.status = Number(decryptedValues[idx]) === 1;
                idx++;
            }

            return resultsMap;
        } catch (error) {
            return { salary: "0.00", status: false };
        }
    };

    const claimSalary = async (payrollId: string, periodId: string) => {
        if (!payrollId || !periodId || !address) throw new Error("Missing params");
        setIsLoading(true);
        try {
            const fee = await incoPublicClient.readContract({
                address: CONFIDENTIAL_PAYROLL_ADDRESS,
                abi: PAYROLL_ABI,
                functionName: "getIncoFee",
            });

            const hash = await writeContractAsync({
                address: CONFIDENTIAL_PAYROLL_ADDRESS,
                abi: PAYROLL_ABI,
                functionName: "claimSalary",
                args: [BigInt(payrollId), BigInt(periodId)],
                value: fee ? (fee as bigint) * BigInt(25) : undefined,
                gas: BigInt(5000000),
            });
            await incoPublicClient.waitForTransactionReceipt({ hash });
            return hash;
        } finally {
            setIsLoading(false);
        }
    };

    const createPayroll = async () => {
        setIsLoading(true);
        try {
            const hash = await writeContractAsync({
                address: CONFIDENTIAL_PAYROLL_ADDRESS,
                abi: PAYROLL_ABI,
                functionName: "createPayroll",
            });
            const receipt = await incoPublicClient.waitForTransactionReceipt({ hash });

            let foundId = null;
            if (receipt.status === "success") {
                for (const log of receipt.logs) {
                    try {
                        if (log.address.toLowerCase() === CONFIDENTIAL_PAYROLL_ADDRESS.toLowerCase()) {
                            const decoded = decodeEventLog({
                                abi: PAYROLL_ABI,
                                data: log.data,
                                topics: log.topics,
                            });
                            if (decoded.eventName === "PayrollCreated") {
                                // @ts-ignore - Event args typing manual override
                                foundId = decoded.args.payrollId.toString();
                                break;
                            }
                        }
                    } catch (e) {
                    }
                }
            }
            return { hash, id: foundId };
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        getPayrollBalance,
        getTotalSalary,
        getEmployeeOverview,
        checkClaimStatus,
        fundPayroll,
        addEmployee,
        withdrawFunds,
        startNewPeriod,
        claimSalary,
        createPayroll,
        getPayrollsByOwner,
        removeEmployee
    };
}
