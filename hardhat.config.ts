import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@openzeppelin/hardhat-upgrades';
import '@typechain/hardhat';
import 'hardhat-deploy';
import { HardhatUserConfig, task } from 'hardhat/config';
import 'solidity-coverage';
import { BSC_PRIVATE_KEY, ETH_API_KEY, POLYGON_PRIVATE_KEY, TEST_PRIVATE_KEY } from './env';

function typedNamedAccounts<T>(namedAccounts: { [key in string]: T }) {
  return namedAccounts;
}

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    private: {
      url: 'http://52.12.224.224:8545',
      chainId: 1337,
      accounts: [TEST_PRIVATE_KEY],
    },
    bsctestnet: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      chainId: 97,
      accounts: [TEST_PRIVATE_KEY],
    },
    bscmainnet: {
      url: 'https://bsc-dataseed.binance.org/',
      chainId: 56,
      accounts: [BSC_PRIVATE_KEY],
    },
    polygon: {
      url: 'https://matic-mainnet.chainstacklabs.com',
      chainId: 137,
      accounts: [POLYGON_PRIVATE_KEY],
    },
    mumbai: {
      url: 'https://rpc-mumbai.matic.today/',
      chainId: 80001,
      accounts: [POLYGON_PRIVATE_KEY],
    },
    kovan: {
      url: 'https://speedy-nodes-nyc.moralis.io/894483ce389226d7ea608ba8/eth/kovan',
      chainId: 42,
      accounts: [TEST_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: ETH_API_KEY,
  },
  namedAccounts: typedNamedAccounts({
    deployer: 0,
    tokenE8: {
      polygon: '0x08e175a1eac9744a0f1ccaeb8f669af6a2bda3ce',
      bsctestnet: '0x59562aa0056673888cc21c019bb7e90c970c599f',
      mumbai: '0x6755b91b914dba473252a25c9cf35cf5135146bf',
    },
    nftProxyAddress: {
      polygon: '0x2632F66228503bCf663cc5110096ECcFc44655b0',
      bsctestnet: '0xd7f05c0ceCffa15b8Ccd9eA01c875B94D920947c',
      mumbai: '',
    },
    owner: {
      polygon: '0x2da8a8957b0c59646f553328d57D851DE26D0B50',
      bsctestnet: '0xB984f9F42d405A37F7f3903C73cbF7112DCc859b',
      mumbai: '0xB984f9F42d405A37F7f3903C73cbF7112DCc859b',
    },
  }),
};

export default config;

task('verify-all', async (_, { run, deployments, ethers }) => {
  const { typedDeployments } = await import('./shared/typed-hardhat-deploy');
  const { get } = typedDeployments(deployments);
  const names = ['E8MintableNft', 'E8MarketPlace'] as const;
  for (const name of names) {
    const { address } = await get(name);
    try {
      await run('verify:verify', { address });
    } catch (e) {
      console.error(e);
    }
  }
});
