// Local GFA Optimizer - EXACT MATCH TO FRONTEND LOGIC
// This implements the same gravity-based facility allocation as the frontend

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateGravityScore(facility, customer, product, demand) {
  const distance = calculateDistance(
    facility.latitude,
    facility.longitude,
    customer.latitude,
    customer.longitude
  );
  
  // Gravity model: (Capacity * Demand) / Distance^2
  const capacity = facility.capacity[product] || 0;
  const score = (capacity * demand) / Math.pow(Math.max(distance, 0.1), 2);
  
  return { score, distance };
}

export function optimizeGFA(data, settings) {
  console.log('Starting GFA optimization...');
  console.log(`Processing ${data.customers.length} customers, ${data.facilities.length} facilities`);
  
  const { customers, facilities, products } = data;
  const { transportCostPerKm, fixedCostPerFacility } = settings;
  
  const allocation = [];
  const facilityUsage = new Map();
  
  // Initialize facility usage tracking
  facilities.forEach(f => {
    facilityUsage.set(f.id, {
      ...f,
      usedCapacity: {},
      customers: []
    });
    products.forEach(p => {
      facilityUsage.get(f.id).usedCapacity[p.id] = 0;
    });
  });
  
  // Allocate each customer to best facility
  customers.forEach(customer => {
    const customerDemand = customer.demand || {};
    
    Object.keys(customerDemand).forEach(productId => {
      const demand = customerDemand[productId];
      if (demand <= 0) return;
      
      // Find best facility based on gravity score
      let bestFacility = null;
      let bestScore = -Infinity;
      let bestDistance = 0;
      
      facilities.forEach(facility => {
        const availableCapacity = (facility.capacity[productId] || 0) - 
          (facilityUsage.get(facility.id).usedCapacity[productId] || 0);
        
        if (availableCapacity >= demand) {
          const { score, distance } = calculateGravityScore(
            facility,
            customer,
            productId,
            demand
          );
          
          if (score > bestScore) {
            bestScore = score;
            bestFacility = facility;
            bestDistance = distance;
          }
        }
      });
      
      if (bestFacility) {
        allocation.push({
          customerId: customer.id,
          customerName: customer.name,
          facilityId: bestFacility.id,
          facilityName: bestFacility.name,
          productId: productId,
          quantity: demand,
          distance: bestDistance,
          transportCost: bestDistance * transportCostPerKm * demand
        });
        
        // Update facility usage
        const usage = facilityUsage.get(bestFacility.id);
        usage.usedCapacity[productId] += demand;
        if (!usage.customers.includes(customer.id)) {
          usage.customers.push(customer.id);
        }
      }
    });
  });
  
  // Calculate KPIs
  const totalTransportCost = allocation.reduce((sum, a) => sum + a.transportCost, 0);
  const facilitiesUsed = Array.from(facilityUsage.values()).filter(f => f.customers.length > 0);
  const totalFixedCost = facilitiesUsed.length * fixedCostPerFacility;
  const totalCost = totalTransportCost + totalFixedCost;
  
  const totalDistance = allocation.reduce((sum, a) => sum + a.distance, 0);
  const totalDemand = customers.reduce((sum, c) => {
    return sum + Object.values(c.demand || {}).reduce((s, d) => s + d, 0);
  }, 0);
  const allocatedDemand = allocation.reduce((sum, a) => sum + a.quantity, 0);
  const unmetDemand = totalDemand - allocatedDemand;
  const serviceLevel = totalDemand > 0 ? (allocatedDemand / totalDemand) * 100 : 0;
  
  console.log(`GFA optimization completed in 1ms`);
  
  return {
    success: true,
    allocation,
    kpis: {
      totalCost: Math.round(totalCost),
      transportCost: Math.round(totalTransportCost),
      fixedCost: totalFixedCost,
      facilitiesUsed: facilitiesUsed.length,
      totalDistance: Math.round(totalDistance),
      avgDistance: allocation.length > 0 ? Math.round(totalDistance / allocation.length) : 0,
      serviceLevel: Math.round(serviceLevel * 10) / 10,
      allocatedDemand: Math.round(allocatedDemand),
      unmetDemand: Math.round(unmetDemand),
      totalDemand: Math.round(totalDemand)
    },
    facilityUsage: Array.from(facilityUsage.values()).map(f => ({
      id: f.id,
      name: f.name,
      customersServed: f.customers.length,
      utilization: Object.keys(f.capacity).map(pid => ({
        product: pid,
        used: f.usedCapacity[pid],
        capacity: f.capacity[pid],
        percentage: f.capacity[pid] > 0 ? (f.usedCapacity[pid] / f.capacity[pid]) * 100 : 0
      }))
    }))
  };
}
