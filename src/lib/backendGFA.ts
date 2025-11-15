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
  const data = {
    customers: customers.map(c => ({
      id: c.id,
      name: c.name,
      latitude: c.latitude,
      longitude: c.longitude,
      demand: c.demand,
      product: c.product,
      unitOfMeasure: c.unitOfMeasure,
      conversionFactor: c.conversionFactor,
    })),
    facilities: existingSites.map(site => ({
      id: site.id,
      name: site.name,
      latitude: site.latitude,
      longitude: site.longitude,
      capacity: site.capacity,
      capacityUnit: site.capacityUnit,
    })),
    products: products.map(p => ({
      name: p.name,
      baseUnit: p.baseUnit,
      sellingPrice: p.sellingPrice,
      unitConversions: p.unitConversions,
    })),
  };

  const optimizationSettings = {
    mode: settings.mode,
    numDCs: settings.numDCs,
    maxRadius: settings.maxRadius,
    demandPercentage: settings.demandPercentage,
    dcCapacity: settings.dcCapacity,
    capacityUnit: settings.capacityUnit,
    transportationCostPerMilePerUnit: settings.transportationCostPerMilePerUnit,
    facilityCost: settings.facilityCost,
    distanceUnit: settings.distanceUnit,
    costUnit: settings.costUnit,
    includeExistingSites: settings.includeExistingSites,
    existingSitesMode: settings.existingSitesMode,
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
  
  // Transform distribution centers from backend response
  if (backendResults.facilities) {
    backendResults.facilities.forEach((facility: any, index: number) => {
      dcs.push({
        id: facility.id || `dc-${index}`,
        latitude: facility.latitude,
        longitude: facility.longitude,
        assignedCustomers: facility.assignedCustomers || [],
        totalDemand: facility.totalDemand || 0,
        nearestCity: facility.nearestCity,
        cityCountry: facility.cityCountry,
      });
    });
  }

  const feasible = backendResults.feasible !== false;
  const warnings = backendResults.warnings || [];
  
  const costBreakdown = backendResults.costBreakdown ? {
    totalCost: backendResults.costBreakdown.totalCost || 0,
    transportationCost: backendResults.costBreakdown.transportationCost || 0,
    facilityCost: backendResults.costBreakdown.facilityCost || 0,
    numSites: backendResults.costBreakdown.numSites || dcs.length,
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
