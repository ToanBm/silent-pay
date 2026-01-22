// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing wrap/unwrap functionality
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        // Mint 1M USDC to deployer for testing
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    /**
     * @notice Mint tokens to any address (for testing only)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Override decimals to match real USDC (6 decimals)
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
