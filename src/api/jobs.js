const express = require('express');
const { getProfile } = require('../middleware/getProfile');
const { sequelize } = require('../model');

const uppercaseFirst = str => `${str[0].toUpperCase()}${str.substr(1)}`;

const router = express.Router()

/**
 * @returns all unpaid jobs
 */
router.get('/jobs/unpaid', getProfile, async (req, res) => {
  try {
    const { Contract, Job } = req.app.get('models')

    const jobs = await Job.findAll({
      where: {
        paid: false,
        [`$Contract.${uppercaseFirst(req.profile.type)}Id$`]: req.profile.id,
        [`$Contract.Status$`]: 'in_progress',
      },
      include: { model: Contract, attributes: [] } });

    if (!jobs) return res.status(404).end()

    res.json(jobs)
  } catch (err) {
    return res.status(500).end()
  }
})

/**
 * @returns pays a job
 */
router.post('/jobs/:id/pay', getProfile, async (req, res) => {
  try {
    const { Job, Contract } = req.app.get('models')
    const { id } = req.params

    const job = await Job.findOne({
      where: {
        id,
        [`$Contract.${uppercaseFirst(req.profile.type)}Id$`]: req.profile.id,
      },
      include: { model: Contract, attributes: [] }
    })

    if (!job) return res.status(404).end()

    if (job.paid) {
      return res.status(400).send({ message: 'This job has already been paid out' })
    }

    const contract = await job.getContract()
    const contractor = await contract.getContractor()

    if (req.profile.balance >= job.price) {
      await sequelize.transaction((async (t) => {
        await req.profile.update({ balance: req.profile.balance - job.price  }, { transaction: t })
        await contractor.update({ balance: contractor.balance + job.price }, { transaction: t })
        await job.update({ paid: true, paymentDate: new Date() }, { transaction: t })
      }))
    } else {
      return res.status(400).send({ message: 'Not enough balance to pay for this job' })
    }

    res.json(job)
  } catch (err) {
    return res.status(500).end()
  }
})

module.exports = router;
