import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Haversine distance calculation
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Calculate geodesic centroid using iterative optimization (SAME AS LOCAL)
function calculateGeodesicCentroid(customers: any[]): {
  latitude: number;
  longitude: number;
} {
  if (customers.length === 0) {
    return { latitude: 0, longitude: 0 };
  }

  if (customers.length === 1) {
    return { latitude: customers[0].latitude, longitude: customers[0].longitude };
  }

  const totalDemand = customers.reduce((sum, c) => sum + c.demand, 0);
  let lat = customers.reduce((sum, c) => sum + c.latitude * c.demand, 0) / totalDemand;
  let lon = customers.reduce((sum, c) => sum + c.longitude * c.demand, 0) / totalDemand;

  const maxIterations = 100;
  const tolerance = 0.0001;

  for (let iter = 0; iter < maxIterations; iter++) {
    let numeratorLat = 0;
    let numeratorLon = 0;
    let denominator = 0;

    for (const customer of customers) {
      const distance = haversineDistance(lat, lon, customer.latitude, customer.longitude);
      
      if (distance < 0.001) {
        return { latitude: customer.latitude, longitude: customer.longitude };
      }

      const weight = customer.demand / distance;
      
      numeratorLat += weight * customer.latitude;
      numeratorLon += weight * customer.longitude;
      denominator += weight;
    }

    const newLat = numeratorLat / denominator;
    const newLon = numeratorLon / denominator;

    const change = Math.sqrt(Math.pow(newLat - lat, 2) + Math.pow(newLon - lon, 2));
    
    lat = newLat;
    lon = newLon;

    if (change < tolerance) {
      break;
    }
  }

  return { latitude: lat, longitude: lon };
}

// K-means clustering for DC optimization (SAME AS LOCAL)
function kMeansOptimization(
  customers: any[],
  numDCs: number,
  maxIterations: number = 100
): any[] {
  if (customers.length === 0 || numDCs <= 0) {
    return [];
  }

  const effectiveNumDCs = Math.min(numDCs, customers.length);
  
  // Initialize DCs with random customers
  const dcs: any[] = [];
  const selectedIndices = new Set<number>();
  
  while (selectedIndices.size < effectiveNumDCs) {
    const randomIndex = Math.floor(Math.random() * customers.length);
    if (!selectedIndices.has(randomIndex)) {
      selectedIndices.add(randomIndex);
      dcs.push({
        id: `DC-${dcs.length + 1}`,
        latitude: customers[randomIndex].latitude,
        longitude: customers[randomIndex].longitude,
        assignedCustomers: [],
        totalDemand: 0,
      });
    }
  }

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Assign customers to nearest DC
    for (const dc of dcs) {
      dc.assignedCustomers = [];
      dc.totalDemand = 0;
    }

    for (const customer of customers) {
      let minDistance = Infinity;
      let nearestDC = dcs[0];

      for (const dc of dcs) {
        const distance = haversineDistance(
          customer.latitude,
          customer.longitude,
          dc.latitude,
          dc.longitude
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestDC = dc;
        }
      }

      nearestDC.assignedCustomers.push(customer);
      nearestDC.totalDemand += customer.demand;
    }

    // Update DC positions to geodesic centroids
    let maxMovement = 0;
    for (const dc of dcs) {
      if (dc.assignedCustomers.length > 0) {
        const oldLat = dc.latitude;
        const oldLon = dc.longitude;
        
        const centroid = calculateGeodesicCentroid(dc.assignedCustomers);
        dc.latitude = centroid.latitude;
        dc.longitude = centroid.longitude;

        const movement = haversineDistance(oldLat, oldLon, dc.latitude, dc.longitude);
        maxMovement = Math.max(maxMovement, movement);
      }
    }

    // Convergence check
    if (maxMovement < 0.01) {
      break;
    }
  }

  return dcs.filter(dc => dc.assignedCustomers.length > 0);
}

// Build DC configuration with existing sites (MATCHES LOCAL LOGIC)
function buildDCConfiguration(
  customers: any[],
  numNewSites: number,
  existingSites: any[],
  mode: 'always' | 'potential' | 'use-existing-subset'
): any[] {
  const dcs: any[] = [];
  
  if (mode === 'always' || mode === 'use-existing-subset') {
    // Include existing sites
    const sitesToUse = mode === 'use-existing-subset' 
      ? existingSites.slice(0, numNewSites)
      : existingSites;
      
    sitesToUse.forEach(site => {
      dcs.push({
        id: site.id,
        latitude: site.latitude,
        longitude: site.longitude,
        assignedCustomers: [],
        totalDemand: 0,
        capacity: site.capacity || 0,
        isExisting: true,
      });
    });
  }
  
  // Add new sites if needed
  if (numNewSites > 0 && mode !== 'use-existing-subset') {
    const newSites = kMeansOptimization(customers, numNewSites);
    dcs.push(...newSites.map(dc => ({ ...dc, isExisting: false })));
  }
  
  // Assign customers to nearest DC
  for (const customer of customers) {
    let minDistance = Infinity;
    let nearestDC = dcs[0];

    for (const dc of dcs) {
      const distance = haversineDistance(
        customer.latitude,
        customer.longitude,
        dc.latitude,
        dc.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestDC = dc;
      }
    }

    if (nearestDC) {
      nearestDC.assignedCustomers.push(customer);
      nearestDC.totalDemand += customer.demand;
    }
  }

  return dcs.filter(dc => dc.assignedCustomers.length > 0);
}

