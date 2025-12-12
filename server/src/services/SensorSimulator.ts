
// ===========================
// src/services/SensorSimulator.ts
// ===========================

import { PlantTable, EnvironmentData, GreenhouseData } from '../types/greenhouse.types';

export class SensorSimulator {

  private logging: boolean = false;
  private environmentData: EnvironmentData[] = [];
  private currentDay = 100;
  private minuteOfTheDay: number = 0;

  // Growth parameters (per minute)
  private readonly BASE_GROWTH_RATE = 0.2        // cm per minute under optimal conditions
  private readonly OPTIMAL_TEMP = 22;              // °C optimal temperature
  private readonly DEATH_TEMP = 60;                // °C plants die above this
  private readonly OPTIMAL_MOISTURE_MIN = 50;      // % optimal soil moisture min
  private readonly OPTIMAL_MOISTURE_MAX = 80;      // % optimal soil moisture max
  private readonly MAX_HUMIDITY = 85;              // % max air humidity
  private readonly WATER_INCREASE_RATE = 3;        // % moisture increase per minute watering
  private readonly EVAPORATION_RATE = 0.6;         // % moisture loss per minute (when not watering)
  private readonly FERTILIZER_RATE = 20;           // % per minute (100% after 5 minutes)
  private readonly OVER_FERTILIZER_DEATH = 10;     // minutes until death from over-fertilization
  private readonly FERTILIZER_DECAY = 1;           // % decay per minute
  private readonly LIGHT_HEAT_EFFECT = 3 / 500;    // °C per lumen (3°C per 500 lumen)
  private readonly MAX_PLANT_SIZE = 15;            // cm - each plant needs 15x15cm space
  private readonly VENTILATION_EXCHANGE_TIME = 30; // minutes for complete air exchange

  // State tracking
  private ventilationStartTime: Map<number, number> = new Map();
  private overFertilizerTime: Map<string, number> = new Map();

  constructor() {
  }

  public getCurrentDay(): number {
    return this.currentDay;
  }

  public getMinuteOfDay(): number {
    return this.minuteOfTheDay;
  }

  public getCurrentEnvironmentData(): EnvironmentData {
    const dayIndex = this.currentDay % this.environmentData.length;
    return this.environmentData[dayIndex] || this.environmentData[0];
  }

  public async initialize(envData: EnvironmentData[]) {
    this.environmentData.push(...envData);
    console.log(`Loaded ${this.environmentData.length} days of environment data.`);
  }

  public async simulateAllGreenhouses(greenhouses: Map<number, GreenhouseData>) {
    // Get current environment data
    const envData = this.getCurrentEnvironmentData();

    // Update Greenhouse-level data
    greenhouses.forEach((greenhouse) => {
      this.updateGreenhouseEnvironment(greenhouse, envData);
      
      // Update each table
      greenhouse.tables.forEach(table => {
        this.updateTableData(table, greenhouse);
      });
    });

    this.minuteOfTheDay++;
    if (this.minuteOfTheDay >= 1440) {
      this.minuteOfTheDay = 0;
      this.currentDay++;
      console.log(`📅 Day ${this.currentDay} completed.`);
    }
  }

  private updateGreenhouseEnvironment(greenhouse: GreenhouseData, envData: EnvironmentData) {
    // Calculate light intensity with shading
    const baseLightIntensity = 1000; // Base light from sun
    greenhouse.lightIntensity = Math.round(baseLightIntensity * (1 - greenhouse.shading / 100));

    // Calculate temperature increase from light (500 lumen = 3°C increase)
    const lightHeatIncrease = greenhouse.lightIntensity * this.LIGHT_HEAT_EFFECT;

    // Handle ventilation
    if (greenhouse.fan) {
      if (!this.ventilationStartTime.has(greenhouse.id)) {
        this.ventilationStartTime.set(greenhouse.id, this.minuteOfTheDay);
      }
      
      const ventilationDuration = this.minuteOfTheDay - this.ventilationStartTime.get(greenhouse.id)!;
      
      // After 30 minutes, temperature approaches outside temperature
      if (ventilationDuration >= this.VENTILATION_EXCHANGE_TIME) {
        const tempDiff = greenhouse.temperature - envData.tavg;
        greenhouse.temperature -= tempDiff * 0.1; // Gradual cooling
      }
      
      // Reduce humidity towards outside level (complete exchange after 30 min)
      const humidityTarget = 60; // Assume outside humidity
      const humidityDiff = greenhouse.humidity - humidityTarget;
      greenhouse.humidity -= humidityDiff * (ventilationDuration / this.VENTILATION_EXCHANGE_TIME) * 0.05;
    } else {
      this.ventilationStartTime.delete(greenhouse.id);
      // No ventilation - temperature increases from light
      greenhouse.temperature += lightHeatIncrease / 60; // Gradual increase per minute
    }

    // Limit air humidity to MAX_HUMIDITY (excess escapes)
    if (greenhouse.humidity > this.MAX_HUMIDITY) {
      greenhouse.humidity = this.MAX_HUMIDITY;
    }

    // Ensure reasonable ranges
    greenhouse.temperature = Math.max(0, Math.min(70, greenhouse.temperature));
    greenhouse.humidity = Math.max(0, Math.min(100, greenhouse.humidity));
  }

