import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { handlePinLoginRequest } from './src/server/authHandler';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'HunarOS Identity & API Core', timestamp: new Date().toISOString() });
  });

  // Secure Server-side Email + PIN Authentication Endpoint
  app.post('/api/auth/pin-login', handlePinLoginRequest);

  // Vite middleware for development / static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HunarOS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
