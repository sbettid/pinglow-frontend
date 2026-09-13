import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const API_TARGET = process.env.PINGLOW_URL || 'http://localhost:8000';
const API_KEY = process.env.PINGLOW_API_KEY || 'test123';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicit, self-documenting: where the built static assets live.
// Override with STATIC_DIR if you ever change the container layout.
const staticDir = process.env.STATIC_DIR || path.join(__dirname, 'dist');

app.use('/api', (req, res, next) => {
    req.headers['x-api-key'] = API_KEY;
    next();
});

app.use('/api', createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    onProxyReq(proxyReq, req, res) {
        proxyReq.setHeader('x-api-key', API_KEY);
    }
}));

app.use(express.static(staticDir));

// SPA fallback: any non-API, non-static route serves index.html
// so client-side routing (page refresh on deep links) works.
app.get('*', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});