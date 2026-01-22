// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { e, ebool, euint256, inco } from "@inco/lightning/src/Lib.sol";
import "./ConfidentialUSDC.sol";

/**
 * @title ConfidentialPayroll
 * @notice Payroll with owner depositing funds to contract
 * @dev Owner deposits cUSDC to contract, employees claim from contract balance
 */
contract ConfidentialPayroll {
    error InsufficientFees();
    error NotOwner();
    error NotEmployee();
    error AlreadyClaimed();
    error PayrollNotActive();

    event PayrollCreated(uint256 indexed payrollId, address indexed owner);
    event EmployeeAdded(uint256 indexed payrollId, address indexed employee);
    event EmployeeRemoved(uint256 indexed payrollId, address indexed employee);
    event SalaryClaimed(uint256 indexed payrollId, address indexed employee, uint256 period);
    event PayrollFunded(uint256 indexed payrollId, uint256 amount);

    struct Employee {
        euint256 salary;
        bool active;
    }

    struct Payroll {
        address owner;
        mapping(address => Employee) employees;
        address[] employeeList;
        uint256 currentPeriod;
        // Mapping: periodId => employee => status (1 = claimed, 0 = not claimed)
        mapping(uint256 => mapping(address => euint256)) claimed;
        euint256 balance;      // Contract's cUSDC balance for this payroll
        euint256 totalSalary;  // Total encrypted salary of all active employees
        bool active;
    }

    ConfidentialUSDC public immutable cUSDC;
    
    mapping(uint256 => Payroll) public payrolls;
    mapping(address => uint256[]) public ownerPayrolls;
    uint256 public nextPayrollId;

    constructor(address payable _cUSDC) {
        cUSDC = ConfidentialUSDC(_cUSDC);
    }

    function createPayroll() external returns (uint256) {
        uint256 payrollId = nextPayrollId++;
        
        Payroll storage payroll = payrolls[payrollId];
        payroll.owner = msg.sender;
        payroll.active = true;
        payroll.currentPeriod = 1;
        payroll.balance = e.asEuint256(0);
        payroll.totalSalary = e.asEuint256(0);
        
        ownerPayrolls[msg.sender].push(payrollId);
        
        emit PayrollCreated(payrollId, msg.sender);
        
        return payrollId;
    }

    /**
     * @notice Owner deposits cUSDC to payroll contract
     * @param payrollId Payroll ID
     * @param encryptedAmount Encrypted amount to deposit
     * @dev Owner must approve this contract before calling
     * @dev Requires fee for: transferFrom (1) + e.add (1) + e.allow x2 (2) = 4 total
     * @dev User pays fee
     */
    function fundPayroll(uint256 payrollId, bytes calldata encryptedAmount) external payable {
        Payroll storage payroll = payrolls[payrollId];
        if (payroll.owner != msg.sender) revert NotOwner();
        
        // Total operations ~20
        _requireFee(20);
        
        // Create encrypted amount from client input (validated as msg.sender)
        euint256 userAmount = e.newEuint256(encryptedAmount, msg.sender);
        
        // Re-wrap: Add 0 to make Contract the owner of the handle
        euint256 amount = e.add(userAmount, e.asEuint256(0));
        
        // Allow cUSDC to access the amount handle
        e.allow(amount, address(cUSDC));
        
        // Transfer from owner to contract
        cUSDC.transferFrom(msg.sender, address(this), amount);
        
        // Update payroll balance
        payroll.balance = e.add(payroll.balance, amount);
        e.allow(payroll.balance, address(this));
        e.allow(payroll.balance, msg.sender);
        
        emit PayrollFunded(payrollId, 0); // Amount is encrypted
    }

    function addEmployee(
        uint256 payrollId,
        address employee,
        bytes calldata encryptedSalary
    ) external payable {
        Payroll storage payroll = payrolls[payrollId];
        if (payroll.owner != msg.sender) revert NotOwner();
        
        _requireFee(5);
        
        euint256 userSalary = e.newEuint256(encryptedSalary, msg.sender);
        
        // Re-wrap so Contract owns the salary data
        euint256 salary = e.add(userSalary, e.asEuint256(0));
        
        e.allow(salary, address(this));
        e.allow(salary, msg.sender);
        e.allow(salary, employee);
        
        // If employee already existed and was active, subtract old salary first
        if (payroll.employees[employee].active) {
            payroll.totalSalary = e.sub(payroll.totalSalary, payroll.employees[employee].salary);
        }
        
        payroll.employees[employee] = Employee({
            salary: salary,
            active: true
        });
        
        // Update total salary
        payroll.totalSalary = e.add(payroll.totalSalary, salary);
        e.allow(payroll.totalSalary, address(this));
        e.allow(payroll.totalSalary, msg.sender);
        
        // Only push if not already in list to avoid duplicates
        bool exists = false;
        for(uint i=0; i<payroll.employeeList.length; i++) {
            if(payroll.employeeList[i] == employee) {
                exists = true;
                break;
            }
        }
        if(!exists) {
            payroll.employeeList.push(employee);
        }
        
        emit EmployeeAdded(payrollId, employee);
    }

    function removeEmployee(uint256 payrollId, address employee) external payable {
        Payroll storage payroll = payrolls[payrollId];
        if (payroll.owner != msg.sender) revert NotOwner();
        _requireFee(3);
        
        if (payroll.employees[employee].active) {
            payroll.employees[employee].active = false;
            
            // Subtract from total salary
            payroll.totalSalary = e.sub(payroll.totalSalary, payroll.employees[employee].salary);
            e.allow(payroll.totalSalary, address(this));
            e.allow(payroll.totalSalary, msg.sender);
        }
        
        emit EmployeeRemoved(payrollId, employee);
    }

    /**
     * @notice Employee claims salary from payroll contract balance for a specific period
     * @dev User pays fee
     */
    function claimSalary(uint256 payrollId, uint256 periodId) external payable {
        Payroll storage payroll = payrolls[payrollId];
        Employee storage emp = payroll.employees[msg.sender];
        
        if (!emp.active) revert NotEmployee();
        if (periodId > payroll.currentPeriod || periodId == 0) revert("Invalid Period");
        
        _requireFee(25);
        
        // Check 1: Has user already claimed for this period? (Encrypted check)
        // claimed[period][user] is euint256 (0 or 1). 1 = claimed.
        euint256 isClaimedVal = payroll.claimed[periodId][msg.sender];
        ebool isClaimed = e.eq(isClaimedVal, e.asEuint256(1));
        
        // Check 2: Does contract have enough balance?
        ebool hasBalance = e.ge(payroll.balance, emp.salary);
        
        // Condition: Not claimed AND Has balance
        ebool shouldPay = e.and(e.not(isClaimed), hasBalance);
        
        // Calculate amount to pay: if shouldPay is true, pay salary, else 0
        euint256 amountToPay = e.select(shouldPay, emp.salary, e.asEuint256(0));
        
        // Update Status: New Status = Old Status OR ShouldPay (If we pay, status becomes 1)
        // e.select(shouldPay, 1, oldStatus) -> effectively sets to 1 if paid
        euint256 newStatus = e.select(shouldPay, e.asEuint256(1), isClaimedVal);
        payroll.claimed[periodId][msg.sender] = newStatus;
        e.allow(newStatus, address(this));
        e.allow(newStatus, msg.sender); // Allow user to check their status later
        
        // Update Balance
        payroll.balance = e.sub(payroll.balance, amountToPay);
        e.allow(payroll.balance, address(this));
        e.allow(payroll.balance, payroll.owner);
        
        // Transfer
        e.allow(amountToPay, address(cUSDC));
        cUSDC.transferHandle(msg.sender, amountToPay);
        
        emit SalaryClaimed(payrollId, msg.sender, periodId);
    }

    function startNewPeriod(uint256 payrollId) external {
        Payroll storage payroll = payrolls[payrollId];
        if (payroll.owner != msg.sender) revert NotOwner();
        
        payroll.currentPeriod++;
    }

    function getEmployeeCount(uint256 payrollId) external view returns (uint256) {
        return payrolls[payrollId].employeeList.length;
    }

    function getEmployeeList(uint256 payrollId) external view returns (address[] memory) {
        return payrolls[payrollId].employeeList;
    }

    // Return encrypted status (0 or 1)
    function checkClaimStatus(uint256 payrollId, uint256 periodId, address employee) external view returns (euint256) {
        return payrolls[payrollId].claimed[periodId][employee];
    }

    function getEmployeeSalary(uint256 payrollId, address employee) external view returns (euint256) {
        return payrolls[payrollId].employees[employee].salary;
    }

    function getPayrollBalance(uint256 payrollId) external view returns (euint256) {
        return payrolls[payrollId].balance;
    }
    
    function getTotalSalary(uint256 payrollId) external view returns (euint256) {
        return payrolls[payrollId].totalSalary;
    }

    function _requireFee(uint256 cipherTextCount) internal view {
        if (msg.value < inco.getFee() * cipherTextCount) revert InsufficientFees();
    }

    function getIncoFee() public pure returns (uint256) {
        return inco.getFee();
    }

    function getPayrollsByOwner(address _owner) external view returns (uint256[] memory) {
        return ownerPayrolls[_owner];
    }
}
