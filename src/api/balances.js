const express = require('express')
const { getProfile } = require('../middleware/getProfile')

const router = express.Router()

/**
 * @returns deposits money into the balance of a client
 */
router.post('/balances/deposit/:clientId', getProfile, async (req, res) => {
  try {
    const { Profile, Job, Contract } = req.app.get('models')
    const { clientId } = req.params
    const { amount } = req.body

    const profile = await Profile.findOne({ where: { id: clientId } })
    if (!profile) return res.status(404).end()

    const amountToBePaid = await Job.sum('price', {
      where: {
        paid: false,
        '$Contract.ClientId$': req.profile.id
      },
      include: { model: Contract, attributes: [] }
    })

    if ((amount*0.25) > amountToBePaid) {
      return res.status(400).send({ message: `You can only pay up to 25% of your total jobs to be paid: $${amountToBePaid}` })
    }

    await profile.update({ balance: (profile.balance + amount) })

    res.json(profile)
  } catch (err) {
    return res.status(500).send()
  }
})

module.exports = router;
