import { Customer, Product, ExistingSite, OptimizationSettings } from "@/types/gfa";
import { HistoricalDataPoint } from "@/types/forecasting";

// Industry Example Types
export interface IndustryExample {
  id: string;
  title: string;
  industry: string;
  description: string;
  dataPoints: string[];
  gfaData?: {
    customers: Customer[];
    products: Product[];
    existingSites: ExistingSite[];
    settings: OptimizationSettings;
  };
  forecastingData?: HistoricalDataPoint[];
  inventoryData?: any;
}

// ==================== INDUSTRY EXAMPLES ====================

// GFA Industry Examples
export const gfaIndustryExamples: IndustryExample[] = [
  {
    id: "gfa-electronics",
    title: "Electronics Retail Distribution",
    industry: "Retail Electronics",
    description: "Northeast US electronics retail chain with 12 customer locations, 4 product categories, and regional distribution challenges.",
    dataPoints: [
      "12 retail customers across Northeast US",
      "4 product types (Laptops, Smartphones, Tablets, Monitors)",
      "2 existing distribution facilities",
      "Urban and suburban market mix",
    ],
    gfaData: {
      customers: [
        { id: "C1", name: "TechMart Boston", product: "Laptop", city: "Boston", country: "USA", latitude: 42.3601, longitude: -71.0589, demand: 5000, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "C2", name: "ElectroStore NYC", product: "Laptop", city: "New York", country: "USA", latitude: 40.7128, longitude: -74.006, demand: 8000, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "C3", name: "GadgetHub Philadelphia", product: "Smartphone", city: "Philadelphia", country: "USA", latitude: 39.9526, longitude: -75.1652, demand: 4500, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "C4", name: "DeviceWorld Washington", product: "Smartphone", city: "Washington", country: "USA", latitude: 38.9072, longitude: -77.0369, demand: 6000, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "C5", name: "TechZone Baltimore", product: "Tablet", city: "Baltimore", country: "USA", latitude: 39.2904, longitude: -76.6122, demand: 3500, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "C6", name: "SmartGear Pittsburgh", product: "Tablet", city: "Pittsburgh", country: "USA", latitude: 40.4406, longitude: -79.9959, demand: 4000, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "C7", name: "InnovateTech Buffalo", product: "Monitor", city: "Buffalo", country: "USA", latitude: 42.8864, longitude: -78.8784, demand: 2500, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "C8", name: "DigitalPlus Hartford", product: "Monitor", city: "Hartford", country: "USA", latitude: 41.7658, longitude: -72.6734, demand: 3000, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "C9", name: "TechVille Providence", product: "Laptop", city: "Providence", country: "USA", latitude: 41.8240, longitude: -71.4128, demand: 3800, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "C10", name: "ElectroHub Portland", product: "Smartphone", city: "Portland", country: "USA", latitude: 43.6591, longitude: -70.2568, demand: 3200, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "C11", name: "SmartStore Newark", product: "Tablet", city: "Newark", country: "USA", latitude: 40.7357, longitude: -74.1724, demand: 4200, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "C12", name: "GadgetCenter Syracuse", product: "Monitor", city: "Syracuse", country: "USA", latitude: 43.0481, longitude: -76.1474, demand: 2800, unitOfMeasure: "Units", conversionFactor: 1 },
      ],
      products: [
        { name: "Laptop", baseUnit: "units", sellingPrice: 1200, unitConversions: { to_m3: 0.05, to_kg: 2.5 } },
        { name: "Smartphone", baseUnit: "units", sellingPrice: 800, unitConversions: { to_m3: 0.001, to_kg: 0.2 } },
        { name: "Tablet", baseUnit: "units", sellingPrice: 600, unitConversions: { to_m3: 0.002, to_kg: 0.5 } },
        { name: "Monitor", baseUnit: "units", sellingPrice: 400, unitConversions: { to_m3: 0.08, to_kg: 5.0 } },
      ],
      existingSites: [
        { id: "E1", name: "Northeast Hub", city: "Boston", country: "USA", latitude: 42.3601, longitude: -71.0589, capacity: 15000, capacityUnit: "m3" },
        { id: "E2", name: "Mid-Atlantic Center", city: "Philadelphia", country: "USA", latitude: 39.9526, longitude: -75.1652, capacity: 12000, capacityUnit: "m3" },
      ],
      settings: {
        mode: "sites",
        numDCs: 3,
        maxRadius: 500,
        demandPercentage: 100,
        dcCapacity: 20000,
        capacityUnit: "m3",
        transportationCostPerMilePerUnit: 0.5,
        facilityCost: 250000,
        distanceUnit: "km",
        costUnit: "m3",
        includeExistingSites: false,
        existingSitesMode: "potential",
      },
    },
  },
  {
    id: "gfa-pharma",
    title: "Pharmaceutical Distribution Network",
    industry: "Healthcare & Pharma",
    description: "Midwest pharmaceutical distribution with 15 hospital and pharmacy customers requiring temperature-controlled logistics.",
    dataPoints: [
      "15 healthcare customers (hospitals & pharmacies)",
      "3 pharmaceutical product categories",
      "Temperature-controlled distribution requirements",
      "Major Midwest cities coverage",
    ],
    gfaData: {
      customers: [
        { id: "P1", name: "Metro Hospital Chicago", product: "Vaccines", city: "Chicago", country: "USA", latitude: 41.8781, longitude: -87.6298, demand: 12000, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "P2", name: "Central Pharmacy Detroit", product: "Prescription Meds", city: "Detroit", country: "USA", latitude: 42.3314, longitude: -83.0458, demand: 8500, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "P3", name: "HealthCare Plus Milwaukee", product: "Vaccines", city: "Milwaukee", country: "USA", latitude: 43.0389, longitude: -87.9065, demand: 7200, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "P4", name: "Midwest Medical Indianapolis", product: "Specialty Drugs", city: "Indianapolis", country: "USA", latitude: 39.7684, longitude: -86.1581, demand: 9800, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "P5", name: "City Hospital Columbus", product: "Prescription Meds", city: "Columbus", country: "USA", latitude: 39.9612, longitude: -82.9988, demand: 10500, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "P6", name: "Regional Pharmacy Cincinnati", product: "Vaccines", city: "Cincinnati", country: "USA", latitude: 39.1031, longitude: -84.5120, demand: 6800, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "P7", name: "Mercy Hospital St. Louis", product: "Specialty Drugs", city: "St. Louis", country: "USA", latitude: 38.6270, longitude: -90.1994, demand: 11200, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "P8", name: "Community Health Cleveland", product: "Prescription Meds", city: "Cleveland", country: "USA", latitude: 41.4993, longitude: -81.6944, demand: 8900, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "P9", name: "Pharmacy Network Minneapolis", product: "Vaccines", city: "Minneapolis", country: "USA", latitude: 44.9778, longitude: -93.2650, demand: 9500, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "P10", name: "General Hospital Kansas City", product: "Specialty Drugs", city: "Kansas City", country: "USA", latitude: 39.0997, longitude: -94.5786, demand: 7600, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "P11", name: "MedSupply Madison", product: "Prescription Meds", city: "Madison", country: "USA", latitude: 43.0731, longitude: -89.4012, demand: 5400, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "P12", name: "Care Center Des Moines", product: "Vaccines", city: "Des Moines", country: "USA", latitude: 41.5868, longitude: -93.6250, demand: 6200, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "P13", name: "Health Partners Omaha", product: "Specialty Drugs", city: "Omaha", country: "USA", latitude: 41.2565, longitude: -95.9345, demand: 7800, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "P14", name: "Hospital Network Grand Rapids", product: "Prescription Meds", city: "Grand Rapids", country: "USA", latitude: 42.9634, longitude: -85.6681, demand: 6500, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "P15", name: "Pharmacy Group Toledo", product: "Vaccines", city: "Toledo", country: "USA", latitude: 41.6528, longitude: -83.5379, demand: 5800, unitOfMeasure: "Units", conversionFactor: 1 },
      ],
      products: [
        { name: "Vaccines", baseUnit: "units", sellingPrice: 45, unitConversions: { to_m3: 0.0005, to_kg: 0.1 } },
        { name: "Prescription Meds", baseUnit: "units", sellingPrice: 85, unitConversions: { to_m3: 0.0003, to_kg: 0.05 } },
        { name: "Specialty Drugs", baseUnit: "units", sellingPrice: 250, unitConversions: { to_m3: 0.0008, to_kg: 0.15 } },
      ],
      existingSites: [
        { id: "D1", name: "Chicago Distribution Hub", city: "Chicago", country: "USA", latitude: 41.8781, longitude: -87.6298, capacity: 25000, capacityUnit: "m3" },
      ],
      settings: {
        mode: "sites",
        numDCs: 4,
        maxRadius: 400,
        demandPercentage: 100,
        dcCapacity: 30000,
        capacityUnit: "m3",
        transportationCostPerMilePerUnit: 1.2,
        facilityCost: 450000,
        distanceUnit: "km",
        costUnit: "m3",
        includeExistingSites: false,
        existingSitesMode: "potential",
      },
    },
  },
  {
    id: "gfa-food",
    title: "Food & Beverage Distribution",
    industry: "Food & Beverage",
    description: "Southeast regional food distributor serving 14 grocery chains and restaurants with perishable goods logistics.",
    dataPoints: [
      "14 customers (grocery chains & restaurants)",
      "4 product categories (fresh, frozen, dry goods, beverages)",
      "Perishable goods logistics considerations",
      "Southeast US regional coverage",
    ],
    gfaData: {
      customers: [
        { id: "F1", name: "FreshMart Atlanta", product: "Fresh Produce", city: "Atlanta", country: "USA", latitude: 33.7490, longitude: -84.3880, demand: 18000, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "F2", name: "Southern Grocers Charlotte", product: "Frozen Foods", city: "Charlotte", country: "USA", latitude: 35.2271, longitude: -80.8431, demand: 15500, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "F3", name: "Restaurant Supply Miami", product: "Fresh Produce", city: "Miami", country: "USA", latitude: 25.7617, longitude: -80.1918, demand: 22000, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "F4", name: "Food Depot Tampa", product: "Dry Goods", city: "Tampa", country: "USA", latitude: 27.9506, longitude: -82.4572, demand: 14000, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "F5", name: "GourmetMart Orlando", product: "Beverages", city: "Orlando", country: "USA", latitude: 28.5383, longitude: -81.3792, demand: 16500, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "F6", name: "Quality Foods Nashville", product: "Fresh Produce", city: "Nashville", country: "USA", latitude: 36.1627, longitude: -86.7816, demand: 13800, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "F7", name: "Metro Grocery Jacksonville", product: "Frozen Foods", city: "Jacksonville", country: "USA", latitude: 30.3322, longitude: -81.6557, demand: 11200, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "F8", name: "BevSupply Charleston", product: "Beverages", city: "Charleston", country: "USA", latitude: 32.7765, longitude: -79.9311, demand: 9800, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "F9", name: "Fresh Choice Raleigh", product: "Fresh Produce", city: "Raleigh", country: "USA", latitude: 35.7796, longitude: -78.6382, demand: 12500, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "F10", name: "Food Hub Birmingham", product: "Dry Goods", city: "Birmingham", country: "USA", latitude: 33.5207, longitude: -86.8025, demand: 10800, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "F11", name: "Coastal Grocers Savannah", product: "Frozen Foods", city: "Savannah", country: "USA", latitude: 32.0809, longitude: -81.0912, demand: 8900, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "F12", name: "Prime Foods Memphis", product: "Fresh Produce", city: "Memphis", country: "USA", latitude: 35.1495, longitude: -90.0490, demand: 14200, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "F13", name: "Restaurant Central New Orleans", product: "Beverages", city: "New Orleans", country: "USA", latitude: 29.9511, longitude: -90.0715, demand: 17500, unitOfMeasure: "Units", conversionFactor: 1 },
        { id: "F14", name: "Wholesale Foods Columbia", product: "Dry Goods", city: "Columbia", country: "USA", latitude: 34.0007, longitude: -81.0348, demand: 9500, unitOfMeasure: "Units", conversionFactor: 1 },
      ],
      products: [
        { name: "Fresh Produce", baseUnit: "units", sellingPrice: 3.5, unitConversions: { to_m3: 0.015, to_kg: 8 } },
        { name: "Frozen Foods", baseUnit: "units", sellingPrice: 5.2, unitConversions: { to_m3: 0.012, to_kg: 6 } },
        { name: "Dry Goods", baseUnit: "units", sellingPrice: 2.8, unitConversions: { to_m3: 0.01, to_kg: 5 } },
        { name: "Beverages", baseUnit: "units", sellingPrice: 1.5, unitConversions: { to_m3: 0.002, to_kg: 1.5 } },
      ],
      existingSites: [
        { id: "R1", name: "Atlanta Regional DC", city: "Atlanta", country: "USA", latitude: 33.7490, longitude: -84.3880, capacity: 45000, capacityUnit: "m3" },
      ],
      settings: {
        mode: "sites",
        numDCs: 3,
        maxRadius: 450,
        demandPercentage: 100,
        dcCapacity: 50000,
        capacityUnit: "m3",
        transportationCostPerMilePerUnit: 0.8,
        facilityCost: 380000,
        distanceUnit: "km",
        costUnit: "m3",
        includeExistingSites: false,
        existingSitesMode: "potential",
      },
    },
  },
];

