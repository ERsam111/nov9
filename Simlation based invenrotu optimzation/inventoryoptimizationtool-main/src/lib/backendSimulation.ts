// Backend Simulation Adapter
// Transforms local simulation data to backend format and vice versa

import { railwayClient } from "@/lib/railwayClient";
import type { SimulationInput, SimulationResult } from "./simulationEngine";

/**
 * Transform local simulation input to backend format
 */
function transformToBackendFormat(input: SimulationInput, replications: number) {
  const policyTable: any[] = [];
  const demandTable: any[] = [];
  const transportTable: any[] = [];

  input.inventoryPolicyData.forEach((policy: any, index: number) => {
    const policyId = `${policy["Facility Name"]}_${policy["Product Name"]}_${index}`;
    
    const product = input.productData.find((p: any) => p["Product Name"] === policy["Product Name"]);
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
    
    const replenishment = input.replenishmentData.find(
      (r: any) => r["Product Name"] === policy["Product Name"] && r["Facility Name"] === policy["Facility Name"]
    );
    const leadTimeMean = replenishment ? parseFloat(replenishment["Lead Time"]) || 5 : 5;
    const leadTimeStd = leadTimeMean * 0.2;
    
    policyTable.push({
      'Policy ID': policyId,
      'Facility Name': policy["Facility Name"],
      'Product Name': policy["Product Name"],
      'Policy Type': policy["Simulation Policy"] || "(s,S)",
      'Reorder Point (s)': parseFloat(policy["Simulation Policy Value 1"]) || 0,
      'Order-up-to Level (S)': parseFloat(policy["Simulation Policy Value 2"]) || 0,
      'Service Level Target': 95,
      'Ordering Cost ($/order)': 50,
      'Holding Cost ($/unit/day)': (product ? parseFloat(product["Unit Value"]) * 0.2 : 2) / 365,
      'Shortage Cost ($/unit)': product ? parseFloat(product["Unit Value"]) * 0.5 : 10,
    });
    
    demandTable.push({
      'Policy ID': policyId,
      'Average Daily Demand (units)': demandMean,
      'Demand Std. Dev.': demandStd,
      'Demand Distribution': 'normal',
    });
    
    transportTable.push({
      'Policy ID': policyId,
      'Lead Time (days)': leadTimeMean,
      'Lead Time Std. Dev.': leadTimeStd,
      'Lead Time Distribution': 'normal',
    });
  });

  return { 
    tableData: { policy: policyTable, demand: demandTable, transport: transportTable },
    config: { simulationDays: 365, numReplications: replications, targetServiceLevel: 0.95 }
  };
}

/**
 * Transform backend response to local simulation result format
 */
