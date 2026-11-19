'use strict';

const authService = require('../services/authService.cjs');

async function login(req, res) {
  const { username, password } = req.body;
  const result = await authService.login(username, password);
  res.status(200).json({ success: true, message: 'Login berhasil', data: result });
}

module.exports = { login };
