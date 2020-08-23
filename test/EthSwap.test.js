const Token = artifacts.require("Token");
const EthSwap = artifacts.require("EthSwap");

require('chai')
  .use(require('chai-as-promised'))
  .should();

function tokenToWei(n) {
  return web3.utils.toWei(n);
}


contract('EthSwap', ([deployer, investor]) => {
  let token;
  let ethSwap;

  before(async () => {
    token = await Token.new();
    ethSwap = await EthSwap.new(token.address);
    await token.transfer(ethSwap.address, tokenToWei('1000000'));
  });

  describe('Token deployment', async () => {
    it('should have a contract name', async () => {
      const name = await token.name();
      assert.equal(name, 'DApp Token');
    })
  });

  describe('EthSwap', async () => {
    it('should have a contract name', async () => {
      const name = await ethSwap.name();
      assert.equal(name, 'EthSwap Instant Exchange');
    });

    it('should have all the tokens', async () => {
      const balance = await token.balanceOf(ethSwap.address);
      assert.equal(balance.toString(), tokenToWei('1000000'));
    });
    describe('buyTokens function', async () => {

      let result;

      before(async () => {
        result = await ethSwap.buyTokens({from: investor, value: web3.utils.toWei('1', 'ether')});
      });

      it('allows for a user to buy tokens for a fixed price', async () => {
        let investorBalance = await token.balanceOf(investor);
        assert.equal(investorBalance.toString(), tokenToWei('100'));

        let ethSwapBalance = await token.balanceOf(ethSwap.address);
        assert.equal(ethSwapBalance.toString(), tokenToWei('999900'));

        let ethSwapEtherBalance = await web3.eth.getBalance(ethSwap.address)
        assert.equal(ethSwapEtherBalance.toString(), web3.utils.toWei('1', 'Ether'));

        const event = result.logs[0].args;
        assert.equal(event.account, investor);
        assert.equal(event.token, token.address);
        assert.equal(event.amount.toString(), tokenToWei('100'));
        assert.equal(event.rate.toString(), '100');
      });
    });

    describe('sellTokens function', async () => {

      let result;

      before(async () => {
        await token.approve(ethSwap.address, tokenToWei('100'), {from: investor});
        result = await ethSwap.sellTokens(tokenToWei('100'), {from: investor});
      });

      it('allows for a user to sell tokens for a fixed price', async () => {
        let investorBalance = await token.balanceOf(investor);
        assert.equal(investorBalance.toString(), tokenToWei('0'));

        let ethSwapBalance = await token.balanceOf(ethSwap.address);
        assert.equal(ethSwapBalance.toString(), tokenToWei('1000000'));

        let ethSwapEtherBalance = await web3.eth.getBalance(ethSwap.address)
        assert.equal(ethSwapEtherBalance.toString(), web3.utils.toWei('0', 'Ether'));

        const event = result.logs[0].args;
        assert.equal(event.account, investor);
        assert.equal(event.token, token.address);
        assert.equal(event.amount.toString(), tokenToWei('100'));
        assert.equal(event.rate.toString(), '100');

        //FAILURE can't sell more token
        await ethSwap.sellTokens(tokenToWei('500'), {from: investor}).should.be.rejected;

      });
    });
  });
});