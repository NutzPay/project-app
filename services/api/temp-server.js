const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
  res.json({
    message: 'NutzBeta API - Temporary Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Mock auth endpoint
app.post('/api/auth/login', (req, res) => {
  res.json({
    access_token: 'mock_token',
    user: {
      id: '1',
      email: req.body.email || 'user@example.com',
      name: 'Test User',
      role: 'USER'
    }
  });
});

// Mock user endpoint
app.get('/api/users/me', (req, res) => {
  res.json({
    id: '1',
    email: 'user@example.com',
    name: 'Test User',
    role: 'USER'
  });
});

// Mock transactions endpoint
app.get('/api/transactions', (req, res) => {
  res.json([
    {
      id: '1',
      amount: 100.50,
      type: 'BUY',
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    }
  ]);
});

// Mock PIX endpoints
app.get('/api/pix/transactions', (req, res) => {
  res.json([
    {
      id: '1',
      amount: 250.00,
      type: 'PIX_IN',
      status: 'COMPLETED',
      description: 'Recebimento PIX',
      pixKey: 'user@example.com',
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '2',
      amount: 150.75,
      type: 'PIX_OUT',
      status: 'PENDING',
      description: 'Envio PIX',
      pixKey: '11999999999',
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ]);
});

app.post('/api/pix/create', (req, res) => {
  const { amount, pixKey, description } = req.body;
  res.json({
    id: Date.now().toString(),
    amount: amount || 100,
    pixKey: pixKey || 'default@example.com',
    description: description || 'Nova transação PIX',
    status: 'PENDING',
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    createdAt: new Date().toISOString()
  });
});

app.get('/api/pix/balance', (req, res) => {
  res.json({
    available: 1250.75,
    pending: 150.00,
    total: 1400.75,
    currency: 'BRL'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Temporary API server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  / - Health check`);
  console.log(`   POST /api/auth/login - Mock login`);
  console.log(`   GET  /api/users/me - Mock user`);
  console.log(`   GET  /api/transactions - Mock transactions`);
  console.log(`   GET  /api/pix/transactions - Mock PIX transactions`);
  console.log(`   POST /api/pix/create - Create PIX transaction`);
  console.log(`   GET  /api/pix/balance - PIX balance`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping temporary API server...');
  process.exit(0);
});