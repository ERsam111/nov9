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
      // Handle SETTING demand to a fixed value (not multiplying)
      if (details.toLowerCase().includes("set") || details.toLowerCase().includes("demand = ")) {
        const demandMatch = details.match(/demand\s*=\s*(\d+\.?\d*)/i);
        if (demandMatch && result.customers) {
          const fixedDemand = parseFloat(demandMatch[1]);
          console.log(`Setting all customer demand to fixed value: ${fixedDemand}`);
          result.customers = result.customers.map((c: any) => ({
            ...c,
            demand: fixedDemand
          }));
          console.log(`Set demand to ${fixedDemand} for ${result.customers.length} customers`);
          continue; // Skip to next operation
        }
      }
      
      // Handle ALL customer demand multiplication (most common case)
      if (details.toLowerCase().includes("all") && details.toLowerCase().includes("customer") && details.toLowerCase().includes("demand")) {
        const percentMatch = details.match(/(\d+\.?\d*)%/);
        if (percentMatch && result.customers) {
          const percentage = parseFloat(percentMatch[0]);
          const multiplier = 1 + (percentage / 100);
          console.log(`Multiplying all customer demand by ${multiplier}`);
          result.customers = result.customers.map((c: any) => ({
            ...c,
            demand: c.demand * multiplier
          }));
          console.log(`Updated ${result.customers.length} customers`);
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
      // Handle settings updates
      else if (details.toLowerCase().includes("capacity") || details.toLowerCase().includes("setting")) {
        const numberMatch = details.match(/(\d+\.?\d*)/);
        if (numberMatch && result.settings) {
          const value = parseFloat(numberMatch[0]);
          if (details.toLowerCase().includes("capacity")) {
            result.settings.dcCapacity = value;
            console.log(`Updated DC capacity to ${value}`);
          } else if (details.toLowerCase().includes("numdc") || details.toLowerCase().includes("number of")) {
            result.settings.numDCs = Math.floor(value);
            console.log(`Updated number of DCs to ${value}`);
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
      
      // Handle adding existing sites
      else if (details.toLowerCase().includes("existing site") || details.toLowerCase().includes("site")) {
        if (!result.existingSites) result.existingSites = [];
        
        const cityMatch = details.match(/in\s+([A-Z][a-z]+)/i) || details.match(/city[:\s]+([A-Z][a-z]+)/i);
        
        if (cityMatch) {
          const city = cityMatch[1];
          const newSite = {
            id: `new-site-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: `${city} Site`,
            city: city,
            country: "To Be Determined",
            latitude: 0,
            longitude: 0,
            capacity: result.settings?.dcCapacity || 1000,
            capacityUnit: result.settings?.capacityUnit || "m3"
          };
          result.existingSites.push(newSite);
          console.log(`Added existing site in ${city}`);
        }
      }
      
      // Handle adding products
      else if (details.toLowerCase().includes("product")) {
        if (!result.products) result.products = [];
        
        const nameMatch = details.match(/product\s+['"]?([^'"]+?)['"]?/i);
        
        if (nameMatch) {
          const productName = nameMatch[1].trim();
          const newProduct = {
            name: productName,
            baseUnit: "unit",
            sellingPrice: 100,
            unitConversions: {}
          };
          result.products.push(newProduct);
          console.log(`Added product: ${productName}`);
        }
      }
    }
    
    else if (type === "DELETE" || type === "REMOVE") {
      // Handle removing customers
      if (details.toLowerCase().includes("customer") && result.customers) {
        const initialCount = result.customers.length;
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
  }
  
  console.log("Transformation complete. Final data:", {
    customersCount: result.customers?.length || 0,
    productsCount: result.products?.length || 0,
    existingSitesCount: result.existingSites?.length || 0
  });
  
  return result;
}

