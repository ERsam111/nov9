// Transformation logic for forecasting historical data

interface TransformationPlan {
  description: string;
  operations: Array<{
    type: string;
    details: string;
  }>;
  affectedData: string[];
}

interface Calculation {
  type: 'calculation';
  operation: string;
  value: number;
}

// Parse SQL UPDATE statements
function parseSQLUpdate(sql: string): { table: string; updates: any; where?: any } | null {
  const updateMatch = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
  
  if (!updateMatch) return null;
  
  const table = updateMatch[1];
  const setClause = updateMatch[2];
  const whereClause = updateMatch[3];
  
  const updates: any = {};
  const setPattern = /(\w+)\s*=\s*([^,]+?)(?:,|$)/g;
  let match;
  
  while ((match = setPattern.exec(setClause)) !== null) {
    const field = match[1].trim();
    let value = match[2].trim();
    
    if ((value.startsWith("'") && value.endsWith("'")) || 
        (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    
    const calcMatch = value.match(/(\w+)\s*([\+\-\*\/])\s*(\d+\.?\d*)/);
    if (calcMatch) {
      updates[field] = {
        type: 'calculation',
        operation: calcMatch[2],
        value: parseFloat(calcMatch[3])
      };
    } else if (!isNaN(parseFloat(value))) {
      updates[field] = parseFloat(value);
    } else {
      updates[field] = value;
    }
  }
  
  let whereCondition = null;
  if (whereClause) {
    const whereMatch = whereClause.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/i);
    if (whereMatch) {
      whereCondition = {
        field: whereMatch[1].trim(),
        value: whereMatch[2].trim()
      };
    }
  }
  
  return { table, updates, where: whereCondition };
}

// Apply updates to data array
function applyUpdates(dataArray: any[], updates: any, whereCondition?: any): any[] {
  return dataArray.map(item => {
    if (whereCondition) {
      const fieldValue = String(item[whereCondition.field] || '').toLowerCase();
      const targetValue = String(whereCondition.value).toLowerCase();
      if (fieldValue !== targetValue) {
        return item;
      }
    }
    
    const updatedItem = { ...item };
    for (const [field, value] of Object.entries(updates)) {
      if (typeof value === 'object' && value !== null && 'type' in value && value.type === 'calculation') {
        const calc = value as unknown as Calculation;
        const currentValue = parseFloat(updatedItem[field]) || 0;
        switch (calc.operation) {
          case '*': updatedItem[field] = currentValue * calc.value; break;
          case '/': updatedItem[field] = currentValue / calc.value; break;
          case '+': updatedItem[field] = currentValue + calc.value; break;
          case '-': updatedItem[field] = currentValue - calc.value; break;
        }
      } else {
        updatedItem[field] = value;
      }
    }
    return updatedItem;
  });
}

export function executeDataTransformation(plan: TransformationPlan, currentData: any): any {
  const result: any = {};
  
  // Clone historical data
  if (currentData.historicalData) {
    result.historicalData = JSON.parse(JSON.stringify(currentData.historicalData));
    console.log(`Loaded ${result.historicalData.length} historical data points`);
  }

  console.log("Executing transformation plan:", plan);
  console.log("Operations count:", plan.operations.length);

  // Execute each operation
  for (const operation of plan.operations) {
    const { type, details } = operation;
    console.log(`Executing operation: ${type} - ${details}`);
    
    const sqlUpdate = parseSQLUpdate(details);
    
    if (sqlUpdate) {
      const { table, updates, where } = sqlUpdate;
      console.log(`Parsed SQL UPDATE for table: ${table}`, { updates, where });
      
      if (table.toLowerCase() === 'historicaldata' && result.historicalData) {
        result.historicalData = applyUpdates(result.historicalData, updates, where);
        console.log(`Updated ${result.historicalData.length} historical data points`);
        continue;
      }
    }
  }

  console.log("Transformation complete. Final data:", {
    historicalDataCount: result.historicalData?.length || 0
  });

  return result;
}
