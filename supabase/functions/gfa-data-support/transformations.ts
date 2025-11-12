// Data transformation execution logic

interface TransformationPlan {
  description: string;
  operations: Array<{
    type: string;
    details: string;
  }>;
  affectedData: string[];
}

export function executeDataTransformation(plan: TransformationPlan, currentData: any): any {
  const result: any = {};
  
  // Clone current data to avoid mutations
  if (currentData.customers) result.customers = JSON.parse(JSON.stringify(currentData.customers));
  if (currentData.products) result.products = JSON.parse(JSON.stringify(currentData.products));
  if (currentData.existingSites) result.existingSites = JSON.parse(JSON.stringify(currentData.existingSites));
  if (currentData.settings) result.settings = JSON.parse(JSON.stringify(currentData.settings));

  console.log("Executing transformation plan:", plan);
  console.log("Operations count:", plan.operations.length);

  // Execute each operation
  for (const operation of plan.operations) {
    const { type, details } = operation;
    console.log(`Executing operation: ${type} - ${details}`);
    
    // Handle demand multiplication and updates
    if (type === "MULTIPLY" || type === "UPDATE") {
      const lowerDetails = details.toLowerCase();
      
      // Check for SQL-style multiplication: "demand = demand * X" or "demand * X"
      const multiplicationMatch = details.match(/demand\s*(?:=\s*demand\s*)?\*\s*(\d+\.?\d*)/i);
      if (multiplicationMatch && result.customers) {
        const multiplier = parseFloat(multiplicationMatch[1]);
        console.log(`Multiplying all customer demand by ${multiplier} (from SQL pattern)`);
        result.customers = result.customers.map((c: any) => ({
          ...c,
          demand: c.demand * multiplier
        }));
        console.log(`Updated ${result.customers.length} customers with multiplier ${multiplier}`);
        continue;
      }
      
      // Handle SETTING demand to a fixed value (not multiplying): "demand = 100"
      const fixedDemandMatch = details.match(/demand\s*=\s*(\d+\.?\d*)(?:\s|$)/i);
      if (fixedDemandMatch && !details.match(/demand\s*\*/i) && result.customers) {
        const fixedDemand = parseFloat(fixedDemandMatch[1]);
        console.log(`Setting all customer demand to fixed value: ${fixedDemand}`);
        result.customers = result.customers.map((c: any) => ({
          ...c,
          demand: fixedDemand
        }));
        console.log(`Set demand to ${fixedDemand} for ${result.customers.length} customers`);
        continue;
      }
      
      // Handle natural language with percentages: "increase all customer demand by 50%"
      if (lowerDetails.includes("customer") && lowerDetails.includes("demand")) {
        const percentMatch = details.match(/(\d+\.?\d*)%/);
        if (percentMatch) {
          const percentage = parseFloat(percentMatch[1]);
          const isIncrease = lowerDetails.includes("increase") || lowerDetails.includes("raise");
          const isDecrease = lowerDetails.includes("decrease") || lowerDetails.includes("reduce");
          
          let multiplier = 1;
          if (isIncrease) {
            multiplier = 1 + (percentage / 100);
          } else if (isDecrease) {
            multiplier = 1 - (percentage / 100);
          } else {
            // Default to increase if not specified
            multiplier = 1 + (percentage / 100);
          }
          
          console.log(`Multiplying all customer demand by ${multiplier} (from ${percentage}% change)`);
          result.customers = result.customers.map((c: any) => ({
            ...c,
            demand: c.demand * multiplier
          }));
          console.log(`Updated ${result.customers.length} customers`);
          continue;
        }
      }
      // Handle specific product demand changes
      else if (details.toLowerCase().includes("product") && result.customers) {
        const productMatch = details.match(/product\s+['"]?([^'"]+?)['"]?\s/i);
        const percentMatch = details.match(/(\d+\.?\d*)%/);
        if (productMatch && percentMatch) {
          const productName = productMatch[1].trim();
          const percentage = parseFloat(percentMatch[0]);
          const multiplier = 1 + (percentage / 100);
          console.log(`Updating demand for product "${productName}" by ${multiplier}`);
          
          result.customers = result.customers.map((c: any) => {
            if (c.product && c.product.toLowerCase().includes(productName.toLowerCase())) {
              return { ...c, demand: c.demand * multiplier };
            }
            return c;
          });
        }
      }
      // Handle specific country changes
      else if (details.toLowerCase().includes("country") && result.customers) {
        const countryMatch = details.match(/country\s+['"]?([^'"]+?)['"]?\s/i) || details.match(/in\s+([A-Z][a-z]+)/);
        const percentMatch = details.match(/(\d+\.?\d*)%/);
        if (countryMatch && percentMatch) {
          const countryName = countryMatch[1].trim();
          const percentage = parseFloat(percentMatch[0]);
          const multiplier = 1 + (percentage / 100);
          console.log(`Updating demand for country "${countryName}" by ${multiplier}`);
          
          result.customers = result.customers.map((c: any) => {
            if (c.country && c.country.toLowerCase().includes(countryName.toLowerCase())) {
              return { ...c, demand: c.demand * multiplier };
            }
            return c;
          });
        }
      }
      // Handle settings/cost parameters updates
      else if (details.toLowerCase().includes("capacity") || 
               details.toLowerCase().includes("transportation") || 
               details.toLowerCase().includes("facility") ||
               details.toLowerCase().includes("cost") ||
               details.toLowerCase().includes("setting")) {
        
        if (result.settings) {
          // Extract numeric value
          const numberMatch = details.match(/(\d+\.?\d*)/);
          const value = numberMatch ? parseFloat(numberMatch[0]) : null;
          
          if (details.toLowerCase().includes("capacity") && value !== null) {
            result.settings.dcCapacity = value;
            console.log(`Updated DC capacity to ${value}`);
          } 
          else if ((details.toLowerCase().includes("numdc") || details.toLowerCase().includes("number of")) && value !== null) {
            result.settings.numDCs = Math.floor(value);
            console.log(`Updated number of DCs to ${value}`);
          }
          else if (details.toLowerCase().includes("transportation") && details.toLowerCase().includes("cost") && value !== null) {
            result.settings.transportationCostPerMilePerUnit = value;
            console.log(`Updated transportation cost to ${value}`);
          }
          else if (details.toLowerCase().includes("facility") && details.toLowerCase().includes("cost") && value !== null) {
            result.settings.facilityCost = value;
            console.log(`Updated facility cost to ${value}`);
          }
          
          // Handle unit changes
          const unitMatch = details.match(/unit[:\s]+['"]?([^'"\s]+)['"]?/i);
          if (unitMatch) {
            const unit = unitMatch[1].toLowerCase();
            if (details.toLowerCase().includes("distance")) {
              result.settings.distanceUnit = unit;
              console.log(`Updated distance unit to ${unit}`);
            } else if (details.toLowerCase().includes("capacity")) {
              result.settings.capacityUnit = unit;
              console.log(`Updated capacity unit to ${unit}`);
            } else if (details.toLowerCase().includes("cost")) {
              result.settings.costUnit = unit;
              console.log(`Updated cost unit to ${unit}`);
            }
          }
        }
      }
    }
    
    else if (type === "INSERT" || type === "ADD") {
      // Handle adding new customers
      if (details.toLowerCase().includes("customer") && result.customers) {
        const numberMatch = details.match(/(\d+)/);
        const countryMatch = details.match(/in\s+([A-Z][a-z]+)/i) || details.match(/country[:\s]+([A-Z][a-z]+)/i);
        
        if (numberMatch) {
          const count = parseInt(numberMatch[0]);
          const country = countryMatch ? countryMatch[1] : "Unknown";
          const defaultProduct = result.products?.[0]?.name || "Product";
          const defaultUnit = result.products?.[0]?.baseUnit || "unit";
          
          console.log(`Adding ${count} new customers in ${country}`);
          
          for (let i = 0; i < count; i++) {
            const newCustomer = {
              id: `new-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
              name: `New Customer ${i + 1}`,
              city: "To Be Determined",
              country: country,
              latitude: 0,
              longitude: 0,
              demand: 100,
              product: defaultProduct,
              unitOfMeasure: defaultUnit,
              conversionFactor: 1
            };
            result.customers.push(newCustomer);
          }
          console.log(`Added ${count} customers, total now: ${result.customers.length}`);
        }
      }
      
      // Handle adding existing sites - parse SQL INSERT or natural language
      else if (details.toLowerCase().includes("existing") && details.toLowerCase().includes("site")) {
        if (!result.existingSites) result.existingSites = [];
        
        // Try SQL INSERT pattern: INSERT INTO existingSites (lat, lng, city, country) VALUES (lat, lng, 'city', 'country')
        const sqlMatch = details.match(/VALUES\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/i);
        if (sqlMatch) {
          const [_, lat, lng, city, country] = sqlMatch;
          const newSite = {
            id: `new-site-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: `${city} Site`,
            city: city,
            country: country,
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            capacity: result.settings?.dcCapacity || 1000,
            capacityUnit: result.settings?.capacityUnit || "m3"
          };
          result.existingSites.push(newSite);
          console.log(`Added existing site: ${city}, ${country} at (${lat}, ${lng})`);
        } else {
          // Fallback: natural language pattern
          const cityMatch = details.match(/in\s+([A-Z][a-z]+)/i) || details.match(/city[:\s]+([A-Z][a-z]+)/i);
          const latMatch = details.match(/lat(?:itude)?[:\s]+([-\d.]+)/i);
          const lngMatch = details.match(/lon(?:g|gitude)?[:\s]+([-\d.]+)/i);
          
          if (cityMatch) {
            const city = cityMatch[1];
            const newSite = {
              id: `new-site-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: `${city} Site`,
              city: city,
              country: "To Be Determined",
              latitude: latMatch ? parseFloat(latMatch[1]) : 0,
              longitude: lngMatch ? parseFloat(lngMatch[1]) : 0,
              capacity: result.settings?.dcCapacity || 1000,
              capacityUnit: result.settings?.capacityUnit || "m3"
            };
            result.existingSites.push(newSite);
            console.log(`Added existing site in ${city}`);
          }
        }
      }
      
      // Handle adding products - parse SQL INSERT or natural language
      else if (details.toLowerCase().includes("product")) {
        if (!result.products) result.products = [];
        
        // Try SQL INSERT pattern: INSERT INTO products (name, baseUnit) VALUES ('name', 'unit')
        const sqlMatch = details.match(/VALUES\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/i);
        if (sqlMatch) {
          const [_, name, baseUnit] = sqlMatch;
          const newProduct = {
            name: name,
            baseUnit: baseUnit,
            sellingPrice: 100,
            unitConversions: {}
          };
          result.products.push(newProduct);
          console.log(`Added product: ${name} with base unit ${baseUnit}`);
        } else {
          // Fallback: extract product name
          const nameMatch = details.match(/product\s+['"]?([^'"]+?)['"]?/i);
          const unitMatch = details.match(/unit[:\s]+['"]?([^'"\s]+)['"]?/i);
          
          if (nameMatch) {
            const productName = nameMatch[1].trim();
            const baseUnit = unitMatch ? unitMatch[1].trim() : "unit";
            const newProduct = {
              name: productName,
              baseUnit: baseUnit,
              sellingPrice: 100,
              unitConversions: {}
            };
            result.products.push(newProduct);
            console.log(`Added product: ${productName} with unit ${baseUnit}`);
          }
        }
      }
    }
    
    else if (type === "DELETE" || type === "REMOVE") {
      const lowerDetails = details.toLowerCase();
      
      // Handle removing ALL customers
      if (lowerDetails.includes("customer") && result.customers) {
        const initialCount = result.customers.length;
        
        // Check for "delete all" or "DELETE FROM customers" patterns
        if (lowerDetails.includes("all") || lowerDetails.match(/delete\s+from\s+customers/i)) {
          result.customers = [];
          console.log(`Removed all ${initialCount} customers`);
        } else {
          // Handle specific deletions
          const idMatch = details.match(/id[:\s]+['"]?([^'"\s]+)['"]?/i);
          const cityMatch = details.match(/city[:\s]+['"]?([^'"\s]+)['"]?/i);
          const countryMatch = details.match(/country[:\s]+['"]?([^'"\s]+)['"]?/i);
          
          if (idMatch) {
            result.customers = result.customers.filter((c: any) => c.id !== idMatch[1]);
          } else if (cityMatch) {
            result.customers = result.customers.filter((c: any) => 
              !c.city.toLowerCase().includes(cityMatch[1].toLowerCase())
            );
          } else if (countryMatch) {
            result.customers = result.customers.filter((c: any) => 
              !c.country.toLowerCase().includes(countryMatch[1].toLowerCase())
            );
          }
          console.log(`Removed ${initialCount - result.customers.length} customers`);
        }
      }
      
      // Handle removing products
      else if (lowerDetails.includes("product") && result.products) {
        const initialCount = result.products.length;
        
        if (lowerDetails.includes("all") || lowerDetails.match(/delete\s+from\s+products/i)) {
          result.products = [];
          console.log(`Removed all ${initialCount} products`);
        } else {
          const nameMatch = details.match(/product\s+['"]?([^'"]+?)['"]?/i);
          if (nameMatch) {
            const productName = nameMatch[1].trim();
            result.products = result.products.filter((p: any) => 
              !p.name.toLowerCase().includes(productName.toLowerCase())
            );
            console.log(`Removed products matching "${productName}"`);
          }
        }
      }
      
      // Handle removing existing sites
      else if (lowerDetails.includes("existing") && lowerDetails.includes("site") && result.existingSites) {
        const initialCount = result.existingSites.length;
        
        if (lowerDetails.includes("all") || lowerDetails.match(/delete\s+from\s+existingsites/i)) {
          result.existingSites = [];
          console.log(`Removed all ${initialCount} existing sites`);
        } else {
          const cityMatch = details.match(/city[:\s]+['"]?([^'"\s]+)['"]?/i);
          if (cityMatch) {
            result.existingSites = result.existingSites.filter((s: any) => 
              !s.city.toLowerCase().includes(cityMatch[1].toLowerCase())
            );
            console.log(`Removed existing sites in ${cityMatch[1]}`);
          }
        }
      }
    }
    
    // Handle renaming/updating product names
    else if (type === "RENAME" || (type === "UPDATE" && details.toLowerCase().includes("product") && details.toLowerCase().includes("name"))) {
      if (result.products) {
        // Pattern: UPDATE products SET name = 'newName' WHERE name = 'oldName'
        // Or: Rename product 'oldName' to 'newName'
        const sqlMatch = details.match(/name\s*=\s*['"]([^'"]+)['"]\s+WHERE\s+name\s*=\s*['"]([^'"]+)['"]/i);
        const naturalMatch = details.match(/rename\s+product\s+['"]?([^'"]+?)['"]?\s+to\s+['"]?([^'"]+?)['"]?/i);
        
        if (sqlMatch) {
          const [_, newName, oldName] = sqlMatch;
          result.products = result.products.map((p: any) => 
            p.name.toLowerCase() === oldName.toLowerCase() ? { ...p, name: newName } : p
          );
          console.log(`Renamed product "${oldName}" to "${newName}"`);
        } else if (naturalMatch) {
          const [_, oldName, newName] = naturalMatch;
          result.products = result.products.map((p: any) => 
            p.name.toLowerCase() === oldName.toLowerCase() ? { ...p, name: newName } : p
          );
          console.log(`Renamed product "${oldName}" to "${newName}"`);
        }
      }
    }
  }
  
  console.log("Transformation complete. Final data:", {
    customersCount: result.customers?.length || 0,
    productsCount: result.products?.length || 0,
    existingSitesCount: result.existingSites?.length || 0
  });
  
  return result;
}