function transformFromBackendFormat(backendResults: any, input: SimulationInput): {
  results: SimulationResult[];
  inventoryData: any[];
} {
  const results: SimulationResult[] = [];
  const inventoryData: any[] = [];
  
  if (backendResults && Array.isArray(backendResults)) {
    backendResults.forEach((result: any, index: number) => {
      const replications = result.replications || [];
      const costs = replications.map((r: any) => r.totalCost);
      const serviceLevels = replications.map((r: any) => r.serviceLevel);
      
      const costMean = costs.length > 0 ? costs.reduce((a: number, b: number) => a + b, 0) / costs.length : result.expectedAnnualCost || 0;
      const costSD = costs.length > 1 ? Math.sqrt(costs.map((x: number) => Math.pow(x - costMean, 2)).reduce((a: number, b: number) => a + b, 0) / costs.length) : costMean * 0.05;
      
      const serviceLevelMean = serviceLevels.length > 0 ? serviceLevels.reduce((a: number, b: number) => a + b, 0) / serviceLevels.length : result.achievedServiceLevel || 0.95;
      const serviceLevelSD = serviceLevels.length > 1 ? Math.sqrt(serviceLevels.map((x: number) => Math.pow(x - serviceLevelMean, 2)).reduce((a: number, b: number) => a + b, 0) / serviceLevels.length) : 0.02;
      
      const inventoryLevels = replications.map((r: any) => r.avgInventory || 0);
      const orders = replications.map((r: any) => r.orders || 0);
      
      const avgInventory = inventoryLevels.length > 0 ? inventoryLevels.reduce((a: number, b: number) => a + b, 0) / inventoryLevels.length : 0;
      const avgOrders = orders.length > 0 ? orders.reduce((a: number, b: number) => a + b, 0) / orders.length : 0;
      
      const holdingCostPerUnit = result.holdingCost || 0;
      const orderCostPerOrder = result.orderingCost || 0;
      const totalHoldingCost = avgInventory * holdingCostPerUnit * 365;
      const totalOrderCost = avgOrders * orderCostPerOrder;
      
      const simResult: SimulationResult = {
        scenarioDescription: result.policyId || `Scenario ${index + 1}`,
        avgPolicyPerformance: {
          expectedAnnualCost: costMean,
          expectedServiceLevel: serviceLevelMean * 100,
          avgInventoryLevel: avgInventory,
          avgOrders: avgOrders,
          costStdDev: costSD,
          serviceLevelStdDev: serviceLevelSD * 100,
        },
        costBreakdown: {
          transportation: result.transportCost || 0,
          production: result.productionCost || 0,
          handling: result.handlingCost || 0,
          inventory: totalHoldingCost,
          replenishment: totalOrderCost,
        },
        replicationResults: replications.map((rep: any, repIdx: number) => ({
          replicationNumber: repIdx + 1,
          totalCost: rep.totalCost || 0,
          serviceLevel: rep.serviceLevel * 100 || 0,
          avgInventory: rep.avgInventory || 0,
          orders: rep.orders || 0,
          stockouts: rep.stockouts || 0,
        })),
        serviceMetrics: {
          avgFillRate: serviceLevelMean * 100,
          avgBackorders: 0,
          avgStockouts: replications.reduce((sum: number, r: any) => sum + (r.stockouts || 0), 0) / Math.max(replications.length, 1),
          fillRateStdDev: serviceLevelSD * 100,
        },
      };
      
      results.push(simResult);
      
      replications.forEach((rep: any, repIndex: number) => {
        if (rep.inventoryTimeSeries) {
          rep.inventoryTimeSeries.forEach((point: any) => {
            inventoryData.push({
              timeStep: point.time || point.day || 0,
              site: result.facilityName || result.policyId || `Policy ${index}`,
              product: result.productName || result.policyId || `Product ${index}`,
              inventoryLevel: point.inventory || point.level || 0,
              replicationNumber: repIndex + 1,
              scenarioDescription: result.policyId || `Scenario ${index + 1}`
            });
          });
        }
      });
    });
  }

  return { results, inventoryData };
}

/**
 * Run inventory optimization using backend or fallback to local
 */
export async function runSimulationWithBackend(
  input: SimulationInput,
  replications: number,
  progressCallback: (progress: number) => void,
  useBackend: boolean = false
): Promise<{
  scenarioResults: SimulationResult[];
  orderLogs: any[];
  inventoryData: any[];
  productionLogs: any[];
  productFlowLogs: any[];
  tripLogs: any[];
  usedBackend: boolean;
}> {
  const backendAvailable = useBackend && railwayClient.isEnabled();
  
  if (backendAvailable) {
    try {
      console.log("🚀 Using Render backend for inventory optimization...");
      
      const { tableData, config } = transformToBackendFormat(input, replications);
      
      console.log("📤 Sending inventory data to backend:", {
        policies: tableData.policy.length,
        replications: config.numReplications,
      });
      
      const backendResults = await railwayClient.optimizeInventory(tableData, config);
      
      console.log("📥 Received backend results:", backendResults);
      
      const { results: scenarioResults, inventoryData } = transformFromBackendFormat(backendResults, input);
      
      console.log("✅ Backend simulation completed:", {
        scenarios: scenarioResults.length,
        inventoryPoints: inventoryData.length,
      });
      
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
    }
  }
  
  console.log("💻 Using local simulation...");
  const { runSimulationWithLogs } = await import("./simulationEngine");
  const { scenarioResults, orderLogs, inventoryData } = 
    await runSimulationWithLogs(input, replications, progressCallback);
  
  return {
    scenarioResults,
    orderLogs,
    inventoryData,
    productionLogs: [],
    productFlowLogs: [],
    tripLogs: [],
    usedBackend: false,
  };
}
