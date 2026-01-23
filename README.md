# SilentPay 🤫💸

**Confidential & Secure Payroll Management on Inco Network**

SilentPay is a state-of-the-art, privacy-preserving payroll application powered by **Inco Network**, the confidentiality layer of Web3. It leverages **Confidential Computing** to empower organizations to manage employee salaries and balances with absolute privacy on-chain, ensuring that sensitive financial data remains encrypted while being trustlessly verifiable.

---

## 🌟 Key Features

- **Confidential Salaries:** Salary amounts are stored as encrypted handles (`euint256`). Only the employee can view and claim their own salary details.
- **Privacy-First Dashboard:** Real-time encrypted display of fund balances and monthly obligations for employers.
- **Trustless Withdrawals:** Utilizes Inco's **Decryption Attestation (KMS)** for secure, trustless unwrapping of confidential USDC back to public USDC.
- **Batch Processing:** Optimized employee overview that fetches and decrypts multiple data points (salary + claim status) in a single cryptographic operation.
- **Doma Design System:** A premium, dark-themed UI featuring glassmorphism, smooth animations, and a curated color palette (Base Blue & Emerald).
- **Explorer Integration:** Direct links to **Base Sepolia Explorer** for every successful transaction (Wrap, Unwrap, Transfer).
- **Modern Typography:** Optimized brand identity using **Outfit** for the logo and **Urbanist** for an elegant interface.

---

## 🏗 Architecture

SilentPay is built as a decentralized application (dApp) consisting of two main layers:

### 1. Smart Contracts (`contracts/`)
- Developed in Solidity 0.8.30+, leveraging the latest `@inco/lightning` library.
- **`ConfidentialUSDC.sol`**: A confidential wrapper for public USDC.
- **`ConfidentialPayroll.sol`**: Manages payroll registration, employee lists, and encrypted salary claims.
- **Trustless Decryption**: Uses Inco Network Validator signatures for secure, decentralized decryption.

### 2. Frontend Application (`frontend/`)
- **Framework**: Next.js with App Router.
- **Styling**: Utility-first Tailwind CSS with custom Doma Design tokens.
- **Wallet**: Integrated with **RainbowKit** and **Wagmi** for seamless Web3 connectivity.
- **State Management**: Optimized hooks for batch decryption and confidential computing transactions.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **Browser Wallet**: Metamask or any RainbowKit supported wallet
- **Network**: Base Sepolia (for RPC) + Inco Network (for Confidential Computing)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ToanBm/inco-payroll.git
   cd inco-payroll
   ```

2. **Setup Smart Contracts:**
   ```bash
   cd contracts
   npm install
   # Compile contracts
   npx hardhat compile
   # Deploy
   npx hardhat run scripts/deployUSDC.ts --network baseSepolia
   npx hardhat run scripts/deployPayroll.ts --network baseSepolia
   ```

3. **Setup Frontend:**
   ```bash
   cd ../frontend
   npm install
   # Set environment variables in .env (see .env.example)
   npm run dev
   ```

4. **Access:** Open `http://localhost:3000` in your browser.

---

## 📜 Technical Details

- **Chain**: Base Sepolia (L2) + Inco Network (Confidentiality Layer).
- **Encryption**: Confidential Computing via Inco Lightning.
- **Trust Model**: Cryptographically secure privacy + Decentralized trust (Inco Validators via TEE/KMS).

## 🤝 Contribution

SilentPay is an open-source project. Feel free to open issues or submit PRs to improve the security, performance, or UI of the platform.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

Made with ❤️ by [ToanBm](https://github.com/ToanBm)
