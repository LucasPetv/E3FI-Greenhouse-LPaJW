
// ===========================
// src/services/GreenhouseManager.ts
// ===========================

import fs from "node:fs";
import { parse } from "csv-parse/sync";

import { EnvironmentData, GreenhouseData, PlantTable } from '../types/greenhouse.types';
import { SensorSimulator } from './SensorSimulator';
import { DatabaseService } from './DatabaseService';

export class GreenhouseManager {
  private greenhouses: Map<number, GreenhouseData> = new Map();
  private sensorSimulator: SensorSimulator;
  private simulationInterval: NodeJS.Timeout | null = null;
  private environmentData: EnvironmentData[] = [];
  private baseTimeStep: number = 100;  // Base: 100ms = 1 minute simulated
  private timeStep: number = 100;
  private simulationSpeed: number = 1; // 1x, 10x, 100x, etc.
  private databaseService: DatabaseService;
  private dataSaveInterval: NodeJS.Timeout | null = null;
  private saveIntervalTime: number = 60000; // Save every 60 seconds (1 minute) 

  constructor() {
    this.databaseService = new DatabaseService();
  }

  public async initializeManager() {
    await this.readEnvironmentData();
    console.log('🌱 Initializing Greenhouse Manager...');
    this.sensorSimulator = new SensorSimulator();
    await this.sensorSimulator.initialize(this.environmentData);
    this.initializeGreenhouses(this.sensorSimulator.getCurrentDay());
    this.startSimulation();
    this.startDataSaving();
  }

  private initializeGreenhouses(aDay: number): void {
    for (let i = 1; i <= 4; i++) {
      const tables: PlantTable[] = [];

      // Create 8 tables per greenhouse
      for (let j = 1; j <= 8; j++) {
        let aTable = {
          id: j,
          position: `G${i}T${j}`,
          temperature: 20,
          plantSize: 2,        // Starting size: 2cm
          plantCount: 480,     // 60 x 8 = 480 plants per table
          soilMoisture: 80,
          soilFertility: 100,
          artLight: 0,
          water: false,
          fertilizer: false,
          plantedDate: aDay
        }
        tables.push(aTable);

      }
      let greenhouse: GreenhouseData = {
        id: i,
        name: `G${i}`,
        lightIntensity: 500,
        temperature: 20,
        humidity: 60,
        fan: false,
        shading: 0, // 0-100%
        tables: tables
      };
      this.greenhouses.set(i, greenhouse);
    }
    console.log('🌱 Initialized 4 greenhouses with 8 tables each');
  }

  private startSimulation(): void {
    console.log('🔄 Start der Gewächshaus Simulation...');

    // Simulationsschritt: 0,1 Sekunden - entspricht 1 Minute in der Realität
    this.simulationInterval = setInterval(() => {
      this.sensorSimulator.simulateAllGreenhouses(this.greenhouses);
    }, this.timeStep);
  }

  private startDataSaving(): void {
    console.log('💾 Starting periodic data saving...');

    // Save data every minute
    this.dataSaveInterval = setInterval(() => {
      this.saveAllData();
    }, this.saveIntervalTime);
  }

  private saveAllData(): void {
    // Save data for each greenhouse
    this.greenhouses.forEach((greenhouse) => {
      // Save greenhouse-level data
      this.databaseService.saveGreenhouseData(greenhouse);

      // Save each table's data
      greenhouse.tables.forEach((table) => {
        this.databaseService.saveTableData(greenhouse.id, table);
      });
    });
  }

  public getAllGreenhouses(): GreenhouseData[] {
    return Array.from(this.greenhouses.values());
  }

  public getGreenhouse(id: number): GreenhouseData | undefined {
    return this.greenhouses.get(id);
  }

  public getTable(greenhouseId: number, tableId: number): PlantTable | undefined {
    const greenhouse = this.greenhouses.get(greenhouseId);
    return greenhouse?.tables.find(table => table.id === tableId);
  }

