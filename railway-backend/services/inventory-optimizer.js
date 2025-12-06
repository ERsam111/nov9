// Inventory Optimizer - Backend Service (MATCHES LOCAL SIMULATION ENGINE EXACTLY)
// This replicates the local simulationEngine.ts logic for consistent results

// ================== Group Expansion Helper ==================
function expandGroupToMembers(name, groupData, groupType) {
  if (!groupData || groupData.length === 0) return [name];
  
  const groupMembers = groupData.filter(
    (g) => g["Group Name"] === name && g["Group Type"] === groupType && g["Status"] === "Include"
  );
  
  if (groupMembers.length > 0) {
    return groupMembers.map((g) => g["Member Name"]);
  }
  return [name];
}

function expandCustomerOrders(customerOrderData, groupData) {
  const expandedOrders = [];
  let orderIdCounter = 1;
  
  for (const order of customerOrderData) {
    if (order["Status"] !== "Include") continue;
    
    const customerName = order["Customer Name"];
    const productName = order["Product Name"];
    
    const customerMembers = expandGroupToMembers(customerName, groupData, 'Customer');
    const productMembers = expandGroupToMembers(productName, groupData, 'Product');
    
    for (const cust of customerMembers) {
      for (const prod of productMembers) {
        expandedOrders.push({
          ...order,
          "Order ID": orderIdCounter++,
          "Customer Name": cust,
          "Product Name": prod,
          "_originalCustomer": customerName,
          "_originalProduct": productName,
        });
      }
    }
  }
  
  return expandedOrders;
}

// ================== RNG helpers ==================
function generateDemand(distributionStr) {
  const numeric = Number(distributionStr);
  if (!isNaN(numeric)) return numeric;

  const match = distributionStr?.match?.(/(\w+)\(([\d\s,\.]+)\)/);
  if (!match) return 100;

  const [, distribution, paramsStr] = match;
  const params = paramsStr.split(",").map((p) => parseFloat(p.trim()));

  switch ((distribution || "").toLowerCase()) {
    case "uniform": {
      const [min, max] = params;
      return Math.random() * (max - min) + min;
    }
    case "normal": {
      const [mean, std] = params;
      return normalRandom(mean, std);
    }
    case "exponential": {
      const [lambda] = params;
      return -Math.log(1 - Math.random()) / lambda;
    }
    case "poisson": {
      return poissonRandom(params[0]);
    }
    case "constant": {
      return params[0];
    }
    default:
      return 100;
  }
}

function normalRandom(mean, std) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * std + mean;
}

function poissonRandom(lambda) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

