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

  describe('Minting and geters', () => {
    before(async () => {
      await nft.mint(alice, 1, 'uri0', '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6');
      await nft.mintBatch(
        alice,
        [1, 1],
        ['uri1', 'uri2'],
        '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
      );
    });
    it('Method getCurrentId return id of next NFT', async () => {
      const currentId = await nft.getCurrentId();
      expect(currentId).to.eq(3);
    });
    it('Method getBaseURI ', async () => {
      const baseURI = await nft.getBaseURI();
      expect(baseURI).to.eq('ipfs://');
    });
    it('Method tokenURI', async () => {
      const tokenUri1 = await nft.tokenURI('0');
      expect(tokenUri1).to.eq('ipfs://uri0');
      const tokenUri2 = await nft.tokenURI('1');
      expect(tokenUri2).to.eq('ipfs://uri1');
    });
    it('Method batchTokenURI', async () => {
      const tokenUri1 = await nft.batchTokenURI([0, 1]);
      expect(tokenUri1).to.deep.eq(['ipfs://uri0', 'ipfs://uri1']);
    });
    it('Method setTokenURI', async () => {
      const tokenUriBefore = await nft.uri(0);
      await nft.setTokenURI(0, 'newUri0');
      const tokenUriAfter = await nft.uri(0);
      expect(tokenUriBefore).to.not.eq(tokenUriAfter);
      expect(tokenUriAfter).to.be.eq('ipfs://newUri0');
    });
    it('Method setURI ', async () => {
      await nft.setURI('newURI://');
      const baseURI = await nft.getBaseURI();
      expect(baseURI).to.eq('newURI://');
      const tokenUri = await nft.uri(0);
      expect(tokenUri).to.eq('newURI://uri0');
    });
    it('Method pause ', async () => {
      await nft.pause();
      const state = await nft.paused();
      expect(state).to.eq(true);
    });
    it('Method unpause ', async () => {
      await nft.pause();
      let state = await nft.paused();
      expect(state).to.eq(true);
      await nft.unpause();
      state = await nft.paused();
      expect(state).to.eq(false);
    });
  });
});
