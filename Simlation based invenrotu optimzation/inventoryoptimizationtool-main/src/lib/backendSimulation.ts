// Backend Simulation Adapter
// Transforms local simulation data to backend format and vice versa

import { railwayClient } from "@/lib/railwayClient";
import type { SimulationInput, SimulationResult } from "./simulationEngine";

/**
 * Transform local simulation input to backend format
 */
function transformToBackendFormat(input: SimulationInput, replications: number) {
  // The backend expects data in this format:
  // tableData: { policy: [...], demand: [...], transport: [...] }
  // Each with matching 'Policy ID' fields
  
  const policyTable: any[] = [];
  const demandTable: any[] = [];
  const transportTable: any[] = [];

  input.inventoryPolicyData.forEach((policy: any, index: number) => {
    const policyId = `${policy["Facility Name"]}_${policy["Product Name"]}_${index}`;
    
    // Get product data
    const product = input.productData.find((p: any) => p["Product Name"] === policy["Product Name"]);
    
    // Get customer orders to calculate demand statistics
    const customerOrders = input.customerOrderData.filter(
      (order: any) => order["Product Name"] === policy["Product Name"]
    );
    
    const demands = customerOrders.map((o: any) => parseFloat(o["Order Quantity"]) || 0);
    const demandMean = demands.length > 0 
      ? demands.reduce((a, b) => a + b, 0) / demands.length 
      : 100;
    const demandStd = demands.length > 1
      ? Math.sqrt(demands.map(x => Math.pow(x - demandMean, 2)).reduce((a, b) => a + b, 0) / (demands.length - 1))
      : demandMean * 0.2;
    
    // Get replenishment data for lead time
    const replenishment = input.replenishmentData.find(
      (r: any) => r["Product Name"] === policy["Product Name"] && r["Facility Name"] === policy["Facility Name"]
    );
    const leadTimeMean = replenishment ? parseFloat(replenishment["Lead Time"]) || 5 : 5;
    const leadTimeStd = leadTimeMean * 0.2;
    
    // Build policy table entry
    policyTable.push({
      'Policy ID': policyId,
      'Facility Name': policy["Facility Name"],
      'Product Name': policy["Product Name"],
      'Policy Type': policy["Simulation Policy"] || "(s,S)",
      'Reorder Point (s)': parseFloat(policy["Simulation Policy Value 1"]) || 0,
      'Order-up-to Level (S)': parseFloat(policy["Simulation Policy Value 2"]) || 0,
      'Service Level Target': 95, // Default 95% service level
      'Ordering Cost ($/order)': 50, // Default ordering cost
      'Holding Cost ($/unit/day)': (product ? parseFloat(product["Unit Value"]) * 0.2 : 2) / 365, // Annual holding cost converted to daily
      'Shortage Cost ($/unit)': product ? parseFloat(product["Unit Value"]) * 0.5 : 10, // Backorder cost
    });
    
    // Build demand table entry
    demandTable.push({
      'Policy ID': policyId,
      'Average Daily Demand (units)': demandMean,
      'Demand Std. Dev.': demandStd,
      'Demand Distribution': 'normal',
    });
    
    // Build transport table entry  
    transportTable.push({
      'Policy ID': policyId,
      'Lead Time (days)': leadTimeMean,
      'Lead Time Std. Dev.': leadTimeStd,
      'Lead Time Distribution': 'normal',
    });
  });

  const tableData = {
    policy: policyTable,
    demand: demandTable,
    transport: transportTable,
  };

  const config = {
    simulationDays: 365,
    numReplications: replications,
    targetServiceLevel: 0.95,
  };

  return { tableData, config };
}

/**
 * Transform backend response to local simulation result format
 */