// ================== One replication ==================
function runReplication(input, scenario, repNumber, collectInventory, scenarioDescription) {
  const simulationDays = 365;
  const scDesc = scenarioDescription || `${scenario.facilityName} | ${scenario.productName} | s=${scenario.s} | S=${scenario.S}`;

  // ---- Cost lookups ----
  const warehousing = input.warehousingData?.find(
    (w) => w["Facility Name"] === scenario.facilityName && w["Product Name"] === scenario.productName
  );
  const production = input.productionData?.find(
    (p) => p["Facility Name"]?.startsWith("S") && p["Product Name"] === scenario.productName
  );
  const replenishment = input.replenishmentData?.find(
    (r) => r["Facility Name"] === scenario.facilityName && r["Product Name"] === scenario.productName
  );
  const transportation = input.transportationData?.find(
    (t) => t["Destination Name"] === scenario.facilityName && t["Product Name"] === scenario.productName
  );

  const holdingCostPerUnit = parseFloat(warehousing?.["Stocking Unit Cost"] || "0.3");
  const productionCost = parseFloat(production?.["Unit Cost"] || "10");
  const inboundHandling = parseFloat(warehousing?.["Inbound Handling Cost"] || "1");
  const outboundHandling = parseFloat(warehousing?.["Outbound Handling Cost"] || "1.5");
  const productionRate = parseFloat(production?.["Production Rate"] || "50");
  const productionRateTimeUOM = production?.["Rate Time UOM"] || "HR";
  const productionRatePerDay = productionRateTimeUOM === "HR" ? productionRate * 24 : productionRate;
  const transportUnitCost = parseFloat(transportation?.["Unit Cost"] || "0.5");
  const transportFixedCost = parseFloat(transportation?.["Fixed Cost"] || "200");
  const replenishmentUnitCost = parseFloat(replenishment?.["Unit Cost"] || "0");
  const transportTimeDistribution = transportation?.["Transport Time Distribution"] || "Constant(2)";
  const transportTimeUOM = transportation?.["Transport Time Distribution UOM"] || "DAY";

  const convertToDays = (time, uom) => {
    switch (uom?.toUpperCase()) {
      case "MIN": return time / (60 * 24);
      case "HR": return time / 24;
      default: return time;
    }
  };

  // ---- Multi-facility inventory tracking ----
  const facilityInventory = {};
  
  const ensureFacilityProduct = (facName, prodName, defaultS = 100, defaultS_lower = 10) => {
    const key = `${facName}|${prodName}`;
    if (facilityInventory[key]) return;
    
    const invPolicy = input.inventoryPolicyData?.find(
      (ip) => ip["Facility Name"] === facName && ip["Product Name"] === prodName
    );
    
    const S_value = invPolicy ? parseFloat(invPolicy["Simulation Policy Value 2"] || String(defaultS)) : defaultS;
    const s_value = invPolicy ? parseFloat(invPolicy["Simulation Policy Value 1"] || String(defaultS_lower)) : defaultS_lower;
    const initialInventory = invPolicy?.["Initial Inventory"] !== undefined 
      ? parseFloat(invPolicy["Initial Inventory"]) 
      : S_value;
    
    facilityInventory[key] = {
      inventory: initialInventory,
      s: s_value,
      S: S_value,
      facilityName: facName,
      productName: prodName
    };
  };
  
  // Initialize from scenario.allFactors
  if (scenario.allFactors && scenario.allFactors.length > 0) {
    for (const factor of scenario.allFactors) {
      const key = `${factor.facilityName}|${factor.productName}`;
      const invPolicy = input.inventoryPolicyData?.find(
        (ip) => ip["Facility Name"] === factor.facilityName && ip["Product Name"] === factor.productName
      );
      const initialInventory = invPolicy?.["Initial Inventory"] !== undefined 
        ? parseFloat(invPolicy["Initial Inventory"]) 
        : factor.S;
      
      facilityInventory[key] = {
        inventory: initialInventory,
        s: factor.s,
        S: factor.S,
        facilityName: factor.facilityName,
        productName: factor.productName
      };
    }
  } else {
    const key = `${scenario.facilityName}|${scenario.productName}`;
    const invPolicy = input.inventoryPolicyData?.find(
      (ip) => ip["Facility Name"] === scenario.facilityName && ip["Product Name"] === scenario.productName
    );
    const initialInventory = invPolicy?.["Initial Inventory"] !== undefined 
      ? parseFloat(invPolicy["Initial Inventory"]) 
      : scenario.S;
    
    facilityInventory[key] = {
      inventory: initialInventory,
      s: scenario.s,
      S: scenario.S,
      facilityName: scenario.facilityName,
      productName: scenario.productName
    };
  }
  
  // Add from all data sources
  for (const invPolicy of input.inventoryPolicyData || []) {
    ensureFacilityProduct(invPolicy["Facility Name"], invPolicy["Product Name"]);
  }
  for (const prod of input.productionData || []) {
    if (prod["Facility Name"] && prod["Product Name"]) {
      ensureFacilityProduct(prod["Facility Name"], prod["Product Name"], 200, 50);
    }
  }
  for (const trans of input.transportationData || []) {
    if (trans["Origin Name"] && trans["Product Name"]) {
      ensureFacilityProduct(trans["Origin Name"], trans["Product Name"], 200, 50);
    }
    if (trans["Destination Name"] && trans["Product Name"]) {
      ensureFacilityProduct(trans["Destination Name"], trans["Product Name"], 100, 20);
    }
  }
  for (const cf of input.customerFulfillmentData || []) {
    if (cf["Facility Name"] && cf["Product Name"]) {
      ensureFacilityProduct(cf["Facility Name"], cf["Product Name"], 100, 20);
    }
  }

  const s = scenario.s;
  const S = scenario.S;
  const mainInvPolicy = input.inventoryPolicyData?.find(
    (ip) => ip["Facility Name"] === scenario.facilityName && ip["Product Name"] === scenario.productName
  );
  const mainInitialInventory = mainInvPolicy?.["Initial Inventory"] !== undefined 
    ? parseFloat(mainInvPolicy["Initial Inventory"]) 
    : S;
  
  let inventory = mainInitialInventory;

  // Expand customer orders
  const expandedOrders = expandCustomerOrders(input.customerOrderData || [], input.groupData || []);
  
  // Build customer order profiles
  const customerOrderProfiles = [];
  for (const order of expandedOrders) {
    const custName = order["Customer Name"];
    const prodName = order["Product Name"];
    const demandDist = order["Demand Distribution"] || "Normal(100,20)";
    const intervalDist = order["Order Interval Distribution"] || "Constant(1)";
    
    const fulfillment = input.customerFulfillmentData?.find(
      (cf) => cf["Customer Name"] === custName && cf["Product Name"] === prodName
    );
    const servingFacility = fulfillment?.["Facility Name"] || scenario.facilityName;
    const serviceWindow = parseFloat(fulfillment?.["Service Window"] || order["Service Window"] || "5");
    
    customerOrderProfiles.push({
      customerName: custName,
      productName: prodName,
      demandDistribution: demandDist,
      orderIntervalDistribution: intervalDist,
      servingFacility,
      serviceWindow,
      nextOrderDay: Math.floor(Math.max(0, generateDemand(intervalDist))),
    });
  }

  // Simulation state
  let totalCost = 0;
  let transportationCost = 0;
  let productionCostTotal = 0;
  let handlingCostTotal = 0;
  let inventoryCostTotal = 0;
  let replenishmentCostTotal = 0;
  let totalDemand = 0;
  let totalFulfilled = 0;
  let totalOrders = 0;
  let onTimeOrders = 0;
  let dailyInventorySum = 0;
  let totalReplenishmentOrders = 0;
  let totalReplenishmentUnits = 0;
  let totalProductionUnits = 0;
  let totalInboundUnits = 0;
  let totalOutboundUnits = 0;

  const facilityDailyInventorySum = {};
  for (const key of Object.keys(facilityInventory)) {
    facilityDailyInventorySum[key] = 0;
  }

  const orderLog = [];
  const inventorySnapshots = [];
  const productionLog = [];
  const productFlowLog = [];
  const tripAggregation = {};
  const pendingReplenishments = [];
  let replenishmentCounter = 1;
  let orderIdCounter = 1;

  for (let day = 0; day < simulationDays; day++) {
    // Process pending replenishments
    const arrivals = pendingReplenishments.filter(pr => pr.arrivalDay === day);
    for (const arrival of arrivals) {
      if (facilityInventory[arrival.facilityKey]) {
        facilityInventory[arrival.facilityKey].inventory += arrival.qty;
        handlingCostTotal += arrival.qty * inboundHandling;
        totalInboundUnits += arrival.qty;
        
        if (arrival.sourceKey && facilityInventory[arrival.sourceKey]) {
          facilityInventory[arrival.sourceKey].inventory -= arrival.qty;
        }
      }
    }
    
    // Remove processed replenishments
    for (let i = pendingReplenishments.length - 1; i >= 0; i--) {
      if (pendingReplenishments[i].arrivalDay === day) {
        pendingReplenishments.splice(i, 1);
      }
    }

    // Process customer orders
    for (const profile of customerOrderProfiles) {
      if (day === profile.nextOrderDay) {
        const quantity = Math.max(1, Math.round(generateDemand(profile.demandDistribution)));
        totalDemand += quantity;
        totalOrders++;
        
        const facKey = `${profile.servingFacility}|${profile.productName}`;
        const facInv = facilityInventory[facKey];
        
        let fulfilledQty = 0;
        let deliveryDay = null;
        
        if (facInv && facInv.inventory >= quantity) {
          facInv.inventory -= quantity;
          fulfilledQty = quantity;
          totalFulfilled += quantity;
          handlingCostTotal += quantity * outboundHandling;
          totalOutboundUnits += quantity;
          
          const leadTimeRaw = generateDemand(transportTimeDistribution);
          const leadTimeDays = convertToDays(leadTimeRaw, transportTimeUOM);
          deliveryDay = day + Math.ceil(leadTimeDays);
          transportationCost += transportFixedCost + (quantity * transportUnitCost);
          
          const waitTime = deliveryDay - day;
          if (waitTime <= profile.serviceWindow) {
            onTimeOrders++;
          }
        } else if (facInv && facInv.inventory > 0) {
          fulfilledQty = facInv.inventory;
          totalFulfilled += fulfilledQty;
          facInv.inventory = 0;
          handlingCostTotal += fulfilledQty * outboundHandling;
          totalOutboundUnits += fulfilledQty;
          
          const leadTimeRaw = generateDemand(transportTimeDistribution);
          const leadTimeDays = convertToDays(leadTimeRaw, transportTimeUOM);
          deliveryDay = day + Math.ceil(leadTimeDays);
          transportationCost += transportFixedCost + (fulfilledQty * transportUnitCost);
        }
        
        orderLog.push({
          orderId: orderIdCounter++,
          customerName: profile.customerName,
          productName: profile.productName,
          quantity: quantity,
          orderDate: `Day ${day}`,
          deliveryDate: deliveryDay !== null ? `Day ${deliveryDay}` : null,
          waitTime: deliveryDay !== null ? deliveryDay - day : -1,
          onTime: deliveryDay !== null && (deliveryDay - day) <= profile.serviceWindow,
          scenario: `${profile.servingFacility}-${profile.productName}`,
          scenarioDescription: scDesc,
          replication: repNumber || 0,
        });
        
        const nextInterval = Math.max(1, Math.round(generateDemand(profile.orderIntervalDistribution)));
        profile.nextOrderDay = day + nextInterval;
      }
    }

    // Inventory holding costs
    let mainInventory = 0;
    for (const key of Object.keys(facilityInventory)) {
      const facInv = facilityInventory[key];
      const facWarehousing = input.warehousingData?.find(
        (w) => w["Facility Name"] === facInv.facilityName && w["Product Name"] === facInv.productName
      );
      const facHoldingCost = parseFloat(facWarehousing?.["Stocking Unit Cost"] || "0.3");
      inventoryCostTotal += facInv.inventory * facHoldingCost;
      facilityDailyInventorySum[key] += facInv.inventory;
      
      if (key === `${scenario.facilityName}|${scenario.productName}`) {
        mainInventory = facInv.inventory;
      }
    }
    dailyInventorySum += mainInventory;

    // Check replenishment for all tracked facilities
    for (const key of Object.keys(facilityInventory)) {
      const facInv = facilityInventory[key];
      if (facInv.inventory <= facInv.s) {
        const orderQty = facInv.S - facInv.inventory;
        replenishmentCostTotal += transportFixedCost;
        totalReplenishmentOrders++;
        totalReplenishmentUnits += orderQty;
        
        const leadTimeRaw = generateDemand(transportTimeDistribution);
        const leadTimeDays = Math.max(1, Math.ceil(convertToDays(leadTimeRaw, transportTimeUOM)));
        const arrivalDay = day + leadTimeDays;
        
        // Find source facility
        const facilityTransportation = input.transportationData?.find(
          (t) => t["Destination Name"] === facInv.facilityName && t["Product Name"] === facInv.productName
        );
        const originFacility = facilityTransportation?.["Origin Name"] || "Supplier1";
        const sourceKey = `${originFacility}|${facInv.productName}`;
        
        pendingReplenishments.push({
          id: replenishmentCounter++,
          qty: orderQty,
          arrivalDay: arrivalDay,
          orderDay: day,
          facilityKey: key,
          sourceKey: sourceKey,
        });
        
        productFlowLog.push({
          source: originFacility,
          destination: facInv.facilityName,
          product: facInv.productName,
          quantity: orderQty,
          date: `Day ${day}`,
          scenario: `${facInv.facilityName}-${facInv.productName}`,
          scenarioDescription: scDesc,
          replication: repNumber || 0,
        });
        
        const tripKey = `${originFacility}|${facInv.facilityName}`;
        const modeName = facilityTransportation?.["Mode Name"] || "Truck";
        if (!tripAggregation[tripKey]) {
          tripAggregation[tripKey] = { from: originFacility, to: facInv.facilityName, totalQuantity: 0, vehicleType: modeName };
        }
        tripAggregation[tripKey].totalQuantity += orderQty;
      }
    }

    // Collect inventory snapshots
    if (collectInventory) {
      for (const key of Object.keys(facilityInventory)) {
        const facInv = facilityInventory[key];
        inventorySnapshots.push({
          day,
          inventory: facInv.inventory,
          facility: facInv.facilityName,
          product: facInv.productName,
          scenario: `${facInv.facilityName}-${facInv.productName}`,
          scenarioDescription: scDesc,
          replication: repNumber || 0,
        });
      }
    }
  }

  const fillRate = totalDemand > 0 ? (totalFulfilled / totalDemand) * 100 : 0;
  const eltServiceLevel = totalOrders > 0 ? (onTimeOrders / totalOrders) * 100 : 0;
  totalCost = transportationCost + productionCostTotal + handlingCostTotal + inventoryCostTotal + replenishmentCostTotal;

  const costBreakdown = {
    transportation: transportationCost,
    production: productionCostTotal,
    handling: handlingCostTotal,
    inventory: inventoryCostTotal,
    replenishment: replenishmentCostTotal,
  };

  const distributionType = transportTimeDistribution.split("(")[0] || "Constant";
  const distributionParams = transportTimeDistribution.match(/\((.*)\)/)?.[1] || "2";
  
  const transportationDetails = {
    fixedCostPerOrder: transportFixedCost,
    transportUnitCost: transportUnitCost,
    replenishmentUnitCost: replenishmentUnitCost,
    totalOrders: totalReplenishmentOrders,
    totalUnits: totalReplenishmentUnits,
    distributionType: distributionType,
    distributionParams: distributionParams,
  };

  const productionDetails = {
    unitCost: productionCost,
    totalUnits: totalProductionUnits,
  };

  const handlingDetails = {
    inboundCost: inboundHandling,
    outboundCost: outboundHandling,
    inboundUnits: totalInboundUnits,
    outboundUnits: totalOutboundUnits,
  };

  const avgInventory = simulationDays > 0 ? dailyInventorySum / simulationDays : 0;
  
  const byFacility = [];
  for (const key of Object.keys(facilityInventory)) {
    const facInv = facilityInventory[key];
    const avgFacilityInventory = simulationDays > 0 ? facilityDailyInventorySum[key] / simulationDays : 0;
    const facWarehousing = input.warehousingData?.find(
      (w) => w["Facility Name"] === facInv.facilityName && w["Product Name"] === facInv.productName
    );
    const facHoldingCost = parseFloat(facWarehousing?.["Stocking Unit Cost"] || "0.3");
    
    byFacility.push({
      facilityName: facInv.facilityName,
      productName: facInv.productName,
      holdingCostPerUnit: facHoldingCost,
      avgInventory: avgFacilityInventory,
      totalHoldingCost: avgFacilityInventory * facHoldingCost * simulationDays,
    });
  }
  
  const inventoryDetails = {
    holdingCostPerUnit: holdingCostPerUnit,
    avgInventory: avgInventory,
    days: simulationDays,
    byFacility: byFacility,
  };

  // Calculate trips
  const tripLog = [];
  for (const tripKey of Object.keys(tripAggregation)) {
    const tripData = tripAggregation[tripKey];
    let vehicleCapacity = 1000;
    const modeConfig = input.transportationData?.find((m) => m["Mode Name"] === tripData.vehicleType);
    if (modeConfig?.["Vehicle Capacity"]) {
      vehicleCapacity = parseFloat(modeConfig["Vehicle Capacity"]) || 1000;
    }
    const trips = Math.ceil(tripData.totalQuantity / vehicleCapacity);
    
    tripLog.push({
      from: tripData.from,
      to: tripData.to,
      vehicleType: tripData.vehicleType,
      trips: trips,
      totalQuantity: tripData.totalQuantity,
      scenario: scDesc,
      scenarioDescription: scDesc,
      replication: repNumber || 0,
    });
  }

  return { 
    cost: totalCost, 
    serviceLevel: fillRate, 
    eltServiceLevel, 
    orderLog, 
    costBreakdown, 
    transportationDetails, 
    productionDetails, 
    handlingDetails, 
    inventoryDetails, 
    inventorySnapshots,
    productionLog,
    productFlowLog,
    tripLog
  };
}