  public async updateTableData(table: PlantTable, house: GreenhouseData) {
    const tableKey = `${house.id}-${table.id}`;

    // Check for death conditions
    if (table.plantCount <= 0 || table.plantSize <= 0) {  
      return;
    }

    // Check temperature death
    if (house.temperature > this.DEATH_TEMP) {
      table.plantCount = 0;
      table.plantSize = 0;
      console.log(`☠️ Table ${table.position}: All plants died from heat (${house.temperature.toFixed(1)}°C)!`);
      return;
    }

    // Check over-fertilization death
    if (table.soilFertility > 100) {
      if (!this.overFertilizerTime.has(tableKey)) {
        this.overFertilizerTime.set(tableKey, 0);
      }
      const overTime = this.overFertilizerTime.get(tableKey)! + 1;
      this.overFertilizerTime.set(tableKey, overTime);
      
      if (overTime >= this.OVER_FERTILIZER_DEATH) {
        table.plantCount = 0;
        table.plantSize = 0;
        console.log(`☠️ Table ${table.position}: All plants died from over-fertilization!`);
        this.overFertilizerTime.delete(tableKey);
        return;
      }
    } else {
      this.overFertilizerTime.delete(tableKey);
    }

    // Water management
    if (table.water) {
      // Watering is ON - increase moisture
      table.soilMoisture = Math.min(100, table.soilMoisture + this.WATER_INCREASE_RATE);
      
      // Fertilizer can only be applied when watering
      if (table.fertilizer) {
        table.soilFertility = Math.min(150, table.soilFertility + this.FERTILIZER_RATE); // Can go over 100%
      }
    } else {
      // Calculate evaporation: temperature and humidity dependent
      // Higher temperature = more evaporation
      // Higher humidity = less evaporation
      const tempFactor = Math.max(0, (house.temperature - 10) / 40); // Increase with temperature
      const humidityFactor = Math.max(0, 1 - house.humidity / 100); // Decrease with humidity
      
      const evaporationRate = this.EVAPORATION_RATE * tempFactor * humidityFactor;
      table.soilMoisture = Math.max(0, table.soilMoisture - evaporationRate);
    }

    // Fertilizer decay (1% per minute)
    if (table.soilFertility > 0) {
      table.soilFertility = Math.max(0, table.soilFertility - this.FERTILIZER_DECAY);
    }

    // Calculate growth factors
    const moistureFactor = this.calculateMoistureFactor(table.soilMoisture);
    const fertilityFactor = this.calculateFertilityFactor(table.soilFertility);
    const lightFactor = this.calculateLightFactor(house.lightIntensity, table.artLight);
    const temperatureFactor = this.calculateTemperatureFactor(house.temperature);

    // Calculate overall growth rate
    const growthRate = this.BASE_GROWTH_RATE * 
                       moistureFactor * 
                       fertilityFactor * 
                       lightFactor * 
                       temperatureFactor;

    // Update plant size
    if (growthRate > 0) {
      table.plantSize += growthRate;
    }

    // Check if plants are dying from drought
    if (table.soilMoisture < 10) {
      const deathCount = Math.ceil(table.plantCount * 0.01); // 1% die per minute
      table.plantCount = Math.max(0, table.plantCount - deathCount);
      if (this.logging) {
        console.log(`⚠️ Table ${table.position}: ${deathCount} plants dying from drought! Remaining: ${table.plantCount}`);
      }
    }

    // Check if 95% of plants are dead and replant
    if (table.plantCount < 24) { // 5% of 480 = 24 plants
      this.replantTable(table);
    }

    // Update table temperature (follows greenhouse temperature)
    table.temperature = house.temperature;

    // Check for harvest conditions (>= 30cm and moisture <= 50%)
    if (table.plantSize >= 30 && table.soilMoisture <= 50) {
      this.harvestPlants(table);
    }

    // Calculate maximum plants that can fit on the table
    const maxPlants = this.calculateMaxPlants(table.plantSize);
    
    // If plants are too big, reduce count (they push each other out)
    if (table.plantCount > maxPlants) {
      const plantsToRemove = table.plantCount - maxPlants;
      table.plantCount = maxPlants;
      if (this.logging) {
        console.log(`📦 Table ${table.position}: Removed ${plantsToRemove} plants (too crowded)`);
      }
    }

    if (this.logging) {
      console.log(`🌱 Table ${table.position}: ${table.plantCount} plants, ${table.plantSize.toFixed(1)}cm, moisture: ${table.soilMoisture.toFixed(1)}%`);
    }
  }

