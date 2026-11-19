'use strict';

const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const swaggerUi = require('swagger-ui-express');

const authRoutes = require('./src/routes/authRoutes.cjs');
const pengaduanRoutes = require('./src/routes/pengaduanRoutes.cjs');
const { requestLogger } = require('./src/middleware/requestLogger.cjs');
const { notFound, errorHandler } = require('./src/middleware/errorHandler.cjs');

const openapiPath = path.join(__dirname, 'docs', 'openapi.json');
const openapiDocument = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));

const app = express();

app.disable('x-powered-by');
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}
app.use(express.json({ limit: '10kb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'SIMADU API berjalan', data: null });
});

// Dokumentasi: Swagger UI di /docs, berkas mentah di /docs/openapi.json
app.get('/docs/openapi.json', (req, res) => res.json(openapiDocument));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument, { customSiteTitle: 'SIMADU API Docs' }));

app.use('/api/auth', authRoutes);
app.use('/api/pengaduan', pengaduanRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