// ================== Scenario Generation (MATCHES LOCAL) ==================
function generateParameterValues(min, max, step) {
  const values = [];
  const steps = Math.round((max - min) / step) + 1;
  for (let i = 0; i < steps; i++) {
    const v = min + i * step;
    if (v <= max) values.push(Math.round(v * 100) / 100);
  }
  return values;
}

function generateScenarios(input) {
  const scenarios = [];
  const inputFactors = input.inputFactorsData;

  if (!inputFactors || inputFactors.length === 0) {
    const dcPolicy = input.inventoryPolicyData?.find((ip) => ip["Facility Name"]?.startsWith("DC"));
    if (dcPolicy) {
      scenarios.push({
        facilityName: dcPolicy["Facility Name"],
        productName: dcPolicy["Product Name"],
        s: parseFloat(dcPolicy["Simulation Policy Value 1"] || "150"),
        S: parseFloat(dcPolicy["Simulation Policy Value 2"] || "600"),
      });
    }
    return scenarios;
  }

  const factorCombinations = {};
  
  for (const factor of inputFactors) {
    const facilityName = factor["Facility Name"];
    const productName = factor["Product"];
    const parameterSetupStr = factor["Parameter Setup"];
    if (!parameterSetupStr || !facilityName || !productName) continue;

    const key = `${facilityName}|${productName}`;
    
    let config = [];
    try {
      config = JSON.parse(parameterSetupStr);
    } catch {
      continue;
    }

    const sCfg = config.find((p) => p.name === "s");
    const SCfg = config.find((p) => p.name === "S");
    if (!sCfg || !SCfg) continue;

    const sVals = generateParameterValues(sCfg.min, sCfg.max, sCfg.step);
    const SVals = generateParameterValues(SCfg.min, SCfg.max, SCfg.step);

    const combinations = [];
    for (const s of sVals) {
      for (const S of SVals) {
        if (s < S) {
          combinations.push({ facilityName, productName, s, S });
        }
      }
    }
    factorCombinations[key] = combinations;
  }

  const keys = Object.keys(factorCombinations);
  if (keys.length === 0) return scenarios;
  
  // Iterative Cartesian product
  const cartesianProduct = (arrays) => {
    if (arrays.length === 0) return [[]];
    
    let result = [[]];
    for (const arr of arrays) {
      const newResult = [];
      for (const existing of result) {
        for (const item of arr) {
          newResult.push([...existing, item]);
        }
      }
      result = newResult;
      if (result.length > 10000) {
        console.warn(`Limiting scenarios to 10000`);
        break;
      }
    }
    return result;
  };
  
  const allCombinations = cartesianProduct(Object.values(factorCombinations));
  
  for (const combo of allCombinations) {
    const scenario = {};
    for (const item of combo) {
      const prefix = `${item.facilityName}_${item.productName}`;
      scenario[`${prefix}_s`] = item.s;
      scenario[`${prefix}_S`] = item.S;
      scenario[`${prefix}_facilityName`] = item.facilityName;
      scenario[`${prefix}_productName`] = item.productName;
    }
    if (combo.length > 0) {
      scenario.facilityName = combo[0].facilityName;
      scenario.productName = combo[0].productName;
      scenario.s = combo[0].s;
      scenario.S = combo[0].S;
    }
    scenario.allFactors = combo;
    scenarios.push(scenario);
  }
  
  return scenarios;
}

