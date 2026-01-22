// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { e, ebool, euint256, inco } from "@inco/lightning/src/Lib.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title ConfidentialUSDC
 * @notice Wrapper for public USDC with FHE privacy
 * @dev Users deposit public USDC and receive encrypted cUSDC balance
 */
import { DecryptionAttestation } from "@inco/lightning/src/lightning-parts/DecryptionAttester.types.sol";

    /**
     * @title ConfidentialUSDC
     * @notice Wrapper for public USDC with FHE privacy and Trustless Withdrawals
     * @dev Users deposit public USDC and receive encrypted cUSDC balance. Withdrawals are verified by Inco Network Validators.
     */
    contract ConfidentialUSDC is Ownable2Step {
    error InsufficientFees();
    error InsufficientBalance();
    error InvalidAmount();
    error InvalidAttestation();
    error HandleMismatch();
    error NoPendingRequest();

    event Deposit(address indexed user, uint256 amount);
    event WithdrawRequest(address indexed user);
    event WithdrawClaim(address indexed user, uint256 amount);
    event Transfer(address indexed from, address indexed to, euint256 amount);

    IERC20 public immutable underlyingToken;
    euint256 public totalSupply;

    mapping(address => euint256) internal balances;
    mapping(address => mapping(address => euint256)) internal allowances;
    
    // Stores the finalized encrypted handle waiting to be claimed
    mapping(address => euint256) public pendingWithdrawals; 
    mapping(address => bool) public hasPendingRequest;

    constructor(address _underlyingToken) Ownable(msg.sender) {
        underlyingToken = IERC20(_underlyingToken);
    }

    /**
     * @notice Deposit public USDC and receive encrypted cUSDC
     * @param amount Amount of USDC to deposit (public)
     */
    function deposit(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();

        // Transfer USDC from user to contract
        underlyingToken.transferFrom(msg.sender, address(this), amount);

        // Mint encrypted cUSDC
        euint256 encryptedAmount = e.asEuint256(amount);

        if (euint256.unwrap(balances[msg.sender]) == bytes32(0)) {
            balances[msg.sender] = encryptedAmount;
        } else {
            balances[msg.sender] = e.add(balances[msg.sender], encryptedAmount);
        }

        e.allow(balances[msg.sender], address(this));
        e.allow(balances[msg.sender], msg.sender);

        totalSupply = e.add(totalSupply, encryptedAmount);
        e.reveal(totalSupply);

        emit Deposit(msg.sender, amount);
    }

    /**
     * @notice Step 1: Request withdrawal. Burns cUSDC and allows Inco Network to attest the amount.
     * @param amount The encrypted amount user WANTS to withdraw (passed as public uint for encrypting on-chain or user could pass verified ciphertext)
     * For simplicity of this interface, we take a public amount request input, but logic is FHE.
     */
    function requestWithdraw(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        if (hasPendingRequest[msg.sender]) revert("Pending request exists");

        euint256 encryptedAmount = e.asEuint256(amount);

        // 1. Check encrypted balance
        ebool hasBalance = e.ge(balances[msg.sender], encryptedAmount);
        
        // 2. Calculate actual transferable amount (0 if insufficient balance)
        euint256 finalAmount = e.select(hasBalance, encryptedAmount, e.asEuint256(0));

        // 3. Burn encrypted cUSDC immediately prevents double-spend
        balances[msg.sender] = e.sub(balances[msg.sender], finalAmount);
        
        // 4. Update Total Supply
        totalSupply = e.sub(totalSupply, finalAmount);
        e.reveal(totalSupply);

        // 5. Store pending withdrawal handle
        // User will use this handle off-chain to request an Attestation from Inco Validators
        pendingWithdrawals[msg.sender] = finalAmount;
        hasPendingRequest[msg.sender] = true;

        e.allow(balances[msg.sender], address(this));
        e.allow(balances[msg.sender], msg.sender);
        
        // Allow user to request attestation on this withdrawal handle
        e.allow(finalAmount, msg.sender);
        
        emit WithdrawRequest(msg.sender); 
    }

    /**
     * @notice Step 2: Claim Public USDC using Inco Network Attestation.
     * @dev User provides a proof (Attestation) signed by Validators that decrypts the pendingWithdrawals[msg.sender] handle.
     * @param attestation The decryption attestation data containing the value and handle.
     * @param signatures The signatures from validators ensuring the attestation is valid.
     */
    function claimWithdraw(
        DecryptionAttestation memory attestation,
        bytes[] memory signatures
    ) external {
        if (!hasPendingRequest[msg.sender]) revert NoPendingRequest();

        // 1. Verify signatures from Inco Network Validators
        // This ensures the 'attestation.value' is the true decrypted result of 'attestation.handle'
        // and that it was authorized by the network.
        bool isValid = inco.incoVerifier().isValidDecryptionAttestation(attestation, signatures);
        if (!isValid) revert InvalidAttestation();

        // 2. Verify the attested handle matches the user's pending withdrawal handle
        // This prevents replay attacks using attestations from other handles.
        if (euint256.unwrap(pendingWithdrawals[msg.sender]) != attestation.handle) {
            revert HandleMismatch();
        }

        // 3. Get the decrypted value (amount) directly from the trusted attestation
        uint256 amount = uint256(attestation.value);

        // 4. Clear Pending State
        pendingWithdrawals[msg.sender] = e.asEuint256(0); 
        hasPendingRequest[msg.sender] = false;

        // 5. Transfer Public USDC
        if (amount > 0) {
            underlyingToken.transfer(msg.sender, amount);
        }

        emit WithdrawClaim(msg.sender, amount);
    }

    /**
     * @notice Cancel a pending withdrawal request and restore cUSDC balance
     * @dev Use this if claim failed or user changed their mind
     */
    function cancelPendingWithdraw() external {
        if (!hasPendingRequest[msg.sender]) revert NoPendingRequest();
        
        // Restore cUSDC balance
        euint256 pendingAmount = pendingWithdrawals[msg.sender];
        balances[msg.sender] = e.add(balances[msg.sender], pendingAmount);
        totalSupply = e.add(totalSupply, pendingAmount);
        
        // Clear pending state
        pendingWithdrawals[msg.sender] = e.asEuint256(0);
        hasPendingRequest[msg.sender] = false;
        
        e.allow(balances[msg.sender], address(this));
        e.allow(balances[msg.sender], msg.sender);
    }


    /**
     * @notice Transfer encrypted cUSDC to another address
     * @param to Recipient address
     * @param encryptedAmount Encrypted amount from client
     */

    function transfer(address to, bytes calldata encryptedAmount) external payable returns (bool) {
        _requireFee(1);
        
        euint256 amount = e.newEuint256(encryptedAmount, msg.sender);
        return _transferByHandle(to, amount);
    }

    /**
     * @notice Transfer encrypted cUSDC to another address (handle version) - INTERNAL ONLY
     */
    function transfer(address to, euint256 amount) internal returns (bool) {
        return _transferByHandle(to, amount);
    }

    /**
     * @notice Transfer using euint256 handle - for contract-to-contract transfers
     */
    function transferHandle(address to, euint256 amount) external returns (bool) {
        return _transferByHandle(to, amount);
    }

    function _transferByHandle(address to, euint256 amount) internal returns (bool) {
        e.allow(amount, address(this));

        ebool canTransfer = e.ge(balances[msg.sender], amount);
        _transfer(msg.sender, to, amount, canTransfer);

        return true;
    }

    /**
     * @notice Internal transfer function
     */
    function _transfer(address from, address to, euint256 amount, ebool isTransferable) internal {
        euint256 transferValue = e.select(isTransferable, amount, e.asEuint256(0));

        if (euint256.unwrap(balances[to]) == bytes32(0)) {
            balances[to] = transferValue;
        } else {
            balances[to] = e.add(balances[to], transferValue);
        }

        e.allow(balances[to], address(this));
        e.allow(balances[to], to);

        balances[from] = e.sub(balances[from], transferValue);
        e.allow(balances[from], address(this));
        e.allow(balances[from], from);

        emit Transfer(from, to, transferValue);
    }

    /**
     * @notice Approve spender to transfer encrypted amount
     * @param spender Address to approve
     * @param encryptedAmount Encrypted amount to approve
     */
    function approve(address spender, bytes calldata encryptedAmount) external payable returns (bool) {
        _requireFee(1);
        
        euint256 amount = e.newEuint256(encryptedAmount, msg.sender);
        
        allowances[msg.sender][spender] = amount;
        e.allow(amount, address(this));
        e.allow(amount, msg.sender);
        e.allow(amount, spender);
        
        return true;
    }

    /**
     * @notice Get allowance for spender
     */
    function allowance(address owner, address spender) public view returns (euint256) {
        return allowances[owner][spender];
    }

    /**
     * @notice Transfer from owner to recipient using allowance
     * @param from Owner address
     * @param to Recipient address
     * @param encryptedAmount Encrypted amount to transfer
     */
    function transferFrom(
        address from,
        address to,
        bytes calldata encryptedAmount
    ) external payable returns (bool) {
        _requireFee(1);
        
        euint256 amount = e.newEuint256(encryptedAmount, msg.sender);
        return _transferFromByHandle(from, to, amount);
    }

    /**
     * @notice Transfer from owner to recipient using allowance (handle version)
     * @dev Use this when calling from another contract that already has the handle
     */
    function transferFrom(
        address from,
        address to,
        euint256 amount
    ) external returns (bool) {
        return _transferFromByHandle(from, to, amount);
    }

    function _transferFromByHandle(
        address from,
        address to,
        euint256 amount
    ) internal returns (bool) {
        e.allow(amount, address(this));
        
        // Check allowance
        euint256 currentAllowance = allowances[from][msg.sender];
        ebool hasAllowance = e.ge(currentAllowance, amount);
        
        // Check balance
        ebool hasBalance = e.ge(balances[from], amount);
        
        // Can transfer if both allowance and balance are sufficient
        ebool canTransfer = e.and(hasAllowance, hasBalance);
        
        // Update allowance
        euint256 newAllowance = e.select(canTransfer, e.sub(currentAllowance, amount), currentAllowance);
        allowances[from][msg.sender] = newAllowance;
        e.allow(newAllowance, address(this));
        e.allow(newAllowance, from);
        e.allow(newAllowance, msg.sender);
        
        // Transfer
        _transfer(from, to, amount, canTransfer);
        
        return true;
    }

    /**
     * @notice Get encrypted balance of an address
     */
    function balanceOf(address wallet) public view returns (euint256) {
        return balances[wallet];
    }

    /**
     * @notice Get required fee for FHE operations
     */
    function getIncoFee() public pure returns (uint256) {
        return inco.getFee();
    }

    /**
     * @notice Check fee requirement
     */
    function _requireFee(uint256 cipherTextCount) internal view {
        if (msg.value < inco.getFee() * cipherTextCount) revert InsufficientFees();
    }
}