  private calculateMoistureFactor(moisture: number): number {
    // Optimal moisture: 50-80%
    if (moisture >= this.OPTIMAL_MOISTURE_MIN && moisture <= this.OPTIMAL_MOISTURE_MAX) return 1.0;
    if (moisture < this.OPTIMAL_MOISTURE_MIN) return moisture / this.OPTIMAL_MOISTURE_MIN;
    if (moisture > this.OPTIMAL_MOISTURE_MAX) return Math.max(0, (100 - moisture) / 20);
    return 0;
  }

  private calculateFertilityFactor(fertility: number): number {
    // Optimal fertility: 60-100%
    if (fertility >= 60 && fertility <= 100) return 1.0;
    if (fertility < 60) return fertility / 60;
    // Over-fertilization reduces growth
    if (fertility > 100) return Math.max(0, 1 - (fertility - 100) / 50);
    return 0;
  }

  private calculateLightFactor(houseLight: number, tableLight: number): number {
    const totalLight = houseLight + tableLight;
    // Optimal light: 400-800 lx
    if (totalLight >= 400 && totalLight <= 800) return 1.0;
    if (totalLight < 400) return totalLight / 400;
    return Math.max(0.5, 800 / totalLight);
  }

  private calculateTemperatureFactor(temp: number): number {
    // Growth possible from +5°C to +40°C
    // Optimal temperature: 22°C
    const optimalTemp = this.OPTIMAL_TEMP;
    
    // Below +5°C: no growth
    if (temp < 5) return 0;
    
    // +5°C to +22°C: gradual increase
    if (temp < optimalTemp) {
      return (temp - 5) / (optimalTemp - 5);
    }
    
    // Optimal at 22°C
    if (temp === optimalTemp) return 1.0;
    
    // +22°C to +40°C: gradual decrease
    if (temp <= 40) {
      return 1 - (temp - optimalTemp) / (40 - optimalTemp);
    }
    
    // Above +40°C: plants approach death at DEATH_TEMP
    return Math.max(0, 1 - (temp - 40) / (this.DEATH_TEMP - 40));
  }

  private calculateMaxPlants(plantSize: number): number {
    // Each plant needs 15cm x 15cm space when fully grown
    // Table is 60 x 8 = 480 plants at 2cm size
    // As plants grow, fewer fit on the table
    if (plantSize <= 2) return 480;
    
    // Calculate how many 15x15cm spaces fit on the table
    // Assuming table dimensions support 480 plants at 2cm (starting density)
    const sizeRatio = plantSize / this.MAX_PLANT_SIZE;
    const maxPlants = Math.floor(480 / (sizeRatio * sizeRatio));
    return Math.max(24, maxPlants); // Minimum 24 plants (5% of 480)
  }

  private harvestPlants(table: PlantTable): void {
    const harvestCount = Math.floor(table.plantCount * 0.95); // Harvest 95% of plants
    const remainingCount = table.plantCount - harvestCount;
    
    console.log(`🌾 HARVEST! Table ${table.position}: Harvested ${harvestCount} plants (${table.plantSize.toFixed(1)}cm)`);
    
    table.plantCount -= harvestCount;
    
    // Check if we need to replant (less than 5% plants remaining)
    if (table.plantCount < 24) { // 5% of 480 = 24 plants
      this.replantTable(table);
    }
  }

  private replantTable(table: PlantTable): void {
    console.log(`🌱 REPLANTING! Table ${table.position}: Planting new seedlings (2cm)`);
    table.plantCount = 480;
    table.plantSize = 2; // Reset to seedling size
    table.soilFertility = Math.min(100, table.soilFertility + 20); // Add some fertility
    table.plantedDate = this.currentDay;
  }

  public updateTime() {
    // Update Simulationtime
    this.minuteOfTheDay++;
    if (this.minuteOfTheDay >= 1440) {
      this.minuteOfTheDay = 0;
      this.currentDay++;
    }
  }


}