# Confidential Counter - FHE Smart Contract

A simple counter smart contract using Fully Homomorphic Encryption (FHE) on Base Sepolia, powered by Inco Network's Lightning protocol.

## Features

- **Encrypted Counter**: Store and increment counter values using FHE
- **Privacy-Preserving**: All counter operations are performed on encrypted data
- **Base Sepolia Deployment**: Ready to deploy on Base Sepolia testnet

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `PRIVATE_KEY_BASE_SEPOLIA`: Your wallet private key (must have Base Sepolia ETH)
- `BASE_SEPOLIA_RPC_URL`: RPC endpoint for Base Sepolia

### 3. Compile Contract

```bash
npx hardhat compile
```

### 4. Deploy to Base Sepolia

```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

The deploy script will automatically:
- Deploy the `ConfidentialCounter` contract
- Update the frontend constants file with the new contract address and ABI

## Contract Functions

- `add(bytes encryptedValue)`: Add an encrypted value to the counter
- `increment()`: Increment counter by 1
- `getCounter()`: Get the encrypted counter value
- `getIncoFee()`: Get the required fee for FHE operations

## Project Structure

```
contracts/
├── contracts/
│   └── ConfidentialCounter.sol    # Main FHE counter contract
├── scripts/
│   └── deploy.ts                   # Deployment script
├── hardhat.config.ts               # Hardhat configuration
└── .env                            # Environment variables
```

## Learn More

- [Inco Network Documentation](https://docs.inco.org)
- [FHE Guide](https://docs.inco.org/guide/fhe)
- [Lightning SDK](https://docs.inco.org/js-sdk)
