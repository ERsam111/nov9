// Differential Evolution Optimizer
class DifferentialEvolution {
  constructor(bounds, populationSize = 50, maxIterations = 100, F = 0.8, CR = 0.9) {
    this.bounds = bounds;
    this.populationSize = populationSize;
    this.maxIterations = maxIterations;
    this.F = F;
    this.CR = CR;
    this.dimensions = bounds.length;
  }

  optimize(objectiveFn) {
    let population = this.initializePopulation();
    let fitness = population.map(ind => objectiveFn(ind));
    let bestIdx = fitness.indexOf(Math.min(...fitness));
    let best = { solution: population[bestIdx], fitness: fitness[bestIdx] };

    for (let iter = 0; iter < this.maxIterations; iter++) {
      for (let i = 0; i < this.populationSize; i++) {
        const indices = this.selectDistinctIndices(i);
        const mutant = this.mutate(population, indices);
        const trial = this.crossover(population[i], mutant);
        const trialFitness = objectiveFn(trial);

        if (trialFitness < fitness[i]) {
          population[i] = trial;
          fitness[i] = trialFitness;
          if (trialFitness < best.fitness) {
            best = { solution: trial, fitness: trialFitness };
          }
        }
      }
    }

    return best;
  }

  initializePopulation() {
    const population = [];
    for (let i = 0; i < this.populationSize; i++) {
      const individual = this.bounds.map(([min, max]) => 
        min + Math.random() * (max - min)
      );
      population.push(individual);
    }
    return population;
  }

  selectDistinctIndices(currentIdx) {
    const indices = [];
    while (indices.length < 3) {
      const idx = Math.floor(Math.random() * this.populationSize);
      if (idx !== currentIdx && !indices.includes(idx)) {
        indices.push(idx);
      }
    }
    return indices;
  }

  mutate(population, [a, b, c]) {
    return population[a].map((val, i) => {
      const mutated = val + this.F * (population[b][i] - population[c][i]);
      return Math.max(this.bounds[i][0], Math.min(this.bounds[i][1], mutated));
    });
  }

  crossover(target, mutant) {
    const trial = [];
    const jRand = Math.floor(Math.random() * this.dimensions);
    for (let j = 0; j < this.dimensions; j++) {
      trial.push(Math.random() < this.CR || j === jRand ? mutant[j] : target[j]);
    }
    return trial;
  }
}

// Statistical functions
function normalCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

function normalPPF(p) {
  if (p <= 0 || p >= 1) throw new Error("p must be between 0 and 1");
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
              1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
              6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
             3.754408661907416e+00];

  const q = p < 0.5 ? p : 1 - p;
  let num = 0, den = 1;

  if (q > 0.02425) {
    const r = q - 0.5;
    const r2 = r * r;
    for (let i = 0; i < 6; i++) num += a[i] * Math.pow(r2, i);
    for (let i = 0; i < 5; i++) den += b[i] * Math.pow(r2, i + 1);
    return (p < 0.5 ? -1 : 1) * (num / den) * r;
  } else {
    const r = Math.sqrt(-Math.log(q));
    for (let i = 0; i < 6; i++) num += c[i] * Math.pow(r, i);
    for (let i = 0; i < 4; i++) den += d[i] * Math.pow(r, i + 1);
    return (p < 0.5 ? -1 : 1) * (num / den);
  }
}

function calculateSafetyStock(demandMean, demandStd, leadTimeMean, leadTimeStd, serviceLevel) {
  const Z = normalPPF(serviceLevel);
  const demandVariance = demandStd * demandStd;
  const leadTimeVariance = leadTimeStd * leadTimeStd;
  const safetyStockVariance = 
    (leadTimeMean * demandVariance) + (demandMean * demandMean * leadTimeVariance);
  return Z * Math.sqrt(safetyStockVariance);
}

