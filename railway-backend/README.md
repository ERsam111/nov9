# Supply Chain Optimization Service - Railway Backend

High-performance optimization service designed to run on Railway.app with 32GB RAM and multiple CPUs.

## Features

- **Inventory Optimization**: Differential Evolution algorithm for (s, S) policy optimization
- **Network Optimization**: Simplex-based linear programming for supply chain network optimization
- **High Performance**: Designed for 32GB RAM and multi-CPU environments
- **REST API**: Simple endpoints for integration with frontend

## Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and set your values

# Run locally
npm run dev
```

## API Endpoints

### Health Check
```
GET /health
Response: { status: 'healthy', timestamp: '...', memory: {...} }
```

### Inventory Optimization
```
POST /api/optimize-inventory
Body: {
  tableData: { demand: [...], transport: [...], policy: [...] },
  config: { simulationDays: 365, numReplications: 100 }
}
Response: {
  results: [{ policyId, optimalReorderPoint, optimalOrderUpToLevel, ... }]
}
```

### Network Optimization
```
POST /api/optimize-network
Body: {
  data: { suppliers: [...], facilities: [...], customers: [...], ... },
  settings: { objectiveType: 'cost' }
}
Response: {
  flows: [...], objectiveValue, iterations, status
}
```

### GFA Optimization
```
POST /api/optimize-gfa
Body: {
  data: { customers: [...], facilities: [...], products: [...] },
  settings: { transportCostPerKm: 0.5, fixedCostPerFacility: 10000 }
}
Response: {
  allocation: [...], kpis: {...}, summary: {...}
}
```

### Demand Forecasting
```
POST /api/forecast-demand
Body: {
  historicalData: [{ period, date, value }, ...],
  settings: { preferredModel: 'linear', forecastPeriods: 12 }
}
Response: {
  modelComparison: {...}, bestModel, futureForecast: [...], summary: {...}
}
```

## Deployment

See [RAILWAY_DEPLOYMENT_GUIDE.md](../RAILWAY_DEPLOYMENT_GUIDE.md) for complete deployment instructions.

## Performance

Optimized for:
- 32GB RAM allocation
- Multi-CPU parallel processing
- Large dataset handling
- Long-running computations

## Architecture

```
Frontend (Lovable Cloud) 
    ↓ HTTP Request
Railway Service (32GB RAM)
    ↓ Optimized Result
Frontend (Lovable Cloud)
    ↓ Save to DB
Database (Lovable Cloud)
```

## Monitoring

Check Railway logs for:
- Computation time
- Memory usage
- Error tracking
- Request volumes
