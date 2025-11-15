// Backend Simulation Adapter
// Transforms local simulation data to backend format and vice versa

import { railwayClient } from "@/lib/railwayClient";
import type { SimulationInput, SimulationResult } from "./simulationEngine";

/**
 * Transform local simulation input to backend format
 */
function transformToBackendFormat(input: SimulationInput, replications: number) {
  // Extract product and inventory data from the input tables
  const tableData = input.inventoryPolicyData.map((policy: any) => {
    const product = input.productData.find((p: any) => p["Product Name"] === policy["Product Name"]);
    const facility = input.facilityData.find((f: any) => f["Facility Name"] === policy["Facility Name"]);
    
    // Get demand statistics from customer order data
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
    
    // Get lead time from replenishment data
    const replenishment = input.replenishmentData.find(
      (r: any) => r["Product Name"] === policy["Product Name"] && r["Facility Name"] === policy["Facility Name"]
    );
    const leadTimeMean = replenishment ? parseFloat(replenishment["Lead Time"]) || 5 : 5;
    const leadTimeStd = leadTimeMean * 0.2; // 20% variation
    
    return {
      product: policy["Product Name"],
      facility: policy["Facility Name"],
      demandMean,
      demandStd,
      demandDist: "normal",
      leadTimeMean,
      leadTimeStd,
      leadTimeDist: "normal",
      holdingCost: product ? parseFloat(product["Unit Value"]) * 0.2 : 2, // 20% of product value per year
      orderCost: 50, // Default order cost
      backorderCost: product ? parseFloat(product["Unit Value"]) * 0.5 : 10, // 50% of product value
      initialInventory: parseFloat(policy["Simulation Policy Value 2"]) || 150,
      policy: policy["Simulation Policy"] || "(s,S)",
      policyParams: {
        s: parseFloat(policy["Simulation Policy Value 1"]) || 0,
        S: parseFloat(policy["Simulation Policy Value 2"]) || 0,
      }
    };
  });

  const config = {
    numDays: 365,
    numReplications: replications,
    serviceLevel: 0.95,
    policies: ["(s,S)", "(R,S)"]
  };

  return { tableData, config };
}

/**
 * Transform backend response to local simulation result format
 */
function transformFromBackendFormat(backendResults: any, input: SimulationInput): SimulationResult[] {
  const results: SimulationResult[] = [];
  
  // The backend returns results grouped by product/facility/policy
  if (backendResults.results) {
    backendResults.results.forEach((result: any, index: number) => {
      results.push({
        srNo: index + 1,
        scenarioDescription: `${result.product} at ${result.facility} - ${result.bestPolicy}`,
        costMin: result.totalCost * 0.9, // Approximate min/max
        costMax: result.totalCost * 1.1,
        costMean: result.totalCost,
        costSD: result.totalCost * 0.05,
        serviceLevelMin: Math.max(0, result.serviceLevel - 0.05),
        serviceLevelMax: Math.min(1, result.serviceLevel + 0.05),
        serviceLevelMean: result.serviceLevel,
        serviceLevelSD: 0.02,
        eltServiceLevelMin: Math.max(0, result.serviceLevel - 0.05),
        eltServiceLevelMax: Math.min(1, result.serviceLevel + 0.05),
        eltServiceLevelMean: result.serviceLevel,
        eltServiceLevelSD: 0.02,
        costBreakdown: {
          transportation: 0,
          production: 0,
          handling: 0,
          inventory: result.holdingCost,
          replenishment: result.orderingCost,
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
      
      onProgress?.(20);
      const backendResults = await railwayClient.optimizeInventory(tableData, config);
      
      onProgress?.(80);
      const scenarioResults = transformFromBackendFormat(backendResults, input);
      
      onProgress?.(100);
      
      console.log("✅ Backend simulation completed:", scenarioResults.length, "scenarios");
      
      return {
        scenarioResults,
        orderLogs: [],
        inventoryData: [],
        productionLogs: [],
        productFlowLogs: [],
        tripLogs: [],
        usedBackend: true
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
