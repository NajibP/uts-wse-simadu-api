'use strict';

// Log permintaan minimal: method, path, status, durasi.
// Sengaja TIDAK mencatat header Authorization, body, maupun token.
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${ms}ms`);
  });
  next();
}

module.exports = { requestLogger };
