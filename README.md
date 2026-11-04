# Nanopay

A fully onchain pay-per-call app on Arc Testnet. Buyers add USDC credits to a contract, then pay a tiny price for each call with one cheap transaction. Anyone can list a service and withdraw what it earns. There is no server and no admin.

Built with [Arc Studio](https://studio.arc.io)

**Live app:** https://prajwalspp-app-7ddbe3b3-a2d0-4734-95eb-f33d74d7cb9d.static.hf.space

**Contract (Arc Testnet):** [0xdfae2f7b64bbeead5fbed1f7de98286fd8c34b19](https://explorer.testnet.arc.io/address/0xdfae2f7b64bbeead5fbed1f7de98286fd8c34b19)

## Tech stack

- React, Vite, TypeScript, Tailwind CSS
- wagmi, viem, ConnectKit
- Solidity contract (Foundry, OpenZeppelin) on Arc Testnet with USDC

## Getting started

Prerequisites: [Bun](https://bun.sh), a browser wallet such as MetaMask, and [Foundry](https://book.getfoundry.sh) if you want to build or test the contract.

1. Install dependencies:

   ```bash
   bun install
   ```

2. Create a `.env` file in the project root with the deployed contract details:

   ```bash
   VITE_NANOMETER_ADDRESS=0xdfae2f7b64bbeead5fbed1f7de98286fd8c34b19
   VITE_NANOMETER_DEPLOY_BLOCK=70654866
   ```

3. Start the app and open http://localhost:5173:

   ```bash
   bun run dev
   ```

4. Get test USDC for Arc Testnet from the [Circle faucet](https://faucet.circle.com), then connect your wallet in the app.

### Other commands

```bash
bun run build            # production build into dist/
bun run check            # lint and typecheck
bun run contracts:build  # compile the contract
bun run contracts:test   # run contract tests
```

### Environment variables

- `VITE_NANOMETER_ADDRESS`: address of the deployed contract.
- `VITE_NANOMETER_DEPLOY_BLOCK`: block the contract was deployed in, used to bound event lookups.

## Using the app

1. Open the Sell tab, connect a wallet and list a service with a name and price.
2. In the Buy tab, add credits with test USDC.
3. Pay for any service. The result appears in Receipts with a link to the transaction.

## Push to GitHub

1. Create an empty repository on GitHub (no README or license).
2. From the project folder, run:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

Your `.env` file and `node_modules` are excluded by `.gitignore`, so no local settings are uploaded.

## Deploying your own copy

Run `bun run build` and upload the `dist/` folder to any static host. Set the two environment variables above before building.
