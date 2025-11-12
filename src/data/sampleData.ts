import { Customer, Product, ExistingSite, OptimizationSettings } from "@/types/gfa";
import { HistoricalDataPoint } from "@/types/forecasting";

// GFA Sample Data
export const sampleGFACustomers: Customer[] = [
  { id: "C1", name: "TechMart Boston", product: "Electronics", city: "Boston", country: "USA", latitude: 42.3601, longitude: -71.0589, demand: 5000, unitOfMeasure: "m3", conversionFactor: 1 },
  { id: "C2", name: "ElectroStore NYC", product: "Electronics", city: "New York", country: "USA", latitude: 40.7128, longitude: -74.0060, demand: 8000, unitOfMeasure: "m3", conversionFactor: 1 },
  { id: "C3", name: "GadgetHub Philadelphia", product: "Electronics", city: "Philadelphia", country: "USA", latitude: 39.9526, longitude: -75.1652, demand: 4500, unitOfMeasure: "m3", conversionFactor: 1 },
  { id: "C4", name: "DeviceWorld Washington", product: "Electronics", city: "Washington", country: "USA", latitude: 38.9072, longitude: -77.0369, demand: 6000, unitOfMeasure: "m3", conversionFactor: 1 },
  { id: "C5", name: "TechZone Baltimore", product: "Electronics", city: "Baltimore", country: "USA", latitude: 39.2904, longitude: -76.6122, demand: 3500, unitOfMeasure: "m3", conversionFactor: 1 },
  { id: "C6", name: "SmartGear Pittsburgh", product: "Electronics", city: "Pittsburgh", country: "USA", latitude: 40.4406, longitude: -79.9959, demand: 4000, unitOfMeasure: "m3", conversionFactor: 1 },
  { id: "C7", name: "InnovateTech Buffalo", product: "Electronics", city: "Buffalo", country: "USA", latitude: 42.8864, longitude: -78.8784, demand: 2500, unitOfMeasure: "m3", conversionFactor: 1 },
  { id: "C8", name: "DigitalPlus Hartford", product: "Electronics", city: "Hartford", country: "USA", latitude: 41.7658, longitude: -72.6734, demand: 3000, unitOfMeasure: "m3", conversionFactor: 1 },
];

export const sampleGFAProducts: Product[] = [
  { name: "Laptop", baseUnit: "Units", sellingPrice: 1200, unitConversions: { to_m3: 0.05, to_kg: 2.5 } },
  { name: "Smartphone", baseUnit: "Units", sellingPrice: 800, unitConversions: { to_m3: 0.001, to_kg: 0.2 } },
  { name: "Tablet", baseUnit: "Units", sellingPrice: 600, unitConversions: { to_m3: 0.002, to_kg: 0.5 } },
  { name: "Monitor", baseUnit: "Units", sellingPrice: 400, unitConversions: { to_m3: 0.08, to_kg: 5.0 } },
];

export const sampleGFAExistingSites: ExistingSite[] = [
  { id: "E1", name: "Northeast Hub", city: "Boston", country: "USA", latitude: 42.3601, longitude: -71.0589, capacity: 15000, capacityUnit: "m3" },
  { id: "E2", name: "Mid-Atlantic Center", city: "Philadelphia", country: "USA", latitude: 39.9526, longitude: -75.1652, capacity: 12000, capacityUnit: "m3" },
];

export const sampleGFASettings: OptimizationSettings = {
  mode: 'sites',
  numDCs: 3,
  maxRadius: 500,
  demandPercentage: 100,
  dcCapacity: 20000,
  capacityUnit: 'm3',
  transportationCostPerMilePerUnit: 0.5,
  facilityCost: 250000,
  distanceUnit: 'km',
  costUnit: 'm3',
  includeExistingSites: false,
  existingSitesMode: 'potential'
};