// Random number generators
function generateDemand(mean, std, distribution) {
  switch (distribution) {
    case 'normal': {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      return Math.max(0, mean + z * std);
    }
    case 'triangular': {
      const mode = mean;
      const min = Math.max(0, mean - std * Math.sqrt(6));
      const max = mean + std * Math.sqrt(6);
      const u = Math.random();
      const F = (mode - min) / (max - min);
      if (u < F) {
        return min + Math.sqrt(u * (max - min) * (mode - min));
      } else {
        return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
      }
    }
    case 'uniform': {
      const halfRange = std * Math.sqrt(3);
      return Math.max(0, mean - halfRange + Math.random() * 2 * halfRange);
    }
    case 'poisson': {
      let L = Math.exp(-mean);
      let k = 0;
      let p = 1;
      do {
        k++;
        p *= Math.random();
      } while (p > L);
      return k - 1;
    }
    default:
      return mean;
  }
}

// Simulation function
function runSimulation(s, S, demandParams, leadTimeParams, costs, numDays, numReplications) {
  const replications = [];

  for (let rep = 0; rep < numReplications; rep++) {
    let inventory = S;
    let totalOrderingCost = 0;
    let totalHoldingCost = 0;
    let totalShortageCost = 0;
    let numOrders = 0;
    let daysOutOfStock = 0;
    const inventoryLevels = [inventory];
    const dailyCosts = [];

    for (let day = 0; day < numDays; day++) {
      const demand = generateDemand(demandParams.mean, demandParams.std, demandParams.distribution);
      
      if (inventory <= s) {
        const orderQty = S - inventory;
        totalOrderingCost += costs.ordering;
        numOrders++;
        
        const leadTime = Math.max(1, Math.round(
          generateDemand(leadTimeParams.mean, leadTimeParams.std, leadTimeParams.distribution)
        ));
        
        if (day + leadTime < numDays) {
          inventory += orderQty;
        }
      }

      if (inventory >= demand) {
        inventory -= demand;
        totalHoldingCost += inventory * costs.holding;
      } else {
        const shortage = demand - inventory;
        totalShortageCost += shortage * costs.shortage;
        inventory = 0;
        daysOutOfStock++;
      }

      inventoryLevels.push(inventory);
      dailyCosts.push({
        ordering: day === 0 ? totalOrderingCost : 0,
        holding: inventory * costs.holding,
        shortage: inventory === 0 ? (demand - inventory) * costs.shortage : 0
      });
    }

    const totalCost = totalOrderingCost + totalHoldingCost + totalShortageCost;
    const avgInventory = inventoryLevels.reduce((a, b) => a + b, 0) / inventoryLevels.length;
    const serviceLevel = ((numDays - daysOutOfStock) / numDays) * 100;

    replications.push({
      totalCost,
      orderingCost: totalOrderingCost,
      holdingCost: totalHoldingCost,
      shortageCost: totalShortageCost,
      numOrders,
      avgInventory,
      serviceLevel,
      inventoryLevels,
      dailyCosts
    });
  }

  return replications;
}

