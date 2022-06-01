import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { snapshottedBeforeEach, toTokens } from '../shared/utils';
import { E8MarketPlace, E8MintableNft, MockToken } from '../typechain-types';

describe('E8MarketPlace', () => {
  let aliceAccount: SignerWithAddress,
    bobAccount: SignerWithAddress,
    carlAccount: SignerWithAddress,
    donAccount: SignerWithAddress;
  let alice: string, bob: string, carl: string, don: string;
  before(async () => {
    [aliceAccount, bobAccount, carlAccount, donAccount] = await ethers.getSigners();
    [alice, bob, carl, don] = [aliceAccount, bobAccount, carlAccount, donAccount].map((account) => account.address);
  });

  let token: MockToken;
  let marketPlace: E8MarketPlace;
  let nft: E8MintableNft;

  const id = 0;
  const limit = 100;
  const price = 10;
  const active = true;
  const newLimit = 1000;
  const newPrice = 1;
  const newActive = true;

  snapshottedBeforeEach(async () => {
    nft = await (await ethers.getContractFactory('E8MintableNft')).deploy();
    token = await (await ethers.getContractFactory('MockToken')).deploy();
    marketPlace = await (await ethers.getContractFactory('E8MarketPlace')).deploy(nft.address, token.address);
    await nft.grantRole('0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6', marketPlace.address); // grant MINTER_ROLE
    await token.mint(alice, toTokens('100000000000000'));
    await token.mint(bob, toTokens('100000000000000'));
    await token.approve(marketPlace.address, 100000000000000);
  });

  describe('Lots', () => {
    before(async () => {
      await nft.mint(alice, 1, '0', '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6');
      await nft.mintBatch(
        alice,
        [1, 1],
        ['1', '2'],
        '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
      );
    });
    it('Method CreareLot should reject', async () => {
      await expect(marketPlace.createLot(999, limit, price, active)).to.be.revertedWith(
        'E8MarketPlace: token dont exist',
      );
    });
    it('Method CreareLot should success', async () => {
      await marketPlace.createLot(id, limit, price, active);
      const lot = await marketPlace.getLotInfo(id);
      expect(lot[0].toNumber()).to.be.eq(limit);
      expect(lot[1].toNumber()).to.be.eq(0);
      expect(lot[2].toNumber()).to.be.eq(price);
      expect(lot[3]).to.be.eq(active);
    });
    it('Method createBanchLot should reject', async () => {
      await expect(marketPlace.createBatchLot(limit, price, active, [0, 1, 999], [1, 1, 90])).to.be.revertedWith(
        'E8MintableNft: one of tokens is not exist',
      );
    });
    it('Method createBanchLot should success', async () => {
      await marketPlace.createBatchLot(limit, price, active, [0, 1], [1, 1]);
      const batchLot = await marketPlace.getBatchLotInfo(id);

      expect(batchLot[0].toNumber()).to.be.eq(limit);
      expect(batchLot[1].toNumber()).to.be.eq(0);
      expect(batchLot[2].toNumber()).to.be.eq(price);
      expect(batchLot[3]).to.be.eq(active);
      expect(batchLot[4].map(Number)).to.be.deep.eq([0, 1]);
      expect(batchLot[5].map(Number)).to.be.deep.eq([1, 1]);
    });
    it('Method editLot should reject', async () => {
      await marketPlace.createLot(id, limit, price, active);
      const newLimit = 1000;
      const newPrice = 1;
      const newActive = false;
      await expect(marketPlace.editLot(id, limit, price, active)).to.be.revertedWith(
        'E8MarketPlace: lot must be not active',
      );
    });
    it('Method editLot should success', async () => {
      await marketPlace.createLot(id, limit, price, active);
      await marketPlace.setActiveForLot(false, id);
      await marketPlace.editLot(id, newLimit, newPrice, newActive);
      const lot = await marketPlace.getLotInfo(id);
      expect(lot[0].toNumber()).to.be.eq(newLimit);
      expect(lot[1].toNumber()).to.be.eq(0);
      expect(lot[2].toNumber()).to.be.eq(newPrice);
      expect(lot[3]).to.be.eq(newActive);
    });
    it('Method editBatchLot should reject', async () => {
      await marketPlace.createBatchLot(limit, price, active, [0, 1], [1, 1]);
      await expect(marketPlace.editBatchLot(0, limit, price, active, [0, 1, 999], [1, 1, 90])).to.be.revertedWith(
        'E8MarketPlace: batchLot must be not active',
      );
    });
    it('Method editBatchLot should success', async () => {
      await marketPlace.createBatchLot(limit, price, active, [0, 1], [1, 1]);
      await marketPlace.setActiveForBatchLot(false, 0);
      await marketPlace.editBatchLot(0, newLimit, newPrice, newActive, [0, 1], [1, 1]);
      const batchLot = await marketPlace.getBatchLotInfo(id);
      expect(batchLot[0].toNumber()).to.be.eq(newLimit);
      expect(batchLot[1].toNumber()).to.be.eq(0);
      expect(batchLot[2].toNumber()).to.be.eq(newPrice);
      expect(batchLot[3]).to.be.eq(newActive);
      expect(batchLot[4].map(Number)).to.be.deep.eq([0, 1]);
      expect(batchLot[5].map(Number)).to.be.deep.eq([1, 1]);
    });
  });
  describe('Buying', () => {
    before(async () => {
      await nft.mint(alice, 1, '0', '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6');
      await nft.mintBatch(
        alice,
        [1, 1],
        ['1', '2'],
        '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
      );
    });
    it('Method buy should reject if lot is not active', async () => {
      await expect(marketPlace.buy(0, 1)).to.be.revertedWith('MarketPlaceE8: lot is not active');
    });
    it('Method buy should reject if owerflow limit', async () => {
      await marketPlace.createLot(id, limit, price, active);
      await expect(marketPlace.buy(0, 110)).to.be.revertedWith('MarketPlaceE8: amount more planned supply');
    });
    it('Method buy should success', async () => {
      await marketPlace.createLot(id, limit, price, active);
      const aliceBalanceBefore = await nft.balanceOf(alice, 0);
      await marketPlace.buy(0, 1);
      const aliceBalanceAfter = await nft.balanceOf(alice, 0);
      expect(aliceBalanceAfter).to.be.eq(aliceBalanceBefore.add(1));
    });
    it('Method buyBatch should reject', async () => {
      await expect(marketPlace.buyBatch(0)).to.be.revertedWith('MarketPlaceE8: lot is not active');
    });
    it('Method buyBatch should success', async () => {
      await marketPlace.createBatchLot(limit, price, active, [0, 1], [1, 1]);
      const aliceBalanceBefore1 = await nft.balanceOf(alice, 0);
      const aliceBalanceBefore2 = await nft.balanceOf(alice, 1);
      await marketPlace.buyBatch(0);
      const aliceBalanceAfter1 = await nft.balanceOf(alice, 0);
      const aliceBalanceAfter2 = await nft.balanceOf(alice, 1);
      expect(aliceBalanceAfter1).to.be.eq(aliceBalanceBefore1.add(1));
      expect(aliceBalanceAfter2).to.be.eq(aliceBalanceBefore2.add(1));
    });
  });

  describe('Method grabTokens', () => {
    const contractBalance = 100000;
    before(async () => {
      await token.transfer(marketPlace.address, contractBalance);
    });
    it('Method grabTokens should reject if caller not owner', async () => {
      await expect(marketPlace.connect(bobAccount).gradTokens()).to.be.revertedWith('Ownable: caller is not the owner');
    });
    it('Method grabTokens should success', async () => {
      const balanceBefore = await token.balanceOf(alice);
      await marketPlace.gradTokens();
      const balanceAfter = await token.balanceOf(alice);
      expect(balanceAfter).to.be.eq(balanceBefore.add(contractBalance));
    });
  });

  describe('geting Lots', () => {
    const contractBalance = 100000;
    before(async () => {
      await nft.mint(alice, 1, '0', '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6');
      await nft.mintBatch(
        alice,
        [1, 1],
        ['1', '2'],
        '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
      );

      await marketPlace.createBatchLot(limit, price, active, [0, 1], [1, 1]);
      await marketPlace.createLot(id, limit, price, active);
    });
    it('Method getAllLots success', async () => {
      const allLotInfo = await marketPlace.getAllLots(0, 5);
      const firstLot = allLotInfo[0];
      expect(allLotInfo.length).to.be.eq(5);
      expect(firstLot[0].toNumber()).to.be.eq(limit);
      expect(firstLot[1].toNumber()).to.be.eq(0);
      expect(firstLot[2].toNumber()).to.be.eq(price);
      expect(firstLot[3]).to.be.eq(active);
    });
    it('Method getAllLots success return empty lot', async () => {
      const allLotInfo = await marketPlace.getAllLots(0, 5);
      const emptyLot = allLotInfo[1];
      expect(allLotInfo.length).to.be.eq(5);
      expect(emptyLot[0].toNumber()).to.be.eq(0);
      expect(emptyLot[1].toNumber()).to.be.eq(0);
      expect(emptyLot[2].toNumber()).to.be.eq(0);
      expect(emptyLot[3]).to.be.eq(false);
    });
    it('Method getAllBatchLots success', async () => {
      const allLotInfo = await marketPlace.getAllBatchLots(0, 5);
      const firstBatchLot = allLotInfo[0];
      expect(allLotInfo.length).to.be.eq(5);
      expect(firstBatchLot[0].toNumber()).to.be.eq(limit);
      expect(firstBatchLot[1].toNumber()).to.be.eq(0);
      expect(firstBatchLot[2].toNumber()).to.be.eq(price);
      expect(firstBatchLot[3]).to.be.eq(active);
      expect(firstBatchLot[4].map(Number)).to.be.deep.eq([0, 1]);
      expect(firstBatchLot[5].map(Number)).to.be.deep.eq([1, 1]);
    });
    it('Method getAllBatchLots success return empty lot', async () => {
      const allLotInfo = await marketPlace.getAllBatchLots(0, 5);
      const emptyBatchLot = allLotInfo[1];
      expect(allLotInfo.length).to.be.eq(5);
      expect(emptyBatchLot[0].toNumber()).to.be.eq(0);
      expect(emptyBatchLot[1].toNumber()).to.be.eq(0);
      expect(emptyBatchLot[2].toNumber()).to.be.eq(0);
      expect(emptyBatchLot[3]).to.be.eq(false);
      expect(emptyBatchLot[4].map(Number)).to.be.deep.eq([]);
      expect(emptyBatchLot[5].map(Number)).to.be.deep.eq([]);
    });
  });
});