// Demand Forecasting Sample Data
export const sampleForecastingData: HistoricalDataPoint[] = [
  // Product A - Monthly data for 24 months with seasonal pattern
  { date: new Date('2023-01-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 120, unitOfMeasure: 'units' },
  { date: new Date('2023-02-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 115, unitOfMeasure: 'units' },
  { date: new Date('2023-03-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 130, unitOfMeasure: 'units' },
  { date: new Date('2023-04-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 140, unitOfMeasure: 'units' },
  { date: new Date('2023-05-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 155, unitOfMeasure: 'units' },
  { date: new Date('2023-06-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 165, unitOfMeasure: 'units' },
  { date: new Date('2023-07-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 180, unitOfMeasure: 'units' },
  { date: new Date('2023-08-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 195, unitOfMeasure: 'units' },
  { date: new Date('2023-09-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 175, unitOfMeasure: 'units' },
  { date: new Date('2023-10-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 160, unitOfMeasure: 'units' },
  { date: new Date('2023-11-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 210, unitOfMeasure: 'units' },
  { date: new Date('2023-12-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 240, unitOfMeasure: 'units' },
  { date: new Date('2024-01-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 125, unitOfMeasure: 'units' },
  { date: new Date('2024-02-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 120, unitOfMeasure: 'units' },
  { date: new Date('2024-03-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 138, unitOfMeasure: 'units' },
  { date: new Date('2024-04-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 148, unitOfMeasure: 'units' },
  { date: new Date('2024-05-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 162, unitOfMeasure: 'units' },
  { date: new Date('2024-06-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 172, unitOfMeasure: 'units' },
  { date: new Date('2024-07-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 188, unitOfMeasure: 'units' },
  { date: new Date('2024-08-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 203, unitOfMeasure: 'units' },
  { date: new Date('2024-09-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 182, unitOfMeasure: 'units' },
  { date: new Date('2024-10-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 168, unitOfMeasure: 'units' },
  { date: new Date('2024-11-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 220, unitOfMeasure: 'units' },
  { date: new Date('2024-12-01'), product: 'Laptop', customer: 'TechMart Boston', demand: 255, unitOfMeasure: 'units' },
  
  // Product B - Smartphone with different pattern
  { date: new Date('2023-01-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 200, unitOfMeasure: 'units' },
  { date: new Date('2023-02-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 195, unitOfMeasure: 'units' },
  { date: new Date('2023-03-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 210, unitOfMeasure: 'units' },
  { date: new Date('2023-04-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 220, unitOfMeasure: 'units' },
  { date: new Date('2023-05-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 235, unitOfMeasure: 'units' },
  { date: new Date('2023-06-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 245, unitOfMeasure: 'units' },
  { date: new Date('2023-07-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 260, unitOfMeasure: 'units' },
  { date: new Date('2023-08-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 275, unitOfMeasure: 'units' },
  { date: new Date('2023-09-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 290, unitOfMeasure: 'units' },
  { date: new Date('2023-10-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 240, unitOfMeasure: 'units' },
  { date: new Date('2023-11-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 310, unitOfMeasure: 'units' },
  { date: new Date('2023-12-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 350, unitOfMeasure: 'units' },
  { date: new Date('2024-01-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 205, unitOfMeasure: 'units' },
  { date: new Date('2024-02-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 200, unitOfMeasure: 'units' },
  { date: new Date('2024-03-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 218, unitOfMeasure: 'units' },
  { date: new Date('2024-04-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 228, unitOfMeasure: 'units' },
  { date: new Date('2024-05-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 242, unitOfMeasure: 'units' },
  { date: new Date('2024-06-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 252, unitOfMeasure: 'units' },
  { date: new Date('2024-07-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 268, unitOfMeasure: 'units' },
  { date: new Date('2024-08-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 283, unitOfMeasure: 'units' },
  { date: new Date('2024-09-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 298, unitOfMeasure: 'units' },
  { date: new Date('2024-10-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 248, unitOfMeasure: 'units' },
  { date: new Date('2024-11-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 320, unitOfMeasure: 'units' },
  { date: new Date('2024-12-01'), product: 'Smartphone', customer: 'ElectroStore NYC', demand: 365, unitOfMeasure: 'units' },
];

// Inventory Optimization Sample Data
export const sampleInventoryData = {
  customerData: [
    { 'Customer Name': 'C001', 'Status': 'Include', 'Address': '100 Tech St', 'City': 'Boston', 'Region': 'MA', 'Postal Code': '02101', 'Country': 'USA', 'Latitude': 42.3601, 'Longitude': -71.0589, 'Single Source': '', 'Single Source Orders': 'false', 'Single Source Line Items': 'false', 'Allow Backorders': 'true', 'Backorder Time Limit': 7, 'Backorder Time UOM': 'DAY', 'Allow Partial Fill Orders': 'true', 'Allow Partial Fill Line Items': 'true', 'Allow Direct Ship': '', 'Notes': 'Northeast customer', 'Queue Priority': '' },
    { 'Customer Name': 'C002', 'Status': 'Include', 'Address': '200 Store Ave', 'City': 'New York', 'Region': 'NY', 'Postal Code': '10001', 'Country': 'USA', 'Latitude': 40.7128, 'Longitude': -74.0060, 'Single Source': '', 'Single Source Orders': 'false', 'Single Source Line Items': 'false', 'Allow Backorders': 'true', 'Backorder Time Limit': 7, 'Backorder Time UOM': 'DAY', 'Allow Partial Fill Orders': 'true', 'Allow Partial Fill Line Items': 'true', 'Allow Direct Ship': '', 'Notes': 'Major NYC customer', 'Queue Priority': '' },
    { 'Customer Name': 'C003', 'Status': 'Include', 'Address': '300 Hub Blvd', 'City': 'Philadelphia', 'Region': 'PA', 'Postal Code': '19101', 'Country': 'USA', 'Latitude': 39.9526, 'Longitude': -75.1652, 'Single Source': '', 'Single Source Orders': 'false', 'Single Source Line Items': 'false', 'Allow Backorders': 'true', 'Backorder Time Limit': 7, 'Backorder Time UOM': 'DAY', 'Allow Partial Fill Orders': 'true', 'Allow Partial Fill Line Items': 'true', 'Allow Direct Ship': '', 'Notes': 'Mid-Atlantic customer', 'Queue Priority': '' },
    { 'Customer Name': 'C004', 'Status': 'Include', 'Address': '400 Capital Way', 'City': 'Washington', 'Region': 'DC', 'Postal Code': '20001', 'Country': 'USA', 'Latitude': 38.9072, 'Longitude': -77.0369, 'Single Source': '', 'Single Source Orders': 'false', 'Single Source Line Items': 'false', 'Allow Backorders': 'true', 'Backorder Time Limit': 7, 'Backorder Time UOM': 'DAY', 'Allow Partial Fill Orders': 'true', 'Allow Partial Fill Line Items': 'true', 'Allow Direct Ship': '', 'Notes': 'DC customer', 'Queue Priority': '' },
  ],
  facilityData: [
    { 'Facility Name': 'DC1', 'Status': 'Include', 'Type': 'DC', 'Facility Status': 'Open', 'Initial State': 'Existing', 'Organization': 'Tech Corp', 'Address': '123 Distribution Pkwy', 'City': 'Boston', 'Region': 'MA', 'Postal Code': '02101', 'Country': 'USA', 'Latitude': 42.3601, 'Longitude': -71.0589, 'Fixed Startup Cost': 250000 },
    { 'Facility Name': 'Plant1', 'Status': 'Include', 'Type': 'Factory', 'Facility Status': 'Open', 'Initial State': 'Existing', 'Organization': 'Tech Corp', 'Address': '456 Manufacturing Dr', 'City': 'New York', 'Region': 'NY', 'Postal Code': '10001', 'Country': 'USA', 'Latitude': 40.7128, 'Longitude': -74.0060, 'Fixed Startup Cost': 500000 },
    { 'Facility Name': 'Warehouse1', 'Status': 'Include', 'Type': 'Warehouse', 'Facility Status': 'Open', 'Initial State': 'Existing', 'Organization': 'Tech Corp', 'Address': '789 Storage Rd', 'City': 'Philadelphia', 'Region': 'PA', 'Postal Code': '19101', 'Country': 'USA', 'Latitude': 39.9526, 'Longitude': -75.1652, 'Fixed Startup Cost': 150000 },
    { 'Facility Name': 'Supplier1', 'Status': 'Include', 'Type': 'Supplier', 'Facility Status': 'Open', 'Initial State': 'Existing', 'Organization': 'Parts Supplier Inc', 'Address': '999 Supply Chain Ave', 'City': 'Baltimore', 'Region': 'MD', 'Postal Code': '21201', 'Country': 'USA', 'Latitude': 39.2904, 'Longitude': -76.6122, 'Fixed Startup Cost': 0 },
  ],
  productData: [
    { 'Product Name': 'Laptop_X', 'Status': 'Include', 'Product Type': 'Finished Goods', 'Unit Value': 500, 'Unit Value UOM': 'EA', 'Unit Price': 1200, 'Unit Price UOM': 'EA', 'Unit Volume': 0.05, 'Unit Volume UOM': 'CFT', 'Unit Weight': 2.5, 'Unit Weight UOM': 'LB' },
    { 'Product Name': 'Smartphone_Pro', 'Status': 'Include', 'Product Type': 'Finished Goods', 'Unit Value': 350, 'Unit Value UOM': 'EA', 'Unit Price': 800, 'Unit Price UOM': 'EA', 'Unit Volume': 0.001, 'Unit Volume UOM': 'CFT', 'Unit Weight': 0.2, 'Unit Weight UOM': 'LB' },
    { 'Product Name': 'Tablet_Ultra', 'Status': 'Include', 'Product Type': 'Finished Goods', 'Unit Value': 280, 'Unit Value UOM': 'EA', 'Unit Price': 600, 'Unit Price UOM': 'EA', 'Unit Volume': 0.002, 'Unit Volume UOM': 'CFT', 'Unit Weight': 0.5, 'Unit Weight UOM': 'LB' },
    { 'Product Name': 'Screen_Component', 'Status': 'Include', 'Product Type': 'Raw Material', 'Unit Value': 150, 'Unit Value UOM': 'EA', 'Unit Price': 180, 'Unit Price UOM': 'EA', 'Unit Volume': 0.01, 'Unit Volume UOM': 'CFT', 'Unit Weight': 0.8, 'Unit Weight UOM': 'LB' },
    { 'Product Name': 'Processor_Component', 'Status': 'Include', 'Product Type': 'Raw Material', 'Unit Value': 200, 'Unit Value UOM': 'EA', 'Unit Price': 240, 'Unit Price UOM': 'EA', 'Unit Volume': 0.005, 'Unit Volume UOM': 'CFT', 'Unit Weight': 0.1, 'Unit Weight UOM': 'LB' },
  ],
  demandData: [
    { 'Customer Name': 'C001', 'Product Name': 'Laptop_X', 'Source Name': 'DC1', 'Optimization Policy': 'Minimize Cost', 'Optimization Policy Value': 1, 'Simulation Policy': 'By Preference', 'Simulation Policy Value': 1, 'Status': 'Include', 'Unit Cost': 0.5 },
    { 'Customer Name': 'C002', 'Product Name': 'Laptop_X', 'Source Name': 'DC1', 'Optimization Policy': 'Minimize Cost', 'Optimization Policy Value': 1, 'Simulation Policy': 'By Preference', 'Simulation Policy Value': 1, 'Status': 'Include', 'Unit Cost': 0.7 },
    { 'Customer Name': 'C001', 'Product Name': 'Smartphone_Pro', 'Source Name': 'DC1', 'Optimization Policy': 'Minimize Cost', 'Optimization Policy Value': 1, 'Simulation Policy': 'By Preference', 'Simulation Policy Value': 1, 'Status': 'Include', 'Unit Cost': 0.4 },
    { 'Customer Name': 'C002', 'Product Name': 'Smartphone_Pro', 'Source Name': 'DC1', 'Optimization Policy': 'Minimize Cost', 'Optimization Policy Value': 1, 'Simulation Policy': 'By Preference', 'Simulation Policy Value': 1, 'Status': 'Include', 'Unit Cost': 0.6 },
    { 'Customer Name': 'C003', 'Product Name': 'Tablet_Ultra', 'Source Name': 'Warehouse1', 'Optimization Policy': 'Minimize Cost', 'Optimization Policy Value': 1, 'Simulation Policy': 'By Preference', 'Simulation Policy Value': 1, 'Status': 'Include', 'Unit Cost': 0.45 },
  ],
  transitTimeData: [
    { 'Facility Name': 'DC1', 'Product Name': 'Laptop_X', 'Source Name': 'Plant1', 'Optimization Policy': 'Minimize Cost', 'Optimization Policy Value': 1, 'Simulation Policy': 'By Preference', 'Simulation Policy Value': 1, 'Status': 'Include', 'Unit Cost': 1.0 },
    { 'Facility Name': 'DC1', 'Product Name': 'Smartphone_Pro', 'Source Name': 'Plant1', 'Optimization Policy': 'Minimize Cost', 'Optimization Policy Value': 1, 'Simulation Policy': 'By Preference', 'Simulation Policy Value': 1, 'Status': 'Include', 'Unit Cost': 0.8 },
    { 'Facility Name': 'Warehouse1', 'Product Name': 'Tablet_Ultra', 'Source Name': 'Plant1', 'Optimization Policy': 'Minimize Cost', 'Optimization Policy Value': 1, 'Simulation Policy': 'By Preference', 'Simulation Policy Value': 1, 'Status': 'Include', 'Unit Cost': 0.9 },
    { 'Facility Name': 'Plant1', 'Product Name': 'Screen_Component', 'Source Name': 'Supplier1', 'Optimization Policy': 'Minimize Cost', 'Optimization Policy Value': 1, 'Simulation Policy': 'By Preference', 'Simulation Policy Value': 1, 'Status': 'Include', 'Unit Cost': 0.3 },
    { 'Facility Name': 'Plant1', 'Product Name': 'Processor_Component', 'Source Name': 'Supplier1', 'Optimization Policy': 'Minimize Cost', 'Optimization Policy Value': 1, 'Simulation Policy': 'By Preference', 'Simulation Policy Value': 1, 'Status': 'Include', 'Unit Cost': 0.4 },
  ],
  billOfMaterialsData: [
    { 'BOM ID': 'BOM_Laptop', 'End Product': 'Laptop_X', 'End Product Quantity': 1, 'Raw Materials': 'Screen_Component(1), Processor_Component(1)' },
    { 'BOM ID': 'BOM_Smartphone', 'End Product': 'Smartphone_Pro', 'End Product Quantity': 1, 'Raw Materials': 'Screen_Component(1)' },
    { 'BOM ID': 'BOM_Tablet', 'End Product': 'Tablet_Ultra', 'End Product Quantity': 1, 'Raw Materials': 'Screen_Component(1)' },
  ],
  settings: {
    'Simulation Time': 365,
    'Service Level Target': 95,
    'Holding Cost Rate': 0.25,
    'Stockout Cost': 100,
    'Order Cost': 200,
    'Review Period': 7,
    'Lead Time': 14,
  }
};

export const sampleDataDescriptions = {
  gfa: {
    title: "Geographic Footprint Analysis Sample",
    description: "Retail electronics supply chain scenario with 8 customers across the Northeast US, 4 product types, and 2 existing distribution sites.",
    dataPoints: [
      "8 customers with varying demand levels",
      "4 product types (Laptops, Smartphones, Tablets, Monitors)",
      "2 existing distribution facilities",
      "Pre-configured cost parameters"
    ],
    workflow: [
      "Click 'Load Sample Data' to populate all input tables",
      "Review customer locations and demand on the Map tab",
      "Adjust optimization settings if needed",
      "Run optimization to find optimal DC locations",
      "View results including cost breakdown and site recommendations"
    ]
  },
  forecasting: {
    title: "Demand Forecasting Sample",
    description: "24 months of historical sales data for Laptops and Smartphones showing seasonal patterns and growth trends.",
    dataPoints: [
      "24 months of historical data (2023-2024)",
      "2 products with distinct demand patterns",
      "Monthly granularity with seasonal peaks",
      "Price and regional information included"
    ],
    workflow: [
      "Click 'Load Sample Data' to import historical data",
      "View data analytics and seasonal patterns",
      "Select forecasting models (Moving Average, Exponential Smoothing, etc.)",
      "Configure forecast horizon (e.g., 6 months ahead)",
      "Generate forecasts and compare model accuracy"
    ]
  },
  inventory: {
    title: "Inventory Optimization Sample",
    description: "Multi-echelon supply chain with manufacturers, distribution centers, warehouses, and customers for electronics products.",
    dataPoints: [
      "4 customers across Northeast and Mid-Atlantic regions",
      "3 facilities (DC, Plant, Warehouse)",
      "3 products with cost and volume data",
      "Demand distributions and transit times",
      "Bill of Materials for production planning"
    ],
    workflow: [
      "Click 'Load Sample Data' to populate all network tables",
      "Review network structure on the Map visualization",
      "Configure simulation parameters (time horizon, service level)",
      "Run simulation to optimize inventory policies",
      "Analyze results including stock levels and costs"
    ]
  }
};