function calculateStats(values) {
  if (!values.length) return { min: 0, max: 0, mean: 0, sd: 0 };
  
  let min = values[0];
  let max = values[0];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i] < min) min = values[i];
    if (values[i] > max) max = values[i];
    sum += values[i];
  }
  const mean = sum / values.length;
  
  let varianceSum = 0;
  for (let i = 0; i < values.length; i++) {
    varianceSum += Math.pow(values[i] - mean, 2);
  }
  const variance = varianceSum / values.length;
  
  return { min, max, mean, sd: Math.sqrt(variance) };
}

// ================== Main Optimization Function ==================
export async function optimizeInventory(requestData) {
  const { input, config } = requestData;
  
  console.log('Starting inventory optimization (backend - matches local)...');
  console.log('Received data:', {
    customerOrders: input?.customerOrderData?.length,
    inventoryPolicies: input?.inventoryPolicyData?.length,
    inputFactors: input?.inputFactorsData?.length,
    replications: config?.replications
  });
  
  const startTime = Date.now();
  
  const scenarios = generateScenarios(input);
  const replications = config?.replications || 30;
  const collectInventory = config?.collectInventory !== false;
  
  console.log(`Generated ${scenarios.length} scenarios, running ${replications} replications each`);
  
  const scenarioResults = [];
  const allOrderLogs = [];
  const allInventoryData = [];
  const allProductionLogs = [];
  const allProductFlowLogs = [];
  const allTripLogs = [];

  for (let i = 0; i < scenarios.length; i++) {
    const sc = scenarios[i];
    
    let desc = "";
    if (sc.allFactors && sc.allFactors.length > 0) {
      desc = sc.allFactors.map((f) => `${f.facilityName}(${f.productName}): s=${f.s}, S=${f.S}`).join(" | ");
    } else {
      desc = `${sc.facilityName} | ${sc.productName} | s=${sc.s} | S=${sc.S}`;
    }
    
    const costs = [];
    const sls = [];
    const elts = [];
    const scenarioOrderLogs = [];
    const costBreakdowns = [];
    let transportationDetailsForScenario;
    let productionDetailsForScenario;
    let handlingDetailsForScenario;
    let inventoryDetailsForScenario;

    for (let rep = 0; rep < replications; rep++) {
      const result = runReplication(input, sc, rep + 1, collectInventory && rep < 3, desc);
      
      costs.push(result.cost);
      sls.push(result.serviceLevel);
      elts.push(result.eltServiceLevel);
      costBreakdowns.push(result.costBreakdown);
      
      if (rep === 0) {
        transportationDetailsForScenario = result.transportationDetails;
        productionDetailsForScenario = result.productionDetails;
        handlingDetailsForScenario = result.handlingDetails;
        inventoryDetailsForScenario = result.inventoryDetails;
      }

      for (const log of result.orderLog) {
        scenarioOrderLogs.push({ ...log, scenarioDescription: desc });
      }
      
      if (rep === 0) {
        for (const log of result.productionLog) allProductionLogs.push(log);
        for (const log of result.productFlowLog) allProductFlowLogs.push(log);
        for (const log of result.tripLog) allTripLogs.push(log);
      }

      if (collectInventory && rep < 3) {
        for (const snap of result.inventorySnapshots) allInventoryData.push(snap);
      }
    }

    for (const log of scenarioOrderLogs) allOrderLogs.push(log);

    const costStats = calculateStats(costs);
    const slStats = calculateStats(sls);
    const eltStats = calculateStats(elts);

    const avgBreakdown = {
      transportation: costBreakdowns.reduce((s, b) => s + b.transportation, 0) / costBreakdowns.length,
      production: costBreakdowns.reduce((s, b) => s + b.production, 0) / costBreakdowns.length,
      handling: costBreakdowns.reduce((s, b) => s + b.handling, 0) / costBreakdowns.length,
      inventory: costBreakdowns.reduce((s, b) => s + b.inventory, 0) / costBreakdowns.length,
      replenishment: costBreakdowns.reduce((s, b) => s + b.replenishment, 0) / costBreakdowns.length,
    };

    scenarioResults.push({
      srNo: i + 1,
      scenarioDescription: desc,
      costMin: Math.round(costStats.min),
      costMax: Math.round(costStats.max),
      costMean: Math.round(costStats.mean),
      costSD: Math.round(costStats.sd),
      serviceLevelMin: parseFloat(slStats.min.toFixed(2)),
      serviceLevelMax: parseFloat(slStats.max.toFixed(2)),
      serviceLevelMean: parseFloat(slStats.mean.toFixed(2)),
      serviceLevelSD: parseFloat(slStats.sd.toFixed(2)),
      eltServiceLevelMin: parseFloat(eltStats.min.toFixed(2)),
      eltServiceLevelMax: parseFloat(eltStats.max.toFixed(2)),
      eltServiceLevelMean: parseFloat(eltStats.mean.toFixed(2)),
      eltServiceLevelSD: parseFloat(eltStats.sd.toFixed(2)),
      costBreakdown: avgBreakdown,
      transportationDetails: transportationDetailsForScenario,
      productionDetails: productionDetailsForScenario,
      handlingDetails: handlingDetailsForScenario,
      inventoryDetails: inventoryDetailsForScenario,
    });
    
    console.log(`Completed scenario ${i + 1}/${scenarios.length}: ${desc.substring(0, 50)}...`);
  }
  
  const endTime = Date.now();
  console.log(`Optimization completed: ${scenarioResults.length} scenarios in ${endTime - startTime}ms`);
  
  return {
    success: true,
    scenarioResults,
    orderLogs: allOrderLogs,
    inventoryData: allInventoryData,
    productionLogs: allProductionLogs,
    productFlowLogs: allProductFlowLogs,
    tripLogs: allTripLogs,
    executionTime: endTime - startTime
  };
}
