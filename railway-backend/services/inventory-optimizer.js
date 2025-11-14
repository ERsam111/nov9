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

export async function optimizeInventory(requestData) {
  const { tableData, config } = requestData;
  const results = [];

  for (const policy of tableData.policy) {
    console.log(`Optimizing policy: ${policy['Policy ID']}`);

    const demandRow = tableData.demand.find(d => d['Policy ID'] === policy['Policy ID']);
    const transportRow = tableData.transport.find(t => t['Policy ID'] === policy['Policy ID']);

    if (!demandRow || !transportRow) {
      console.warn(`Missing data for policy ${policy['Policy ID']}`);
      continue;
    }

    const demandParams = {
      mean: demandRow['Average Daily Demand (units)'],
      std: demandRow['Demand Std. Dev.'],
      distribution: demandRow['Demand Distribution']
    };

    const leadTimeParams = {
      mean: transportRow['Lead Time (days)'],
      std: transportRow['Lead Time Std. Dev.'],
      distribution: transportRow['Lead Time Distribution']
    };

    const costs = {
      ordering: policy['Ordering Cost ($/order)'],
      holding: policy['Holding Cost ($/unit/day)'],
      shortage: policy['Shortage Cost ($/unit)']
    };

    const safetyStock = calculateSafetyStock(
      demandParams.mean,
      demandParams.std,
      leadTimeParams.mean,
      leadTimeParams.std,
      policy['Service Level Target'] / 100
    );

    const reorderPoint = demandParams.mean * leadTimeParams.mean + safetyStock;
    const eoq = Math.sqrt((2 * demandParams.mean * 365 * costs.ordering) / costs.holding);
    const initialS = reorderPoint + eoq;

    const objectiveFn = (params) => {
      const [s, S] = params;
      if (S <= s) return Infinity;

      const sims = runSimulation(
        s, S, demandParams, leadTimeParams, costs,
        config.simulationDays || 365,
        5
      );

      return sims.reduce((sum, sim) => sum + sim.totalCost, 0) / sims.length;
    };

    const bounds = [
      [0, reorderPoint * 1.5],
      [reorderPoint, initialS * 1.5]
    ];

    const optimizer = new DifferentialEvolution(bounds, 30, 50);
    const optimized = optimizer.optimize(objectiveFn);

    const [optimalS, optimalS_upper] = optimized.solution;
    const finalSimulations = runSimulation(
      optimalS, optimalS_upper, demandParams, leadTimeParams, costs,
      config.simulationDays || 365,
      config.numReplications || 100
    );

    const avgCost = finalSimulations.reduce((sum, sim) => sum + sim.totalCost, 0) / finalSimulations.length;
    const avgServiceLevel = finalSimulations.reduce((sum, sim) => sum + sim.serviceLevel, 0) / finalSimulations.length;

    results.push({
      policyId: policy['Policy ID'],
      optimalReorderPoint: Math.round(optimalS),
      optimalOrderUpToLevel: Math.round(optimalS_upper),
      safetyStock: Math.round(safetyStock),
      expectedAnnualCost: avgCost,
      achievedServiceLevel: avgServiceLevel,
      replications: finalSimulations,
      demandParams,
      leadTimeParams,
      costs
    });
  }

  return { results };
}