// Forecasting Industry Examples
export const forecastingIndustryExamples: IndustryExample[] = [
  {
    id: "forecast-electronics",
    title: "Electronics Retail Demand",
    industry: "Retail Electronics",
    description: "24 months of seasonal sales data for consumer electronics with holiday peaks and promotional patterns.",
    dataPoints: [
      "24 months of historical sales (2023-2024)",
      "2 product categories with seasonal patterns",
      "Clear holiday season peaks",
      "Promotional impact visible in data",
    ],
    forecastingData: [
      // Laptop data (24 months with seasonal pattern)
      ...Array.from({ length: 24 }, (_, i) => {
        const date = new Date(2023, i, 1);
        const month = date.getMonth();
        const seasonalFactor = month === 11 ? 2.0 : month === 10 ? 1.4 : month >= 6 && month <= 8 ? 1.3 : 1.0;
        const growth = 1 + (i * 0.02);
        return {
          date,
          product: "Laptop",
          customer: "TechMart Boston",
          demand: Math.round(120 * seasonalFactor * growth),
          unitOfMeasure: "units"
        };
      }),
      // Smartphone data (24 months with different pattern)
      ...Array.from({ length: 24 }, (_, i) => {
        const date = new Date(2023, i, 1);
        const month = date.getMonth();
        const seasonalFactor = month === 11 ? 1.75 : month === 8 ? 1.45 : month === 9 ? 1.2 : 1.0;
        const growth = 1 + (i * 0.015);
        return {
          date,
          product: "Smartphone",
          customer: "ElectroStore NYC",
          demand: Math.round(200 * seasonalFactor * growth),
          unitOfMeasure: "units"
        };
      }),
    ],
  },
  {
    id: "forecast-pharma",
    title: "Pharmaceutical Demand Planning",
    industry: "Healthcare & Pharma",
    description: "24 months of prescription medication and vaccine demand with flu season patterns and pandemic impacts.",
    dataPoints: [
      "24 months of pharmaceutical sales",
      "2 medication categories",
      "Seasonal flu patterns evident",
      "Stable long-term trend with seasonal peaks",
    ],
    forecastingData: [
      // Vaccines (flu season pattern)
      ...Array.from({ length: 24 }, (_, i) => {
        const date = new Date(2023, i, 1);
        const month = date.getMonth();
        const fluSeasonFactor = (month >= 9 && month <= 11) || (month >= 0 && month <= 2) ? 1.8 : 0.6;
        return {
          date,
          product: "Vaccines",
          customer: "Metro Hospital Chicago",
          demand: Math.round(500 * fluSeasonFactor),
          unitOfMeasure: "units"
        };
      }),
      // Prescription Meds (steady with slight growth)
      ...Array.from({ length: 24 }, (_, i) => {
        const date = new Date(2023, i, 1);
        const growth = 1 + (i * 0.008);
        const randomVariation = 0.9 + Math.random() * 0.2;
        return {
          date,
          product: "Prescription Meds",
          customer: "Central Pharmacy Detroit",
          demand: Math.round(350 * growth * randomVariation),
          unitOfMeasure: "units"
        };
      }),
    ],
  },
  {
    id: "forecast-food",
    title: "Food & Beverage Seasonal Forecast",
    industry: "Food & Beverage",
    description: "24 months of fresh produce and beverage sales with strong seasonality and weather impacts.",
    dataPoints: [
      "24 months of food distribution data",
      "2 product categories (fresh, beverages)",
      "Strong summer/winter seasonality",
      "Weather-driven demand patterns",
    ],
    forecastingData: [
      // Fresh Produce (summer peak)
      ...Array.from({ length: 24 }, (_, i) => {
        const date = new Date(2023, i, 1);
        const month = date.getMonth();
        const summerFactor = month >= 5 && month <= 8 ? 1.6 : month >= 11 || month <= 1 ? 0.8 : 1.0;
        return {
          date,
          product: "Fresh Produce",
          customer: "FreshMart Atlanta",
          demand: Math.round(750 * summerFactor),
          unitOfMeasure: "units"
        };
      }),
      // Beverages (summer peak, holiday spike)
      ...Array.from({ length: 24 }, (_, i) => {
        const date = new Date(2023, i, 1);
        const month = date.getMonth();
        const summerFactor = month >= 5 && month <= 8 ? 1.7 : month === 11 ? 1.4 : 0.9;
        return {
          date,
          product: "Beverages",
          customer: "BevSupply Charleston",
          demand: Math.round(650 * summerFactor),
          unitOfMeasure: "units"
        };
      }),
    ],
  },
];