function transformFromBackendFormat(backendResults: any, input: SimulationInput): SimulationResult[] {
  const results: SimulationResult[] = [];
  
  // The backend returns an array of results, one per policy
  if (backendResults && Array.isArray(backendResults)) {
    backendResults.forEach((result: any, index: number) => {
      // Calculate statistics from replications if available
      const replications = result.replications || [];
      const costs = replications.map((r: any) => r.totalCost);
      const serviceLevels = replications.map((r: any) => r.serviceLevel);
      
      const costMean = costs.length > 0 ? costs.reduce((a: number, b: number) => a + b, 0) / costs.length : result.expectedAnnualCost || 0;
      const costMin = costs.length > 0 ? Math.min(...costs) : costMean * 0.9;
      const costMax = costs.length > 0 ? Math.max(...costs) : costMean * 1.1;
      const costSD = costs.length > 1 ? Math.sqrt(costs.map((x: number) => Math.pow(x - costMean, 2)).reduce((a: number, b: number) => a + b, 0) / costs.length) : costMean * 0.05;
      
      const serviceLevelMean = serviceLevels.length > 0 ? serviceLevels.reduce((a: number, b: number) => a + b, 0) / serviceLevels.length : result.achievedServiceLevel || 0.95;
      const serviceLevelMin = serviceLevels.length > 0 ? Math.min(...serviceLevels) : Math.max(0, serviceLevelMean - 0.05);
      const serviceLevelMax = serviceLevels.length > 0 ? Math.max(...serviceLevels) : Math.min(1, serviceLevelMean + 0.05);
      const serviceLevelSD = serviceLevels.length > 1 ? Math.sqrt(serviceLevels.map((x: number) => Math.pow(x - serviceLevelMean, 2)).reduce((a: number, b: number) => a + b, 0) / serviceLevels.length) : 0.02;
      
      // Extract detailed metrics from replications
      const inventoryLevels = replications.map((r: any) => r.avgInventory || 0);
      const orders = replications.map((r: any) => r.orders || 0);
      
      const avgInventory = inventoryLevels.length > 0 ? inventoryLevels.reduce((a: number, b: number) => a + b, 0) / inventoryLevels.length : 0;
      const avgOrders = orders.length > 0 ? orders.reduce((a: number, b: number) => a + b, 0) / orders.length : 0;
      
      // Calculate cost components
      const holdingCost = result.costs?.holdingCost ? result.costs.holdingCost * avgInventory * 365 : 0;
      const orderCost = result.costs?.orderCost ? result.costs.orderCost * avgOrders : 0;
      
      results.push({
        srNo: index + 1,
        scenarioDescription: `Policy ${result.policyId} - Optimal (s,S): (${result.optimalReorderPoint}, ${result.optimalOrderUpToLevel})`,
        costMin,
        costMax,
        costMean,
        costSD,
        serviceLevelMin,
        serviceLevelMax,
        serviceLevelMean,
        serviceLevelSD,
        eltServiceLevelMin: serviceLevelMin,
        eltServiceLevelMax: serviceLevelMax,
        eltServiceLevelMean: serviceLevelMean,
        eltServiceLevelSD: serviceLevelSD,
        costBreakdown: {
          transportation: 0,
          production: 0,
          handling: holdingCost,
          inventory: holdingCost,
          replenishment: orderCost,
        },
      });
    });
  }
  
  return results;
}

/**
 * Run simulation using backend or fallback to local
 */
export async function runSimulationWithBackend(
  input: SimulationInput,
  replications: number,
  onProgress?: (progress: number) => void,
  useBackend: boolean = true
): Promise<{
  scenarioResults: SimulationResult[];
  orderLogs: any[];
  inventoryData: any[];
  productionLogs: any[];
  productFlowLogs: any[];
  tripLogs: any[];
  usedBackend: boolean;
}> {
  // Check if backend is available
  const backendAvailable = useBackend && railwayClient.isEnabled();
  
  if (backendAvailable) {
    try {
      console.log("🚀 Using Render backend for simulation...");
      onProgress?.(10);
      
      const { tableData, config } = transformToBackendFormat(input, replications);
      console.log("📤 Sending to backend:", { 
        policies: tableData.policy.length,
        config 
      });
      
      onProgress?.(20);
      const backendResults: any = await railwayClient.optimizeInventory(tableData, config);
      
      console.log("📥 Received from backend:", {
        resultsCount: backendResults?.results?.length || backendResults?.length || 0,
        rawResponse: backendResults
      });
      
      onProgress?.(80);
      const scenarioResults = transformFromBackendFormat(backendResults.results || backendResults, input);
      
      console.log("✅ Transformed results:", {
        scenarioCount: scenarioResults.length,
        sample: scenarioResults[0]
      });
      
      // Generate inventory time series data from replications
      const inventoryData: any[] = [];
      if (backendResults.results?.[0]?.replications) {
        const firstReplication = backendResults.results[0].replications[0];
        if (firstReplication?.inventoryLevels) {
          firstReplication.inventoryLevels.forEach((level: number, day: number) => {
            inventoryData.push({
              day,
              inventory: level,
              policyId: backendResults.results[0].policyId,
            });
          });
        }
      }
      
      onProgress?.(100);
      
      return {
        scenarioResults,
        orderLogs: [],
        inventoryData,
        productionLogs: [],
        productFlowLogs: [],
        tripLogs: [],
        usedBackend: true,
      };
    } catch (error) {
      console.error("❌ Backend simulation failed, falling back to local:", error);
      // Fall through to local simulation
    }
  }
  
  // Fallback to local simulation
  console.log("💻 Using local simulation engine...");
  const sim = await import("./simulationEngine");
  
  if (typeof (sim as any).runSimulationWithLogs === "function") {
    const result = await (sim as any).runSimulationWithLogs(input, replications, onProgress);
    return {
      ...result,
      usedBackend: false
    };
  } else {
    const scenarioResults = await sim.runSimulation(input, replications, onProgress);
    return {
      scenarioResults,
      orderLogs: [],
      inventoryData: [],
      productionLogs: [],
      productFlowLogs: [],
      tripLogs: [],
      usedBackend: false
    };
  }
}