  public stop(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      console.log('⏹️ Greenhouse simulation stopped');
    }
    if (this.dataSaveInterval) {
      clearInterval(this.dataSaveInterval);
      console.log('💾 Data saving stopped');
    }
  }

  // Control methods for actuators
  public setTableWatering(greenhouseId: number, tableId: number, state: boolean): boolean {
    const table = this.getTable(greenhouseId, tableId);
    if (table) {
      table.water = state;
      console.log(`💧 Greenhouse ${greenhouseId}, Table ${tableId}: Watering ${state ? 'ON' : 'OFF'}`);
      return true;
    }
    return false;
  }

  public setTableFertilizer(greenhouseId: number, tableId: number, state: boolean): boolean {
    const table = this.getTable(greenhouseId, tableId);
    if (table) {
      table.fertilizer = state;
      console.log(`🌿 Greenhouse ${greenhouseId}, Table ${tableId}: Fertilizer ${state ? 'ON' : 'OFF'}`);
      return true;
    }
    return false;
  }

  public setGreenhouseFan(greenhouseId: number, state: boolean): boolean {
    const greenhouse = this.greenhouses.get(greenhouseId);
    if (greenhouse) {
      greenhouse.fan = state;
      console.log(`💨 Greenhouse ${greenhouseId}: Fan ${state ? 'ON' : 'OFF'}`);
      return true;
    }
    return false;
  }

  public setGreenhouseShading(greenhouseId: number, percentage: number): boolean {
    const greenhouse = this.greenhouses.get(greenhouseId);
    if (greenhouse && percentage >= 0 && percentage <= 100) {
      greenhouse.shading = percentage;
      console.log(`🌤️ Greenhouse ${greenhouseId}: Shading set to ${percentage}%`);
      return true;
    }
    return false;
  }

  public setTableLight(greenhouseId: number, tableId: number, lumens: number): boolean {
    const table = this.getTable(greenhouseId, tableId);
    if (table && lumens >= 0 && lumens <= 2000) {
      table.artLight = lumens;
      console.log(`💡 Greenhouse ${greenhouseId}, Table ${tableId}: Light set to ${lumens} lx`);
      return true;
    }
    return false;
  }

  public getCurrentEnvironment(): EnvironmentData | null {
    return this.sensorSimulator.getCurrentEnvironmentData();
  }

  public getSimulationStatus() {
    return {
      speed: this.simulationSpeed,
      timeStep: this.timeStep,
      currentDay: this.sensorSimulator.getCurrentDay(),
      currentMinute: this.sensorSimulator.getMinuteOfDay()
    };
  }

  public setSimulationSpeed(speed: number): boolean {
    if (speed > 0 && speed <= 1000) {
      this.simulationSpeed = speed;
      this.timeStep = Math.max(1, this.baseTimeStep / speed);
      
      // Restart simulation with new speed
      if (this.simulationInterval) {
        clearInterval(this.simulationInterval);
        this.startSimulation();
      }
      
      console.log(`⚡ Simulation speed set to ${speed}x (${this.timeStep}ms per minute)`);
      return true;
    }
    return false;
  }

  private async readEnvironmentData(this: GreenhouseManager) {

    let inputData = fs.readFileSync('./jahresdaten2024.csv', 'utf-8');
    const records = parse(inputData, {
      delimiter: ";",
    }
    );
    records.forEach(async (record: any) => {
      //date,tavg,tmin,tmax,prcp,snow,pres,tsun
      let envData: EnvironmentData = {
        date: new Date(), tavg: 0, tmin: 0, tmax: 0, prcp: 0,
        snow: 0, pres: 0, tsun: 0
      };

      let dateStr = record[0].slice(0, 10);
      let parts = dateStr.split(".");
      envData.date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
      envData.tavg = parseFloat(record[1].replace(",", "."));
      envData.tmin = parseFloat(record[2].replace(",", "."));
      envData.tmax = parseFloat(record[3].replace(",", "."));
      envData.prcp = parseFloat(record[4].replace(",", "."));
      envData.snow = parseFloat(record[5].replace(",", "."));
      envData.pres = parseFloat(record[6].replace(",", "."));
      envData.tsun = parseFloat(record[7].replace(",", "."));
      this.environmentData.push(envData);
    })
    console.log(`🌤️ Loaded ${records.length} environment data entries`);
  }

}