// Inventory Industry Examples
export const inventoryIndustryExamples: IndustryExample[] = [
  {
    id: "inventory-electronics",
    title: "Electronics Multi-Echelon Network",
    industry: "Retail Electronics",
    description: "Multi-tier electronics supply chain with manufacturing, distribution centers, and retail customers.",
    dataPoints: [
      "10 retail customers across regions",
      "4 facilities (plants, DCs, warehouses)",
      "3 product categories with different characteristics",
      "Complete BOM and transit time data",
    ],
    inventoryData: {
      customerData: [
        { "Customer ID": "C001", "Customer Name": "TechMart Boston", Latitude: 42.3601, Longitude: -71.0589, Region: "Northeast" },
        { "Customer ID": "C002", "Customer Name": "ElectroStore NYC", Latitude: 40.7128, Longitude: -74.006, Region: "Northeast" },
        { "Customer ID": "C003", "Customer Name": "GadgetHub Philadelphia", Latitude: 39.9526, Longitude: -75.1652, Region: "Mid-Atlantic" },
        { "Customer ID": "C004", "Customer Name": "DeviceWorld Washington", Latitude: 38.9072, Longitude: -77.0369, Region: "Mid-Atlantic" },
        { "Customer ID": "C005", "Customer Name": "TechZone Baltimore", Latitude: 39.2904, Longitude: -76.6122, Region: "Mid-Atlantic" },
        { "Customer ID": "C006", "Customer Name": "SmartGear Pittsburgh", Latitude: 40.4406, Longitude: -79.9959, Region: "Midwest" },
        { "Customer ID": "C007", "Customer Name": "InnovateTech Buffalo", Latitude: 42.8864, Longitude: -78.8784, Region: "Northeast" },
        { "Customer ID": "C008", "Customer Name": "DigitalPlus Hartford", Latitude: 41.7658, Longitude: -72.6734, Region: "Northeast" },
        { "Customer ID": "C009", "Customer Name": "TechVille Providence", Latitude: 41.8240, Longitude: -71.4128, Region: "Northeast" },
        { "Customer ID": "C010", "Customer Name": "ElectroHub Portland", Latitude: 43.6591, Longitude: -70.2568, Region: "Northeast" },
      ],
      facilityData: [
        { "Facility ID": "F001", "Facility Name": "Northeast Distribution Center", Latitude: 42.3601, Longitude: -71.0589, Type: "DC", Capacity: 50000, Status: "Active", Address: "100 Industrial Parkway", City: "Boston", Region: "Northeast" },
        { "Facility ID": "F002", "Facility Name": "Manufacturing Plant 1", Latitude: 40.7128, Longitude: -74.006, Type: "Plant", "Production Capacity": 30000, Status: "Active", Address: "500 Production Avenue", City: "Newark", Region: "Northeast" },
        { "Facility ID": "F003", "Facility Name": "Mid-Atlantic Warehouse", Latitude: 39.9526, Longitude: -75.1652, Type: "Warehouse", Capacity: 40000, Status: "Active", Address: "200 Distribution Drive", City: "Philadelphia", Region: "Mid-Atlantic" },
        { "Facility ID": "F004", "Facility Name": "Regional Hub Pittsburgh", Latitude: 40.4406, Longitude: -79.9959, Type: "DC", Capacity: 35000, Status: "Active", Address: "75 Logistics Lane", City: "Pittsburgh", Region: "Midwest" },
      ],
      productData: [
        { "Product ID": "P001", "Product Name": "Laptop Model X", "Unit Cost": 500, "Selling Price": 1200, Volume: 0.05, Weight: 2.5, Category: "Electronics", "Lead Time": 14 },
        { "Product ID": "P002", "Product Name": "Smartphone Pro", "Unit Cost": 350, "Selling Price": 800, Volume: 0.001, Weight: 0.2, Category: "Electronics", "Lead Time": 10 },
        { "Product ID": "P003", "Product Name": "Tablet Ultra", "Unit Cost": 280, "Selling Price": 600, Volume: 0.002, Weight: 0.5, Category: "Electronics", "Lead Time": 12 },
      ],
      demandData: [
        { "Product ID": "P001", "Customer ID": "C001", "Mean Demand": 150, "Std Dev": 25, Distribution: "Normal" },
        { "Product ID": "P001", "Customer ID": "C002", "Mean Demand": 200, "Std Dev": 35, Distribution: "Normal" },
        { "Product ID": "P002", "Customer ID": "C001", "Mean Demand": 300, "Std Dev": 50, Distribution: "Normal" },
        { "Product ID": "P002", "Customer ID": "C002", "Mean Demand": 400, "Std Dev": 65, Distribution: "Normal" },
        { "Product ID": "P003", "Customer ID": "C003", "Mean Demand": 180, "Std Dev": 30, Distribution: "Normal" },
        { "Product ID": "P001", "Customer ID": "C004", "Mean Demand": 175, "Std Dev": 28, Distribution: "Normal" },
        { "Product ID": "P002", "Customer ID": "C005", "Mean Demand": 320, "Std Dev": 48, Distribution: "Normal" },
        { "Product ID": "P003", "Customer ID": "C006", "Mean Demand": 195, "Std Dev": 32, Distribution: "Normal" },
      ],
      transitTimeData: [
        { "From Facility": "F001", "To Facility": "C001", "Transit Time (days)": 1, "Transit Cost": 50 },
        { "From Facility": "F001", "To Facility": "C002", "Transit Time (days)": 2, "Transit Cost": 75 },
        { "From Facility": "F002", "To Facility": "F001", "Transit Time (days)": 3, "Transit Cost": 120 },
        { "From Facility": "F003", "To Facility": "C003", "Transit Time (days)": 1, "Transit Cost": 45 },
        { "From Facility": "F003", "To Facility": "C004", "Transit Time (days)": 2, "Transit Cost": 65 },
        { "From Facility": "F004", "To Facility": "C006", "Transit Time (days)": 1, "Transit Cost": 40 },
      ],
      billOfMaterialsData: [
        { "Product ID": "P001", Component: "Screen", Quantity: 1, "Lead Time (days)": 5 },
        { "Product ID": "P001", Component: "Processor", Quantity: 1, "Lead Time (days)": 7 },
        { "Product ID": "P002", Component: "Display", Quantity: 1, "Lead Time (days)": 4 },
        { "Product ID": "P002", Component: "Battery", Quantity: 1, "Lead Time (days)": 3 },
        { "Product ID": "P003", Component: "Touchscreen", Quantity: 1, "Lead Time (days)": 6 },
      ],
      settings: {
        "Simulation Time": 365,
        "Service Level Target": 95,
        "Holding Cost Rate": 0.25,
        "Stockout Cost": 100,
        "Order Cost": 200,
        "Review Period": 7,
        "Lead Time": 14,
      },
    },
  },
  {
    id: "inventory-pharma",
    title: "Pharmaceutical Supply Chain",
    industry: "Healthcare & Pharma",
    description: "Hospital and pharmacy distribution network with strict service levels and temperature-controlled requirements.",
    dataPoints: [
      "12 healthcare customers (hospitals & pharmacies)",
      "3 cold chain facilities",
      "3 pharmaceutical product types",
      "High service level requirements (>98%)",
    ],
    inventoryData: {
      customerData: [
        { "Customer ID": "H001", "Customer Name": "Metro Hospital Chicago", Latitude: 41.8781, Longitude: -87.6298, Region: "Midwest" },
        { "Customer ID": "H002", "Customer Name": "Central Pharmacy Detroit", Latitude: 42.3314, Longitude: -83.0458, Region: "Midwest" },
        { "Customer ID": "H003", "Customer Name": "HealthCare Plus Milwaukee", Latitude: 43.0389, Longitude: -87.9065, Region: "Midwest" },
        { "Customer ID": "H004", "Customer Name": "Midwest Medical Indianapolis", Latitude: 39.7684, Longitude: -86.1581, Region: "Midwest" },
        { "Customer ID": "H005", "Customer Name": "City Hospital Columbus", Latitude: 39.9612, Longitude: -82.9988, Region: "Midwest" },
        { "Customer ID": "H006", "Customer Name": "Regional Pharmacy Cincinnati", Latitude: 39.1031, Longitude: -84.5120, Region: "Midwest" },
        { "Customer ID": "H007", "Customer Name": "Mercy Hospital St. Louis", Latitude: 38.6270, Longitude: -90.1994, Region: "Midwest" },
        { "Customer ID": "H008", "Customer Name": "Community Health Cleveland", Latitude: 41.4993, Longitude: -81.6944, Region: "Midwest" },
        { "Customer ID": "H009", "Customer Name": "Pharmacy Network Minneapolis", Latitude: 44.9778, Longitude: -93.2650, Region: "Midwest" },
        { "Customer ID": "H010", "Customer Name": "General Hospital Kansas City", Latitude: 39.0997, Longitude: -94.5786, Region: "Midwest" },
        { "Customer ID": "H011", "Customer Name": "MedSupply Madison", Latitude: 43.0731, Longitude: -89.4012, Region: "Midwest" },
        { "Customer ID": "H012", "Customer Name": "Care Center Des Moines", Latitude: 41.5868, Longitude: -93.6250, Region: "Midwest" },
      ],
      facilityData: [
        { "Facility ID": "D001", "Facility Name": "Chicago Cold Chain Hub", Latitude: 41.8781, Longitude: -87.6298, Type: "Cold Storage DC", Capacity: 25000, Status: "Active", Address: "100 Pharma Drive", City: "Chicago", Region: "Midwest" },
        { "Facility ID": "D002", "Facility Name": "Columbus Distribution Center", Latitude: 39.9612, Longitude: -82.9988, Type: "DC", Capacity: 20000, Status: "Active", Address: "200 Medical Lane", City: "Columbus", Region: "Midwest" },
        { "Facility ID": "D003", "Facility Name": "Minneapolis Regional Warehouse", Latitude: 44.9778, Longitude: -93.2650, Type: "Cold Storage DC", Capacity: 18000, Status: "Active", Address: "50 Healthcare Blvd", City: "Minneapolis", Region: "Midwest" },
      ],
      productData: [
        { "Product ID": "M001", "Product Name": "Vaccines", "Unit Cost": 25, "Selling Price": 45, Volume: 0.0005, Weight: 0.1, Category: "Temperature Sensitive", "Lead Time": 7 },
        { "Product ID": "M002", "Product Name": "Prescription Meds", "Unit Cost": 45, "Selling Price": 85, Volume: 0.0003, Weight: 0.05, Category: "Standard", "Lead Time": 5 },
        { "Product ID": "M003", "Product Name": "Specialty Drugs", "Unit Cost": 150, "Selling Price": 250, Volume: 0.0008, Weight: 0.15, Category: "Temperature Sensitive", "Lead Time": 10 },
      ],
      demandData: [
        { "Product ID": "M001", "Customer ID": "H001", "Mean Demand": 500, "Std Dev": 60, Distribution: "Normal" },
        { "Product ID": "M001", "Customer ID": "H002", "Mean Demand": 350, "Std Dev": 45, Distribution: "Normal" },
        { "Product ID": "M002", "Customer ID": "H003", "Mean Demand": 420, "Std Dev": 55, Distribution: "Normal" },
        { "Product ID": "M002", "Customer ID": "H004", "Mean Demand": 480, "Std Dev": 62, Distribution: "Normal" },
        { "Product ID": "M003", "Customer ID": "H005", "Mean Demand": 280, "Std Dev": 38, Distribution: "Normal" },
        { "Product ID": "M001", "Customer ID": "H006", "Mean Demand": 390, "Std Dev": 48, Distribution: "Normal" },
        { "Product ID": "M002", "Customer ID": "H007", "Mean Demand": 510, "Std Dev": 68, Distribution: "Normal" },
        { "Product ID": "M003", "Customer ID": "H008", "Mean Demand": 320, "Std Dev": 42, Distribution: "Normal" },
      ],
      transitTimeData: [
        { "From Facility": "D001", "To Facility": "H001", "Transit Time (days)": 1, "Transit Cost": 80 },
        { "From Facility": "D001", "To Facility": "H002", "Transit Time (days)": 2, "Transit Cost": 110 },
        { "From Facility": "D002", "To Facility": "H005", "Transit Time (days)": 1, "Transit Cost": 75 },
        { "From Facility": "D002", "To Facility": "H006", "Transit Time (days)": 2, "Transit Cost": 95 },
        { "From Facility": "D003", "To Facility": "H009", "Transit Time (days)": 1, "Transit Cost": 70 },
      ],
      billOfMaterialsData: [
        { "Product ID": "M001", Component: "Active Ingredient", Quantity: 1, "Lead Time (days)": 5 },
        { "Product ID": "M001", Component: "Vial", Quantity: 1, "Lead Time (days)": 3 },
        { "Product ID": "M002", Component: "API", Quantity: 1, "Lead Time (days)": 4 },
        { "Product ID": "M003", Component: "Specialty Compound", Quantity: 1, "Lead Time (days)": 8 },
      ],
      settings: {
        "Simulation Time": 365,
        "Service Level Target": 98,
        "Holding Cost Rate": 0.30,
        "Stockout Cost": 500,
        "Order Cost": 300,
        "Review Period": 5,
        "Lead Time": 7,
      },
    },
  },
  {
    id: "inventory-food",
    title: "Food Distribution Network",
    industry: "Food & Beverage",
    description: "Fresh and frozen food distribution with short shelf life, high turnover, and temperature requirements.",
    dataPoints: [
      "11 grocery and restaurant customers",
      "3 distribution facilities with cold storage",
      "4 product categories (fresh, frozen, dry, beverages)",
      "Perishable goods management",
    ],
    inventoryData: {
      customerData: [
        { "Customer ID": "G001", "Customer Name": "FreshMart Atlanta", Latitude: 33.7490, Longitude: -84.3880, Region: "Southeast" },
        { "Customer ID": "G002", "Customer Name": "Southern Grocers Charlotte", Latitude: 35.2271, Longitude: -80.8431, Region: "Southeast" },
        { "Customer ID": "G003", "Customer Name": "Restaurant Supply Miami", Latitude: 25.7617, Longitude: -80.1918, Region: "Southeast" },
        { "Customer ID": "G004", "Customer Name": "Food Depot Tampa", Latitude: 27.9506, Longitude: -82.4572, Region: "Southeast" },
        { "Customer ID": "G005", "Customer Name": "GourmetMart Orlando", Latitude: 28.5383, Longitude: -81.3792, Region: "Southeast" },
        { "Customer ID": "G006", "Customer Name": "Quality Foods Nashville", Latitude: 36.1627, Longitude: -86.7816, Region: "Southeast" },
        { "Customer ID": "G007", "Customer Name": "Metro Grocery Jacksonville", Latitude: 30.3322, Longitude: -81.6557, Region: "Southeast" },
        { "Customer ID": "G008", "Customer Name": "BevSupply Charleston", Latitude: 32.7765, Longitude: -79.9311, Region: "Southeast" },
        { "Customer ID": "G009", "Customer Name": "Fresh Choice Raleigh", Latitude: 35.7796, Longitude: -78.6382, Region: "Southeast" },
        { "Customer ID": "G010", "Customer Name": "Food Hub Birmingham", Latitude: 33.5207, Longitude: -86.8025, Region: "Southeast" },
        { "Customer ID": "G011", "Customer Name": "Coastal Grocers Savannah", Latitude: 32.0809, Longitude: -81.0912, Region: "Southeast" },
      ],
      facilityData: [
        { "Facility ID": "W001", "Facility Name": "Atlanta Regional DC", Latitude: 33.7490, Longitude: -84.3880, Type: "Cold Storage DC", Capacity: 45000, Status: "Active", Address: "300 Food Plaza", City: "Atlanta", Region: "Southeast" },
        { "Facility ID": "W002", "Facility Name": "Miami Distribution Hub", Latitude: 25.7617, Longitude: -80.1918, Type: "Cold Storage DC", Capacity: 38000, Status: "Active", Address: "150 Fresh Way", City: "Miami", Region: "Southeast" },
        { "Facility ID": "W003", "Facility Name": "Charlotte Warehouse", Latitude: 35.2271, Longitude: -80.8431, Type: "DC", Capacity: 35000, Status: "Active", Address: "75 Distribution Point", City: "Charlotte", Region: "Southeast" },
      ],
      productData: [
        { "Product ID": "F001", "Product Name": "Fresh Produce", "Unit Cost": 2.0, "Selling Price": 3.5, Volume: 0.015, Weight: 8, Category: "Perishable", "Lead Time": 2 },
        { "Product ID": "F002", "Product Name": "Frozen Foods", "Unit Cost": 3.5, "Selling Price": 5.2, Volume: 0.012, Weight: 6, Category: "Frozen", "Lead Time": 3 },
        { "Product ID": "F003", "Product Name": "Dry Goods", "Unit Cost": 1.8, "Selling Price": 2.8, Volume: 0.01, Weight: 5, Category: "Dry", "Lead Time": 5 },
        { "Product ID": "F004", "Product Name": "Beverages", "Unit Cost": 1.0, "Selling Price": 1.5, Volume: 0.002, Weight: 1.5, Category: "Standard", "Lead Time": 4 },
      ],
      demandData: [
        { "Product ID": "F001", "Customer ID": "G001", "Mean Demand": 750, "Std Dev": 95, Distribution: "Normal" },
        { "Product ID": "F001", "Customer ID": "G003", "Mean Demand": 920, "Std Dev": 110, Distribution: "Normal" },
        { "Product ID": "F002", "Customer ID": "G002", "Mean Demand": 650, "Std Dev": 85, Distribution: "Normal" },
        { "Product ID": "F002", "Customer ID": "G007", "Mean Demand": 470, "Std Dev": 62, Distribution: "Normal" },
        { "Product ID": "F003", "Customer ID": "G004", "Mean Demand": 580, "Std Dev": 72, Distribution: "Normal" },
        { "Product ID": "F004", "Customer ID": "G005", "Mean Demand": 690, "Std Dev": 88, Distribution: "Normal" },
        { "Product ID": "F004", "Customer ID": "G008", "Mean Demand": 410, "Std Dev": 55, Distribution: "Normal" },
      ],
      transitTimeData: [
        { "From Facility": "W001", "To Facility": "G001", "Transit Time (days)": 1, "Transit Cost": 45 },
        { "From Facility": "W001", "To Facility": "G006", "Transit Time (days)": 2, "Transit Cost": 70 },
        { "From Facility": "W002", "To Facility": "G003", "Transit Time (days)": 1, "Transit Cost": 50 },
        { "From Facility": "W002", "To Facility": "G004", "Transit Time (days)": 2, "Transit Cost": 65 },
        { "From Facility": "W003", "To Facility": "G002", "Transit Time (days)": 1, "Transit Cost": 40 },
      ],
      billOfMaterialsData: [
        { "Product ID": "F001", Component: "Farm Source", Quantity: 1, "Lead Time (days)": 1 },
        { "Product ID": "F002", Component: "Processing Plant", Quantity: 1, "Lead Time (days)": 2 },
        { "Product ID": "F003", Component: "Packaging", Quantity: 1, "Lead Time (days)": 3 },
        { "Product ID": "F004", Component: "Bottling Line", Quantity: 1, "Lead Time (days)": 2 },
      ],
      settings: {
        "Simulation Time": 180,
        "Service Level Target": 96,
        "Holding Cost Rate": 0.35,
        "Stockout Cost": 80,
        "Order Cost": 150,
        "Review Period": 3,
        "Lead Time": 3,
      },
    },
  },
];

