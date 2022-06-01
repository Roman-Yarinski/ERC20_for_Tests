import { BigNumber, BigNumberish } from 'ethers';
import { ethers } from 'hardhat';

export async function getBlockTimestamp() {
  return (await ethers.provider.getBlock('latest')).timestamp;
}

export async function getBlockNumber() {
  return (await ethers.provider.getBlock('latest')).number;
}

export async function evmIncreaseTime(offset: number) {
  await ethers.provider.send('evm_mine', [(await getBlockTimestamp()) + offset]);
}

const snapshots: string[] = [];
/**
 * Runs `fn` once, saves EVM state and restores it before each tests.
 * USE ONLY ONCE PER `describe` BLOCK.
 */
export function snapshottedBeforeEach(fn: () => Promise<void>) {
  before(async () => {
    snapshots.push(await ethers.provider.send('evm_snapshot', []));
    await fn();
  });

  beforeEach(async () => {
    snapshots.push(await ethers.provider.send('evm_snapshot', []));
  });

  afterEach(async () => {
    if (!(await ethers.provider.send('evm_revert', [snapshots.pop()]))) {
      throw new Error('evm_revert failed');
    }
  });

  after(async () => {
    if (!(await ethers.provider.send('evm_revert', [snapshots.pop()]))) {
      throw new Error('evm_revert failed');
    }
  });
}

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const NON_ZERO_ADDRESS = '0x0000000000000000000000000000000000000001';
export const LEDGITY_DECIMALS = BigNumber.from('18');
export function toTokens(amount: BigNumberish, decimals: BigNumberish = LEDGITY_DECIMALS) {
  return BigNumber.from(amount).mul(BigNumber.from('10').pow(decimals));
}