// Main optimization function - EXACT MATCH TO LOCAL SIMULATION
export async function optimizeInventory(requestData) {
  const { tableData, config } = requestData;
  
  console.log('Starting inventory optimization...');
  console.log('Received tableData keys:', Object.keys(tableData));
  console.log('Number of policies:', tableData.policy?.length);
  const startTime = Date.now();
  
  // Accept both formats: inventoryPolicyData (old) and policy (new)
  const policyTable = tableData.policy || tableData.inventoryPolicyData || [];
  const demandTable = tableData.demand || [];
  const transportTable = tableData.transport || [];
  
  console.log(`Processing ${policyTable.length} policies`);
  const optimizedResults = [];
  
  for (let i = 0; i < policyTable.length; i++) {
    const policyRow = policyTable[i];
    const demandRow = demandTable[i] || {};
    const transportRow = transportTable[i] || {};
    
    const policyId = policyRow['Policy ID'] || `Policy_${i}`;
    console.log(`Optimizing policy: ${policyId}`);
    
    const demandParams = {
      mean: parseFloat(demandRow['Average Daily Demand (units)']) || 100,
      std: parseFloat(demandRow['Demand Std. Dev.']) || 20,
      distribution: demandRow['Demand Distribution'] || 'normal'
    };
    
    const leadTimeParams = {
      mean: parseFloat(transportRow['Lead Time (days)']) || 5,
      std: parseFloat(transportRow['Lead Time Std. Dev.']) || 1,
      distribution: transportRow['Lead Time Distribution'] || 'normal'
    };
    
    const costs = {
      holdingCost: parseFloat(policyRow['Holding Cost ($/unit/day)']) || 1,
      orderingCost: parseFloat(policyRow['Ordering Cost ($/order)']) || 100,
      shortageCost: parseFloat(policyRow['Shortage Cost ($/unit)']) || 10
    };
    
    const serviceLevel = parseFloat(policyRow['Service Level Target']) || 95;
    
    // Calculate initial safety stock and reorder point
    const zScore = normalPPF(serviceLevel / 100);
    const leadTimeDemand = demandParams.mean * leadTimeParams.mean;
    const leadTimeDemandStd = Math.sqrt(
      (leadTimeParams.mean * Math.pow(demandParams.std, 2)) +
      (Math.pow(demandParams.mean, 2) * Math.pow(leadTimeParams.std, 2))
    );
    const safetyStock = zScore * leadTimeDemandStd;
    const reorderPoint = leadTimeDemand + safetyStock;
    
    // EOQ calculation
    const annualDemand = demandParams.mean * 365;
    const eoq = Math.sqrt((2 * annualDemand * costs.orderingCost) / costs.holdingCost);
    const orderUpToLevel = reorderPoint + eoq;
    
    // Optimize using DE
    const bounds = [
      [leadTimeDemand * 0.5, leadTimeDemand * 2],
      [reorderPoint + eoq * 0.5, reorderPoint + eoq * 2]
    ];
    
    const de = new DifferentialEvolution(bounds, 20, 50);
    
    const objectiveFn = ([s, S]) => {
      const results = runSimulation(
        s, S, demandParams, leadTimeParams, costs,
        365, 10
      );
      
      const avgCost = results.reduce((sum, r) => sum + r.totalCost, 0) / results.length;
      const avgServiceLevel = results.reduce((sum, r) => sum + r.serviceLevel, 0) / results.length;
      
      // Penalty if service level not met
      const penalty = avgServiceLevel < serviceLevel ? 100000 : 0;
      return avgCost + penalty;
    };
    
    const optimizationResult = de.optimize(objectiveFn);
    const [optimizedS, optimizedS_val] = optimizationResult.solution;
    
    console.log(`Optimized s=${optimizedS}, S=${optimizedS_val}`);
    
    // Run final simulation with optimized values
    const finalResults = runSimulation(
      optimizedS,
      optimizedS_val,
      demandParams,
      leadTimeParams,
      costs,
      365,
      100
    );
    
    const avgCost = finalResults.reduce((sum, r) => sum + r.totalCost, 0) / finalResults.length;
    const avgServiceLevel = finalResults.reduce((sum, r) => sum + r.serviceLevel, 0) / finalResults.length;
    const avgInventory = finalResults.reduce((sum, r) => sum + r.avgInventory, 0) / finalResults.length;
    const totalOrders = finalResults.reduce((sum, r) => sum + r.numOrders, 0) / finalResults.length;
    
    optimizedResults.push({
      policyId: policyId,
      policyName: policyRow['Facility Name'] + ' - ' + policyRow['Product Name'],
      policyIndex: i,
      reorderPoint: Math.round(optimizedS),
      orderUpToLevel: Math.round(optimizedS_val),
      expectedCost: Math.round(avgCost),
      expectedServiceLevel: Math.round(avgServiceLevel * 10) / 10,
      avgInventory: Math.round(avgInventory),
      avgOrders: Math.round(totalOrders),
      holdingCost: Math.round(avgInventory * costs.holdingCost),
      orderCost: Math.round(totalOrders * costs.orderingCost),
      replications: finalResults
    });
  }
  
  const endTime = Date.now();
  console.log(`Inventory optimization completed in ${endTime - startTime}ms`);
  
  return {
    success: true,
    optimizedPolicies: optimizedResults,
    executionTime: endTime - startTime
  };
}