// Legacy exports (backward compatibility - use first example from each category)
export const sampleGFACustomers: Customer[] = gfaIndustryExamples[0].gfaData!.customers;
export const sampleGFAProducts: Product[] = gfaIndustryExamples[0].gfaData!.products;
export const sampleGFAExistingSites: ExistingSite[] = gfaIndustryExamples[0].gfaData!.existingSites;
export const sampleGFASettings: OptimizationSettings = gfaIndustryExamples[0].gfaData!.settings;
export const sampleForecastingData: HistoricalDataPoint[] = forecastingIndustryExamples[0].forecastingData!;
export const sampleInventoryData = inventoryIndustryExamples[0].inventoryData;

export const sampleDataDescriptions = {
  gfa: {
    title: "Geographic Footprint Analysis Samples",
    description: "Choose from industry-specific examples to explore GFA features with realistic data.",
    dataPoints: [],
    workflow: [
      "Select an industry example below",
      "Review customer locations and demand on the Map tab",
      "Adjust optimization settings if needed",
      "Run optimization to find optimal DC locations",
      "View results including cost breakdown and site recommendations",
    ],
  },
  forecasting: {
    title: "Demand Forecasting Samples",
    description: "Choose from industry-specific historical sales data with varying seasonal patterns.",
    dataPoints: [],
    workflow: [
      "Select an industry example below",
      "View data analytics and seasonal patterns",
      "Select forecasting models (Moving Average, Exponential Smoothing, etc.)",
      "Configure forecast horizon (e.g., 6 months ahead)",
      "Generate forecasts and compare model accuracy",
    ],
  },
  inventory: {
    title: "Inventory Optimization Samples",
    description: "Choose from industry-specific multi-echelon networks with realistic constraints.",
    dataPoints: [],
    workflow: [
      "Select an industry example below",
      "Review network structure on the Map visualization",
      "Configure simulation parameters (time horizon, service level)",
      "Run simulation to optimize inventory policies",
      "Analyze results including stock levels and costs",
    ],
  },
};
