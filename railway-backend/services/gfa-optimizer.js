// GFA (Gravity Facility Allocation) Optimizer
// Optimizes facility locations and allocations based on customer demand and costs

class GFAOptimizer {
  constructor(data, settings) {
    this.customers = data.customers || [];
    this.facilities = data.facilities || [];
    this.products = data.products || [];
    this.settings = settings || {};
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Calculate gravity score for facility-customer pair
  calculateGravityScore(facility, customer, product) {
    const distance = this.calculateDistance(
      facility.latitude, facility.longitude,
      customer.latitude, customer.longitude
    );
    
    const demand = customer.demand?.[product.id] || 0;
    const capacity = facility.capacity?.[product.id] || 0;
    
    // Gravity model: Attraction = (Capacity * Demand) / Distance^2
    if (distance === 0) return Infinity;
    return (capacity * demand) / Math.pow(distance, 2);
  }

  // Calculate transportation cost
  calculateTransportCost(distance, quantity, costPerKm) {
    return distance * quantity * costPerKm;
  }

  // Calculate total cost for an allocation
  calculateAllocationCost(allocation, costPerKm, fixedCostPerFacility) {
    let totalCost = 0;
    const usedFacilities = new Set();

    for (const alloc of allocation) {
      const facility = this.facilities.find(f => f.id === alloc.facilityId);
      const customer = this.customers.find(c => c.id === alloc.customerId);
      
      if (!facility || !customer) continue;

      const distance = this.calculateDistance(
        facility.latitude, facility.longitude,
        customer.latitude, customer.longitude
      );

      totalCost += this.calculateTransportCost(distance, alloc.quantity, costPerKm);
      usedFacilities.add(alloc.facilityId);
    }

    // Add fixed costs for used facilities
    totalCost += usedFacilities.size * fixedCostPerFacility;

    return totalCost;
  }

  // Greedy allocation algorithm
  optimizeGreedy() {
    const allocation = [];
    const facilityLoads = {};
    const customerDemands = {};

    // Initialize tracking
    this.facilities.forEach(f => {
      facilityLoads[f.id] = {};
      this.products.forEach(p => {
        facilityLoads[f.id][p.id] = 0;
      });
    });

    this.customers.forEach(c => {
      customerDemands[c.id] = { ...c.demand };
    });

    // For each customer-product pair, find best facility
    for (const customer of this.customers) {
      for (const product of this.products) {
        const demand = customer.demand?.[product.id] || 0;
        if (demand === 0) continue;

        let bestFacility = null;
        let bestScore = -Infinity;

        for (const facility of this.facilities) {
          const capacity = facility.capacity?.[product.id] || 0;
          const currentLoad = facilityLoads[facility.id][product.id];
          const availableCapacity = capacity - currentLoad;

          if (availableCapacity <= 0) continue;

          const score = this.calculateGravityScore(facility, customer, product);
          
          if (score > bestScore) {
            bestScore = score;
            bestFacility = facility;
          }
        }

        if (bestFacility) {
          const allocQty = Math.min(
            demand,
            bestFacility.capacity[product.id] - facilityLoads[bestFacility.id][product.id]
          );

          allocation.push({
            customerId: customer.id,
            customerName: customer.name,
            facilityId: bestFacility.id,
            facilityName: bestFacility.name,
            productId: product.id,
            productName: product.name,
            quantity: allocQty,
            distance: this.calculateDistance(
              bestFacility.latitude, bestFacility.longitude,
              customer.latitude, customer.longitude
            )
          });

          facilityLoads[bestFacility.id][product.id] += allocQty;
          customerDemands[customer.id][product.id] -= allocQty;
        }
      }
    }

    return allocation;
  }

  // Calculate KPIs for the allocation
  calculateKPIs(allocation) {
    const costPerKm = this.settings.transportCostPerKm || 0.5;
    const fixedCost = this.settings.fixedCostPerFacility || 10000;

    const totalCost = this.calculateAllocationCost(allocation, costPerKm, fixedCost);
    
    let totalDistance = 0;
    let totalQuantity = 0;
    const usedFacilities = new Set();
    const customerService = {};

    for (const alloc of allocation) {
      totalDistance += alloc.distance * alloc.quantity;
      totalQuantity += alloc.quantity;
      usedFacilities.add(alloc.facilityId);

      if (!customerService[alloc.customerId]) {
        customerService[alloc.customerId] = { fulfilled: 0, total: 0 };
      }
      customerService[alloc.customerId].fulfilled += alloc.quantity;
    }

    // Calculate service level
    for (const customer of this.customers) {
      if (!customerService[customer.id]) {
        customerService[customer.id] = { fulfilled: 0, total: 0 };
      }
      for (const product of this.products) {
        customerService[customer.id].total += customer.demand?.[product.id] || 0;
      }
    }

    const totalDemand = Object.values(customerService).reduce((sum, cs) => sum + cs.total, 0);
    const totalFulfilled = Object.values(customerService).reduce((sum, cs) => sum + cs.fulfilled, 0);
    const serviceLevel = totalDemand > 0 ? (totalFulfilled / totalDemand) * 100 : 0;

    return {
      totalCost,
      transportCost: totalCost - (usedFacilities.size * fixedCost),
      fixedCost: usedFacilities.size * fixedCost,
      totalDistance,
      avgDistance: totalQuantity > 0 ? totalDistance / totalQuantity : 0,
      facilitiesUsed: usedFacilities.size,
      serviceLevel,
      totalDemand,
      totalFulfilled,
      unmetDemand: totalDemand - totalFulfilled
    };
  }

  // Main optimization method
  optimize() {
    console.log(`Starting GFA optimization with ${this.customers.length} customers, ${this.facilities.length} facilities`);
    
    const allocation = this.optimizeGreedy();
    const kpis = this.calculateKPIs(allocation);

    return {
      allocation,
      kpis,
      summary: {
        totalAllocations: allocation.length,
        customersServed: new Set(allocation.map(a => a.customerId)).size,
        facilitiesUsed: kpis.facilitiesUsed
      }
    };
  }
}

export async function optimizeGFA(requestData) {
  try {
    const { data, settings } = requestData;
    
    const optimizer = new GFAOptimizer(data, settings);
    const result = optimizer.optimize();
    
    return {
      success: true,
      ...result
    };
  } catch (error) {
    console.error('GFA optimization error:', error);
    throw error;
  }
}
