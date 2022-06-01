# Market Place Energy8

## Setup project

!!! Copy `env.example.ts` and rename it to `env.ts`. Fill in all the variables there !!!

Install dependencies

```sh
yarn install
```

Additionally [install](https://hardhat.org/guides/shorthand.html) `hh` shortcut to save some typing.
`hh` is equivalent to `yarn hardhat`.

```sh
yarn global add hardhat-shorthand
```

## Compile contracts

```sh
hh compile
```

## Run tests

```sh
hh test
```

## Run tests with coverage

```sh
hh coverage
```

Open `coverage/index.html` in the browser.

## Auto audit with slither

To audit all contracts, use the command :

```sh
slither .
```

To exclude warnings in subsequent audits, use :

```sh
slither . --triage
```

## Deploy

You should specify the network you want to deploy to. Replace `<network>` in any of the commands below with
the network of your choice(e.g., `bsctestnet`).

```sh
hh --network <network> deploy --tags nft
```

## Verify

You should specify the network you want to verify to. Replace `<network>` in any of the commands below with
the network of your choice(e.g., `bsctestnet`).

```sh
hh verify --network <network> DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1" "Argument 2"
```

---