// Calculate cost breakdown (MATCHES LOCAL LOGIC EXACTLY)
function calculateCostBreakdown(
  dcs: any[],
  settings: any,
  existingSites?: any[]
): {
  totalCost: number;
  transportationCost: number;
  facilityCost: number;
  numSites: number;
} {
  let transportationCost = 0;
  let totalDistance = 0;
  let totalDemand = 0;

  for (const dc of dcs) {
    for (const customer of dc.assignedCustomers) {
      const distance = haversineDistance(
        dc.latitude,
        dc.longitude,
        customer.latitude,
        customer.longitude
      );
      
      // Convert to miles if needed (SAME AS LOCAL)
      const distanceInUnit = settings.distanceUnit === 'mile' ? distance * 0.621371 : distance;
      
      // Use conversion factor if available (customer.conversionFactor accounts for unit differences)
      const demandInCostUnit = customer.demand * (customer.conversionFactor || 1);
      
      const costForThisCustomer = distanceInUnit * demandInCostUnit * (settings.transportationCostPerMilePerUnit || 0.5);
      transportationCost += costForThisCustomer;
      
      // Track for logging
      totalDistance += distanceInUnit;
      totalDemand += demandInCostUnit;
    }
  }

  // Calculate facility cost - ONLY count NEW sites (not existing ones)
  let numNewSites = dcs.length;
  if (existingSites && existingSites.length > 0) {
    // Count how many DCs match existing sites
    const existingDCCount = dcs.filter(dc => {
      return existingSites.some(site => 
        haversineDistance(dc.latitude, dc.longitude, site.latitude, site.longitude) < 1
      );
    }).length;
    numNewSites = dcs.length - existingDCCount;
  }

  const facilityCost = numNewSites * (settings.facilityCost || 100000);
  const totalCost = transportationCost + facilityCost;

  console.log("Cost breakdown details:", {
    totalDistance: totalDistance.toFixed(2),
    totalDemand: totalDemand.toFixed(2),
    transportationCost: transportationCost.toFixed(2),
    facilityCost: facilityCost.toFixed(2),
    numNewSites,
    totalSites: dcs.length,
  });

  return {
    totalCost,
    transportationCost,
    facilityCost,
    numSites: dcs.length,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("GFA Optimization - Request received");
    
    const { customers, existingSites, settings } = await req.json();
    
    console.log("Input data:", {
      customersCount: customers?.length || 0,
      existingSitesCount: existingSites?.length || 0,
      mode: settings?.mode,
      numDCs: settings?.numDCs,
    });

    if (!customers || customers.length === 0) {
      throw new Error("No customers provided for optimization");
    }

    let dcs: any[] = [];
    let warnings: string[] = [];

    // EXACT SAME LOGIC AS LOCAL: Respect mode and existing sites settings
    const existingSitesMode = settings.existingSitesMode || 'always';
    
    if (settings.includeExistingSites && existingSites && existingSites.length > 0) {
      console.log(`Using existing sites with mode: ${existingSitesMode}`);
      
      if (settings.mode === 'sites') {
        // Sites mode: use specified number of DCs
        if (existingSitesMode === 'always') {
          const numNewSites = Math.max(0, (settings.numDCs || 3) - existingSites.length);
          dcs = buildDCConfiguration(customers, numNewSites, existingSites, 'always');
        } else if (existingSitesMode === 'potential') {
          // Compare existing vs new sites
          const newSitesDcs = kMeansOptimization(customers, settings.numDCs || 3);
          const existingDcs = buildDCConfiguration(customers, settings.numDCs || 3, existingSites, 'use-existing-subset');
          
          const newCost = calculateCostBreakdown(newSitesDcs, settings, existingSites);
          const existingCost = calculateCostBreakdown(existingDcs, settings, existingSites);
          
          dcs = existingCost.totalCost < newCost.totalCost ? existingDcs : newSitesDcs;
        }
      } else {
        // Cost mode: minimize cost
        dcs = buildDCConfiguration(customers, 0, existingSites, 'always');
      }
    } else {
      // No existing sites - use K-means
      console.log("Running K-means optimization with", settings.numDCs, "DCs");
      dcs = kMeansOptimization(customers, settings.numDCs || 3);
    }

    // Calculate cost breakdown (PASS existingSites to correctly calculate facility costs)
    const costBreakdown = calculateCostBreakdown(dcs, settings, existingSites);

    // Check capacity constraints
    if (settings.dcCapacity && settings.dcCapacity > 0) {
      for (const dc of dcs) {
        if (dc.totalDemand > settings.dcCapacity) {
          warnings.push(`DC ${dc.id} exceeds capacity: ${dc.totalDemand.toFixed(2)} > ${settings.dcCapacity}`);
        }
      }
    }

    const result = {
      dcs,
      feasible: warnings.length === 0,
      warnings,
      costBreakdown,
    };

    console.log("Optimization completed:", {
      numDCs: dcs.length,
      totalCost: costBreakdown.totalCost.toFixed(2),
      transportationCost: costBreakdown.transportationCost.toFixed(2),
      facilityCost: costBreakdown.facilityCost.toFixed(2),
      feasible: result.feasible,
    });

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error("GFA Optimization error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        dcs: [],
        feasible: false,
        warnings: [errorMessage],
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
