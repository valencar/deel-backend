const express = require('express');
const moment = require('moment');
const Sequelize = require('sequelize');
const op = Sequelize.Op;
const { sequelize } = require('../model');

const router = express.Router()

/**
 * @returns the profession that earned the most money (sum of jobs paid) for any contactor that worked in the query time range
 */
router.get('/admin/best-profession', async (req, res) => {
  try {
    const { Profile, Job, Contract } = req.app.get('models')
    const { start, end } = req.query

    const profiles = await Profile.findAll({
      where: {
        '$Contractor->Jobs.createdAt$': {
          [op.between]: [moment(start).format('YYYY-MM-DD HH:mm'), moment(end).format('YYYY-MM-DD HH:mm')],
        },
      },
      attributes: [
        'profession',
        [sequelize.fn('sum', sequelize.col('Contractor->Jobs.price')), 'total_amount']
      ],
      group: ['profession'],
      type: 'Contractor',
      order: [
        [sequelize.col('total_amount'), 'DESC']
      ],
      include: {
        model: Contract, as: 'Contractor',
        required: true,
        include: {
          model: Job,
          attributes: ['price']
        }
      },
      raw: true
    });

    if (!profiles || profiles.length === 0) return res.status(404).end()

    const highestPayingProfession = profiles[0]

    return res.json({
      profession: highestPayingProfession.profession,
      amount: highestPayingProfession.total_amount
    })
  } catch (err) {
    return res.status(500).send()
  }
})

/**
 * @returns the clients the paid the most for jobs in the query time period
 */
router.get('/admin/best-clients', async (req, res) => {
  try {
    const { Profile, Job, Contract } = req.app.get('models')
    const { start, end } = req.query
    const limit = req.query.limit || 2

    const profiles = await Profile.findAll({
      where: {
        '$Client->Jobs.createdAt$': {
          [op.between]: [moment(start).format('YYYY-MM-DD HH:mm'), moment(end).format('YYYY-MM-DD HH:mm')],
        },
        '$Client->Jobs.paid$': true,
      },
      attributes: [
        'id',
        'firstName',
        'lastName',
        [sequelize.fn('sum', sequelize.col('Client->Jobs.price')), 'paid']
      ],
      group: ['Profile.id'],
      type: 'Client',
      order: [
        [sequelize.col('paid'), 'DESC']
      ],
      include: {
        model: Contract, as: 'Client',
        required: true,
        include: {
          model: Job,
          attributes: ['price']
        }
      },
      raw: true,
      subQuery: false,
      limit
    });

    if (profiles.length === 0) return res.status(404).end()

    return res.json(profiles.map((profile) => {
      return {
        id: profile.id, fullName: `${profile.firstName} ${profile.lastName}`, paid: profile.paid
      }
    }))
  } catch (err) {
    return res.status(500).send()
  }
})

module.exports = router
