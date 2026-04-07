## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### SafeDeal Escrow On Celo Sepolia

Deploy the escrow contract to Celo Sepolia only for this phase:

```shell
$ forge script script/DeploySafeDealEscrow.s.sol:DeploySafeDealEscrow --rpc-url $SEPOLIA_RPC_URL --broadcast
```

Required deploy environment variables:

```shell
SEPOLIA_RPC_URL=https://sepolia-forno.celo-testnet.org
PRIVATE_KEY=0xyourdeployerprivatekey
```

After deployment, set these app environment variables:

```shell
NEXT_PUBLIC_NETWORK_ID=44787
NEXT_PUBLIC_RPC_URL=https://sepolia-forno.celo-testnet.org
NEXT_PUBLIC_USDC_ADDRESS=0x2A3684e9Dc3A8DFF868Bc06Aa9C3Ae20397Aa94
NEXT_PUBLIC_ESCROW_ADDRESS=0xYourSepoliaEscrowAddress
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
