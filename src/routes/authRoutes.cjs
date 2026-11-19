'use strict';

const express = require('express');
const authController = require('../controllers/authController.cjs');
const { validateLogin } = require('../middleware/validate.cjs');

const router = express.Router();

// POST /api/auth/login
router.post('/login', validateLogin, authController.login);

module.exports = router;
