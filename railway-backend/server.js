import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { optimizeInventory } from './services/inventory-optimizer.js';
import { optimizeNetwork } from './services/network-optimizer.js';
import { optimizeGFA } from './services/gfa-optimizer.js';
import { forecastDemand } from './services/forecasting.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage()
  });
});

// Inventory optimization endpoint
app.post('/api/optimize-inventory', async (req, res) => {
  try {
    console.log('Starting inventory optimization...');
    const startTime = Date.now();
    
    const result = await optimizeInventory(req.body);
    
    const duration = Date.now() - startTime;
    console.log(`Inventory optimization completed in ${duration}ms`);
    
    res.json(result);
  } catch (error) {
    console.error('Inventory optimization error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Network optimization endpoint
app.post('/api/optimize-network', async (req, res) => {
  try {
    console.log('Starting network optimization...');
    const startTime = Date.now();
    
    const result = await optimizeNetwork(req.body);
    
    const duration = Date.now() - startTime;
    console.log(`Network optimization completed in ${duration}ms`);
    
    res.json(result);
  } catch (error) {
    console.error('Network optimization error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GFA optimization endpoint
app.post('/api/optimize-gfa', async (req, res) => {
  try {
    console.log('Starting GFA optimization...');
    const startTime = Date.now();
    
    const result = await optimizeGFA(req.body);
    
    const duration = Date.now() - startTime;
    console.log(`GFA optimization completed in ${duration}ms`);
    
    res.json(result);
  } catch (error) {
    console.error('GFA optimization error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Demand forecasting endpoint
app.post('/api/forecast-demand', async (req, res) => {
  try {
    console.log('Starting demand forecasting...');
    const startTime = Date.now();
    
    const result = await forecastDemand(req.body);
    
    const duration = Date.now() - startTime;
    console.log(`Demand forecasting completed in ${duration}ms`);
    
    res.json(result);
  } catch (error) {
    console.error('Demand forecasting error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Optimization service running on port ${PORT}`);
  console.log(`Memory limit: ${process.env.NODE_OPTIONS || 'default'}`);
  console.log('Available endpoints:');
  console.log('  POST /api/optimize-inventory');
  console.log('  POST /api/optimize-network');
  console.log('  POST /api/optimize-gfa');
  console.log('  POST /api/forecast-demand');
});
