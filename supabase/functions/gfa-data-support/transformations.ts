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
          // Check for multiplication pattern: "field = field * X" or "field * X"
          const multiplyMatch = details.match(/(capacity|transportationCostPerMilePerUnit|facilityCost|numDCs)\s*(?:=\s*\1\s*)?\*\s*(\d+\.?\d*)/i);
          
          if (multiplyMatch) {
            const field = multiplyMatch[1];
            const multiplier = parseFloat(multiplyMatch[2]);
            
            if (field.toLowerCase().includes('capacity') && result.settings.dcCapacity !== undefined) {
              result.settings.dcCapacity *= multiplier;
              console.log(`Multiplied DC capacity by ${multiplier}, new value: ${result.settings.dcCapacity}`);
            } else if (field.toLowerCase().includes('transportation') && result.settings.transportationCostPerMilePerUnit !== undefined) {
              result.settings.transportationCostPerMilePerUnit *= multiplier;
              console.log(`Multiplied transportation cost by ${multiplier}, new value: ${result.settings.transportationCostPerMilePerUnit}`);
            } else if (field.toLowerCase().includes('facility') && result.settings.facilityCost !== undefined) {
              result.settings.facilityCost *= multiplier;
              console.log(`Multiplied facility cost by ${multiplier}, new value: ${result.settings.facilityCost}`);
            }
          } else {
            // Handle direct value assignment: "field = X"
            const assignMatch = details.match(/(capacity|transportationCostPerMilePerUnit|facilityCost|numDCs)\s*=\s*(\d+\.?\d*)/i);
            
            if (assignMatch) {
              const field = assignMatch[1];
              const value = parseFloat(assignMatch[2]);
              
              if (field.toLowerCase().includes('capacity')) {
                result.settings.dcCapacity = value;
                console.log(`Set DC capacity to ${value}`);
              } else if (field.toLowerCase().includes('transportation')) {
                result.settings.transportationCostPerMilePerUnit = value;
                console.log(`Set transportation cost to ${value}`);
              } else if (field.toLowerCase().includes('facility')) {
                result.settings.facilityCost = value;
                console.log(`Set facility cost to ${value}`);
              } else if (field.toLowerCase().includes('numdc')) {
                result.settings.numDCs = Math.floor(value);
                console.log(`Set number of DCs to ${value}`);
              }
            }
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
      // Handle product selling price updates - match both "selling price" and "sellingPrice"
      else if ((details.toLowerCase().includes("sellingprice") || 
                (details.toLowerCase().includes("selling") && details.toLowerCase().includes("price"))) && 
               result.products) {
        
        // Try SQL pattern first: "SET sellingPrice = 10" or "sellingPrice = 10"
        const sqlPriceMatch = details.match(/sellingPrice\s*=\s*(\d+\.?\d*)/i);
        // Try WHERE clause for specific product: "WHERE name = 'ProductName'"
        const whereNameMatch = details.match(/WHERE\s+name\s*=\s*['"]([^'"]+)['"]/i);
        
        if (sqlPriceMatch) {
          const price = parseFloat(sqlPriceMatch[1]);
          
          if (whereNameMatch) {
            // Update specific product by exact name match
            const productName = whereNameMatch[1].trim();
            result.products = result.products.map((p: any) => 
              p.name.toLowerCase() === productName.toLowerCase()
                ? { ...p, sellingPrice: price } 
                : p
            );
            console.log(`Updated selling price for product "${productName}" to ${price}`);
          } else {
            // Update all products
            result.products = result.products.map((p: any) => ({ ...p, sellingPrice: price }));
            console.log(`Updated selling price for all products to ${price}`);
          }
        } else {
          // Fall back to natural language pattern
          const priceMatch = details.match(/(\d+\.?\d*)/);
          const productMatch = details.match(/product\s+['"]?([^'"]+?)['"]?\s/i);
          
          if (priceMatch) {
            const price = parseFloat(priceMatch[0]);
            
            if (productMatch) {
              const productName = productMatch[1].trim();
              result.products = result.products.map((p: any) => 
                p.name.toLowerCase().includes(productName.toLowerCase()) 
                  ? { ...p, sellingPrice: price } 
                  : p
              );
              console.log(`Updated selling price for product "${productName}" to ${price}`);
            } else {
              result.products = result.products.map((p: any) => ({ ...p, sellingPrice: price }));
              console.log(`Updated selling price for all products to ${price}`);
            }
          }
        }
      }
      // Handle latitude/longitude updates
      else if ((details.toLowerCase().includes("latitude") || details.toLowerCase().includes("longitude") || 
                details.toLowerCase().includes("lat") || details.toLowerCase().includes("long")) &&
               (result.customers || result.existingSites)) {
        
        const latMatch = details.match(/lat(?:itude)?[:\s]+(-?\d+\.?\d*)/i);
        const longMatch = details.match(/long(?:itude)?[:\s]+(-?\d+\.?\d*)/i);
        const nameMatch = details.match(/(?:customer|site)\s+['"]?([^'"]+?)['"]?\s/i);
        
        if (latMatch || longMatch) {
          const lat = latMatch ? parseFloat(latMatch[1]) : null;
          const long = longMatch ? parseFloat(longMatch[1]) : null;
          
          if (details.toLowerCase().includes("customer") && result.customers) {
            if (nameMatch) {
              const name = nameMatch[1].trim();
              result.customers = result.customers.map((c: any) => {
                if (c.name.toLowerCase().includes(name.toLowerCase())) {
                  return {
                    ...c,
                    ...(lat !== null && { latitude: lat }),
                    ...(long !== null && { longitude: long })
                  };
                }
                return c;
              });
              console.log(`Updated coordinates for customer "${name}"`);
            } else {
              result.customers = result.customers.map((c: any) => ({
                ...c,
                ...(lat !== null && { latitude: lat }),
                ...(long !== null && { longitude: long })
              }));
              console.log(`Updated coordinates for all customers`);
            }
          }
          
          if (details.toLowerCase().includes("site") && result.existingSites) {
            if (nameMatch) {
              const name = nameMatch[1].trim();
              result.existingSites = result.existingSites.map((s: any) => {
                if (s.name.toLowerCase().includes(name.toLowerCase())) {
                  return {
                    ...s,
                    ...(lat !== null && { latitude: lat }),
                    ...(long !== null && { longitude: long })
                  };
                }
                return s;
              });
              console.log(`Updated coordinates for site "${name}"`);
            }
          }
        }
      }
      // Handle city/country updates
      else if ((details.toLowerCase().includes("city") || details.toLowerCase().includes("country")) &&
               !details.toLowerCase().includes("demand") &&
               (result.customers || result.existingSites)) {
        
        const cityMatch = details.match(/city[:\s]+['"]?([^'"\n]+?)['"]?(?:\s|$)/i);
        const countryMatch = details.match(/country[:\s]+['"]?([^'"\n]+?)['"]?(?:\s|$)/i);
        const nameMatch = details.match(/(?:customer|site)\s+['"]?([^'"]+?)['"]?\s/i);
        
        if (cityMatch || countryMatch) {
          const city = cityMatch ? cityMatch[1].trim() : null;
          const country = countryMatch ? countryMatch[1].trim() : null;
          
          if (details.toLowerCase().includes("customer") && result.customers) {
            if (nameMatch) {
              const name = nameMatch[1].trim();
              result.customers = result.customers.map((c: any) => {
                if (c.name.toLowerCase().includes(name.toLowerCase())) {
                  return {
                    ...c,
                    ...(city && { city }),
                    ...(country && { country })
                  };
                }
                return c;
              });
              console.log(`Updated location for customer "${name}"`);
            } else {
              result.customers = result.customers.map((c: any) => ({
                ...c,
                ...(city && { city }),
                ...(country && { country })
              }));
              console.log(`Updated location for all customers`);
            }
          }
          
          if (details.toLowerCase().includes("site") && result.existingSites) {
            if (nameMatch) {
              const name = nameMatch[1].trim();
              result.existingSites = result.existingSites.map((s: any) => {
                if (s.name.toLowerCase().includes(name.toLowerCase())) {
                  return {
                    ...s,
                    ...(city && { city }),
                    ...(country && { country })
                  };
                }
                return s;
              });
              console.log(`Updated location for site "${name}"`);
            }
          }
        }
      }
      // Handle unit conversion updates for products
      else if (details.toLowerCase().includes("unit") && details.toLowerCase().includes("conversion") && result.products) {
        const productMatch = details.match(/product\s+['"]?([^'"]+?)['"]?\s/i);
        const unitMatch = details.match(/(['"]?[a-zA-Z0-9_]+['"]?)\s*[=:]\s*(\d+\.?\d*)/i);
        
        if (unitMatch) {
          const unitName = unitMatch[1].replace(/['"]/g, '').trim();
          const conversionFactor = parseFloat(unitMatch[2]);
          
          if (productMatch) {
            const productName = productMatch[1].trim();
            result.products = result.products.map((p: any) => {
              if (p.name.toLowerCase().includes(productName.toLowerCase())) {
                return {
                  ...p,
                  unitConversions: {
                    ...(p.unitConversions || {}),
                    [unitName]: conversionFactor
                  }
                };
              }
              return p;
            });
            console.log(`Updated unit conversion for product "${productName}": ${unitName} = ${conversionFactor}`);
          } else {
            result.products = result.products.map((p: any) => ({
              ...p,
              unitConversions: {
                ...(p.unitConversions || {}),
                [unitName]: conversionFactor
              }
            }));
            console.log(`Updated unit conversion for all products: ${unitName} = ${conversionFactor}`);
          }
        }
      }
    }
    
    // INSERT, ADD, DELETE, and REMOVE operations are NOT ALLOWED
    // Transformations can only CHANGE existing data (UPDATE, MULTIPLY, RENAME)
    
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

