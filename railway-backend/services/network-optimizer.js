// Simplex Solver for Linear Programming
class SimplexSolver {
  solve(problem) {
    const { c, A, b, bounds } = problem;
    const m = A.length;
    const n = c.length;

    // Create tableau
    const tableau = [];
    for (let i = 0; i < m; i++) {
      tableau.push([...A[i], ...Array(m).fill(0), b[i]]);
      tableau[i][n + i] = 1;
    }
    tableau.push([...c.map(x => -x), ...Array(m).fill(0), 0]);

    // Simplex iterations
    let iterations = 0;
    const maxIterations = 1000;

    while (iterations < maxIterations) {
      const lastRow = tableau[m];
      let pivotCol = -1;
      let minVal = 0;

      for (let j = 0; j < n + m; j++) {
        if (lastRow[j] < minVal) {
          minVal = lastRow[j];
          pivotCol = j;
        }
      }

      if (pivotCol === -1) break;

      let pivotRow = -1;
      let minRatio = Infinity;

      for (let i = 0; i < m; i++) {
        if (tableau[i][pivotCol] > 1e-10) {
          const ratio = tableau[i][n + m] / tableau[i][pivotCol];
          if (ratio < minRatio) {
            minRatio = ratio;
            pivotRow = i;
          }
        }
      }

      if (pivotRow === -1) break;

      const pivotVal = tableau[pivotRow][pivotCol];
      for (let j = 0; j <= n + m; j++) {
        tableau[pivotRow][j] /= pivotVal;
      }

      for (let i = 0; i <= m; i++) {
        if (i !== pivotRow) {
          const factor = tableau[i][pivotCol];
          for (let j = 0; j <= n + m; j++) {
            tableau[i][j] -= factor * tableau[pivotRow][j];
          }
        }
      }

      iterations++;
    }

    const solution = Array(n).fill(0);
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (Math.abs(tableau[i][j] - 1) < 1e-6) {
          let isBasic = true;
          for (let k = 0; k < m; k++) {
            if (k !== i && Math.abs(tableau[k][j]) > 1e-6) {
              isBasic = false;
              break;
            }
          }
          if (isBasic) {
            solution[j] = tableau[i][n + m];
          }
        }
      }
    }

    return {
      solution,
      objectiveValue: tableau[m][n + m],
      iterations
    };
  }
}

function buildNetworkOptimization(data, settings) {
  const { suppliers, facilities, customers, products, distances, costs } = data;
  const { objectiveType } = settings;

  const variables = [];
  const varMap = new Map();
  let varIndex = 0;

  // Create flow variables
  for (const product of products) {
    for (const supplier of suppliers) {
      for (const facility of facilities) {
        const varName = `flow_${product.id}_${supplier.id}_${facility.id}`;
        varMap.set(varName, varIndex++);
        variables.push({ name: varName, type: 'flow' });
      }
    }

    for (const facility of facilities) {
      for (const customer of customers) {
        const varName = `flow_${product.id}_${facility.id}_${customer.id}`;
        varMap.set(varName, varIndex++);
        variables.push({ name: varName, type: 'flow' });
      }
    }
  }

  // Build objective function
  const c = Array(variables.length).fill(0);
  
  for (const product of products) {
    for (const supplier of suppliers) {
      for (const facility of facilities) {
        const idx = varMap.get(`flow_${product.id}_${supplier.id}_${facility.id}`);
        const distance = distances.find(d => 
          d.from === supplier.id && d.to === facility.id
        )?.distance || 100;
        
        if (objectiveType === 'cost') {
          c[idx] = costs.transportation * distance;
        } else if (objectiveType === 'time') {
          c[idx] = distance / 60; // Assuming 60 km/h
        }
      }
    }

    for (const facility of facilities) {
      for (const customer of customers) {
        const idx = varMap.get(`flow_${product.id}_${facility.id}_${customer.id}`);
        const distance = distances.find(d => 
          d.from === facility.id && d.to === customer.id
        )?.distance || 50;
        
        if (objectiveType === 'cost') {
          c[idx] = costs.transportation * distance;
        } else if (objectiveType === 'time') {
          c[idx] = distance / 60;
        }
      }
    }
  }

  // Build constraints
  const A = [];
  const b = [];

  // Demand constraints
  for (const product of products) {
    for (const customer of customers) {
      const row = Array(variables.length).fill(0);
      for (const facility of facilities) {
        const idx = varMap.get(`flow_${product.id}_${facility.id}_${customer.id}`);
        row[idx] = 1;
      }
      A.push(row);
      b.push(customer.demand?.[product.id] || 100);
    }
  }

  // Capacity constraints
  for (const product of products) {
    for (const facility of facilities) {
      const row = Array(variables.length).fill(0);
      for (const customer of customers) {
        const idx = varMap.get(`flow_${product.id}_${facility.id}_${customer.id}`);
        row[idx] = 1;
      }
      A.push(row);
      b.push(facility.capacity?.[product.id] || 1000);
    }
  }

  return {
    problem: { c, A, b, bounds: variables.map(() => [0, Infinity]) },
    varMap,
    variables
  };
}

export async function optimizeNetwork(requestData) {
  const { data, settings } = requestData;
  
  console.log('Building optimization model...');
  const { problem, varMap, variables } = buildNetworkOptimization(data, settings);
  
  console.log('Solving optimization problem...');
  const solver = new SimplexSolver();
  const result = solver.solve(problem);

  // Extract results
  const flows = [];
  for (const [varName, idx] of varMap.entries()) {
    if (result.solution[idx] > 0.01) {
      const parts = varName.split('_');
      flows.push({
        product: parts[1],
        from: parts[2],
        to: parts[3],
        quantity: Math.round(result.solution[idx])
      });
    }
  }

  return {
    flows,
    objectiveValue: result.objectiveValue,
    iterations: result.iterations,
    status: 'optimal'
  };
}
