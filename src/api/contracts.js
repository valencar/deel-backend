const express = require('express')
const { getProfile } = require('../middleware/getProfile')

const uppercaseFirst = str => `${str[0].toUpperCase()}${str.substr(1)}`;

const router = express.Router()

/**
 * @returns contract by id
 */
router.get('/contracts/:id', getProfile, async (req, res) => {
  try {
    const { Contract } = req.app.get('models')
    const { id } = req.params

    const contract = await Contract.findOne({ where: { id, [`${uppercaseFirst(req.profile.type)}Id`]: req.profile.id } })

    if (!contract) return res.status(404).end()

    res.json(contract)
  } catch (err) {
    return res.status(500).end()
  };
});

/**
 * @returns profile's contracts
 */
router.get('/contracts', getProfile, async (req, res) => {
  try {
    const { Contract } = req.app.get('models')

    const contracts = await Contract.findAll({ where: { [`${uppercaseFirst(req.profile.type)}Id`]: req.profile.id } });

    if (!contracts) return res.status(404).end()

    res.json(contracts)
  } catch (err) {
    return res.status(500).end()
  };
});

module.exports = router;
