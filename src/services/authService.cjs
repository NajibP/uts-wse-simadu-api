'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config.cjs');
const userRepository = require('../repositories/userRepository.cjs');
const { AppError } = require('../errors.cjs');

async function login(username, password) {
  const user = userRepository.findByUsername(username);

  // Selalu jalankan compare agar waktu respons tidak membocorkan "username ada/tidak".
  const hash = user ? user.passwordHash : userRepository.DUMMY_HASH;
  const passwordCocok = await bcrypt.compare(password, hash);

  if (!user || !passwordCocok) {
    // Pesan sengaja sama untuk username salah maupun password salah.
    throw new AppError(401, 'Username atau password salah');
  }

  // Token berisi identitas dan role pengguna; tiap pengguna mendapat token berbeda
  // dan setiap token punya masa berlaku (exp).
  const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn,
  });

  const { exp } = jwt.decode(token);

  return {
    token,
    tokenType: 'Bearer',
    expiresAt: new Date(exp * 1000).toISOString(),
    user: { id: user.id, username: user.username, nama: user.nama, role: user.role },
  };
}

module.exports = { login };
