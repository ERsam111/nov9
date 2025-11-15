// Backend GFA Adapter
// Transforms local GFA data to backend format and vice versa

import { railwayClient } from "@/lib/railwayClient";
import type { Customer, DistributionCenter, Product, ExistingSite, OptimizationSettings } from "@/types/gfa";

/**
 * Transform local GFA input to backend format
 */
function transformToBackendFormat(
  customers: Customer[],
  products: Product[],
  existingSites: ExistingSite[],
  settings: OptimizationSettings
) {
  // Transform products to have demand/capacity indexed by product ID
  const productMap: Record<string, any> = {};
  products.forEach(p => {
    productMap[p.name] = {
      id: p.name,
      name: p.name,
      baseUnit: p.baseUnit,
      sellingPrice: p.sellingPrice,
      unitConversions: p.unitConversions,
    };
  });

  // Transform customers with demand structured per product
  const customersData = customers.map(c => {
    const demand: Record<string, number> = {};
    // Each customer has demand for one product
    if (c.product && c.demand) {
      demand[c.product] = c.demand;
    }
    return {
      id: c.id,
      name: c.name,
      latitude: c.latitude,
      longitude: c.longitude,
      demand,
    };
  });

  // Transform facilities with capacity structured per product
  const facilitiesData = existingSites.map(site => {
    const capacity: Record<string, number> = {};
    // Distribute capacity across all products equally
    products.forEach(p => {
      capacity[p.name] = site.capacity / products.length;
    });
    return {
      id: site.id,
      name: site.name,
      latitude: site.latitude,
      longitude: site.longitude,
      capacity,
    };
  });

  const data = {
    customers: customersData,
    facilities: facilitiesData,
    products: Object.values(productMap),
  };

  const optimizationSettings = {
    transportCostPerKm: settings.transportationCostPerMilePerUnit || 0.5,
    fixedCostPerFacility: settings.facilityCost || 250000,
  };

  return { data, settings: optimizationSettings };
}

/**
 * Transform backend response to local GFA result format
 */
function transformFromBackendFormat(backendResults: any): {
  dcs: DistributionCenter[];
  feasible: boolean;
  warnings: string[];
  costBreakdown?: {
    totalCost: number;
    transportationCost: number;
    facilityCost: number;
    numSites: number;
  };
} {
  const dcs: DistributionCenter[] = [];
  
  // Backend returns allocation array with facility assignments
  if (backendResults.allocation && Array.isArray(backendResults.allocation)) {
    // Group allocations by facility
    const facilityMap = new Map<string, any>();
    
    backendResults.allocation.forEach((alloc: any) => {
      if (!facilityMap.has(alloc.facilityId)) {
        facilityMap.set(alloc.facilityId, {
          id: alloc.facilityId,
          name: alloc.facilityName,
          latitude: 0, // Will be set from facility data
          longitude: 0,
          assignedCustomers: [],
          totalDemand: 0,
        });
      }
      
      const facility = facilityMap.get(alloc.facilityId)!;
      facility.assignedCustomers.push(alloc.customerId);
      facility.totalDemand += alloc.quantity;
    });
    
    dcs.push(...Array.from(facilityMap.values()));
  }

  const feasible = backendResults.success !== false;
  const warnings: string[] = [];
  
  // Add warnings for unmet demand
  if (backendResults.kpis?.unmetDemand > 0) {
    warnings.push(`Unmet demand: ${backendResults.kpis.unmetDemand.toFixed(0)} units`);
  }
  
  const costBreakdown = backendResults.kpis ? {
    totalCost: backendResults.kpis.totalCost || 0,
    transportationCost: backendResults.kpis.transportCost || 0,
    facilityCost: backendResults.kpis.fixedCost || 0,
    numSites: backendResults.kpis.facilitiesUsed || dcs.length,
  } : undefined;

  return {
    dcs,
    feasible,
    warnings,
    costBreakdown,
  };
}

/**
 * Run GFA optimization using backend or fallback to local
 */
export async function runGFAWithBackend(
  customers: Customer[],
  products: Product[],
  existingSites: ExistingSite[],
  settings: OptimizationSettings,
  localOptimizeFn: () => any,
  useBackend: boolean = true
): Promise<{
  dcs: DistributionCenter[];
  feasible: boolean;
  warnings: string[];
  costBreakdown?: {
    totalCost: number;
    transportationCost: number;
    facilityCost: number;
    numSites: number;
  };
  usedBackend: boolean;
}> {
  // Check if backend is available
  const backendAvailable = useBackend && railwayClient.isEnabled();
  
  if (backendAvailable) {
    try {
      console.log("🚀 Using Render backend for GFA optimization...");
      
      const { data, settings: backendSettings } = transformToBackendFormat(
        customers,
        products,
        existingSites,
        settings
      );
      
      console.log("📤 Sending GFA data to backend:", {
        customers: data.customers.length,
        facilities: data.facilities.length,
        products: data.products.length,
        settings: backendSettings,
      });
      
      const backendResults = await railwayClient.optimizeGFA(data, backendSettings);
      
      console.log("📥 Received GFA results from backend:", backendResults);
      
      const result = transformFromBackendFormat(backendResults);
      
      console.log("✅ Backend GFA optimization completed:", {
        dcs: result.dcs.length,
        feasible: result.feasible,
        totalCost: result.costBreakdown?.totalCost,
      });
      
      return {
        ...result,
        usedBackend: true,
      };
    } catch (error) {
      console.error("❌ Backend GFA optimization failed, falling back to local:", error);
      // Fall through to local optimization
    }
  }
  
  // Fallback to local optimization
  console.log("💻 Using local GFA optimization...");
  const localResult = localOptimizeFn();
  
  return {
    ...localResult,
    usedBackend: false,
  };
}
