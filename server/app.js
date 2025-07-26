import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const API_TARGET = process.env.PINGLOW_URL || 'http://localhost:8000';
const API_KEY = process.env.PINGLOW_API_KEY || 'test123';

const __filename = fileURLToPath(import.meta.url);
const __dirname = process.env.VUE_APP_PATH || path.dirname(__filename);

app.use('/api', (req, res, next) => {
    req.headers['x-api-key'] = API_KEY;
    next();
});

// Proxy middleware for /api requests
app.use('/api', createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    onProxyReq(proxyReq, req, res) {
        proxyReq.setHeader('x-api-key', API_KEY);
    }

}));

// Serve Vue frontend static files from 'dist' folder (build output)
app.use(express.static(path.join(__dirname, 'dist')));

// Start server
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
