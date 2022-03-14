const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('./model')
const contractRoutes = require('./api/contracts');
const jobsRoutes = require('./api/jobs');
const balanceRoutes = require('./api/balances');

const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

app.use(contractRoutes);
app.use(jobsRoutes);
app.use(balanceRoutes);

module.exports = app;
