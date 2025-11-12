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

  // Execute each operation
  for (const operation of plan.operations) {
    const { type, details } = operation;
    
    // Parse the operation details to understand what to do
    if (type === "MULTIPLY" || type === "UPDATE") {
      // Handle demand multiplication
      if (details.toLowerCase().includes("demand") && details.toLowerCase().includes("multiply")) {
        const match = details.match(/(\d+\.?\d*)/);
        if (match && result.customers) {
          const multiplier = parseFloat(match[0]);
          result.customers = result.customers.map((c: any) => ({
            ...c,
            demand: c.demand * multiplier
          }));
        }
      }
      
      // Handle specific product demand changes
      if (details.toLowerCase().includes("product") && result.customers) {
        const productMatch = details.match(/product\s+['"]?(\w+)['"]?/i);
        const numberMatch = details.match(/(\d+\.?\d*)%?/);
        if (productMatch && numberMatch) {
          const productName = productMatch[1];
          const percentage = parseFloat(numberMatch[0]);
          const multiplier = percentage > 10 ? percentage / 100 : 1 + (percentage / 100);
          
          result.customers = result.customers.map((c: any) => {
            if (c.product.toLowerCase().includes(productName.toLowerCase())) {
              return { ...c, demand: c.demand * multiplier };
            }
            return c;
          });
        }
      }

      // Handle specific country changes
      if (details.toLowerCase().includes("country") && result.customers) {
        const countryMatch = details.match(/country\s+['"]?(\w+)['"]?/i);
        const numberMatch = details.match(/(\d+\.?\d*)%?/);
        if (countryMatch && numberMatch) {
          const countryName = countryMatch[1];
          const percentage = parseFloat(numberMatch[0]);
          const multiplier = 1 + (percentage / 100);
          
          result.customers = result.customers.map((c: any) => {
            if (c.country.toLowerCase().includes(countryName.toLowerCase())) {
              return { ...c, demand: c.demand * multiplier };
            }
            return c;
          });
        }
      }
      
      // Handle settings updates
      if (details.toLowerCase().includes("settings") || details.toLowerCase().includes("capacity")) {
        const numberMatch = details.match(/(\d+\.?\d*)/);
        if (numberMatch && result.settings) {
          const value = parseFloat(numberMatch[0]);
          if (details.toLowerCase().includes("capacity")) {
            result.settings.dcCapacity = value;
          } else if (details.toLowerCase().includes("numdc") || details.toLowerCase().includes("number")) {
            result.settings.numDCs = Math.floor(value);
          }
        }
      }
    }
    
    else if (type === "INSERT" || type === "ADD") {
      // Handle adding new customers
      if (details.toLowerCase().includes("customer") && result.customers) {
        const numberMatch = details.match(/(\d+)/);
        const countryMatch = details.match(/in\s+(\w+)/i) || details.match(/country[:\s]+(\w+)/i);
        
        if (numberMatch) {
          const count = parseInt(numberMatch[0]);
          const country = countryMatch ? countryMatch[1] : "Unknown";
          
          for (let i = 0; i < count; i++) {
            const newCustomer = {
              id: `new-${Date.now()}-${i}`,
              name: `New Customer ${i + 1}`,
              city: "To Be Determined",
              country: country,
              latitude: 0,
              longitude: 0,
              demand: 100,
              product: result.products?.[0]?.name || "Product",
              unitOfMeasure: result.products?.[0]?.baseUnit || "unit",
              conversionFactor: 1
            };
            result.customers.push(newCustomer);
          }
        }
      }
      
      // Handle adding existing sites
      if (details.toLowerCase().includes("existing site") && result.existingSites) {
        const cityMatch = details.match(/in\s+(\w+)/i) || details.match(/city[:\s]+(\w+)/i);
        
        if (cityMatch) {
          const city = cityMatch[1];
          const newSite = {
            id: `new-site-${Date.now()}`,
            name: `${city} Site`,
            city: city,
            country: "To Be Determined",
            latitude: 0,
            longitude: 0,
            capacity: result.settings?.dcCapacity || 1000,
            capacityUnit: result.settings?.capacityUnit || "m3"
          };
          result.existingSites.push(newSite);
        }
      }
      
      // Handle adding products
      if (details.toLowerCase().includes("product") && result.products) {
        const nameMatch = details.match(/product\s+['"]?(\w+)['"]?/i);
        
        if (nameMatch) {
          const productName = nameMatch[1];
          const newProduct = {
            name: productName,
            baseUnit: "unit",
            sellingPrice: 100,
            unitConversions: {}
          };
          result.products.push(newProduct);
        }
      }
    }
    
    else if (type === "DELETE" || type === "REMOVE") {
      // Handle removing customers
      if (details.toLowerCase().includes("customer") && result.customers) {
        const idMatch = details.match(/id[:\s]+['"]?(\w+-?\w*)['"]?/i);
        const cityMatch = details.match(/city[:\s]+['"]?(\w+)['"]?/i);
        const countryMatch = details.match(/country[:\s]+['"]?(\w+)['"]?/i);
        
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
      }
    }
  }
  
  return result;
}
