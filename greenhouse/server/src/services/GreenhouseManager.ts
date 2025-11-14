
// ===========================
// src/services/GreenhouseManager.ts
// ===========================

import fs from "node:fs";
import { parse } from "csv-parse/sync";

import { EnvironmentData, GreenhouseData, PlantTable } from '../types/greenhouse.types';
import { SensorSimulator } from './SensorSimulator';

export class GreenhouseManager {
  private greenhouses: Map<number, GreenhouseData> = new Map();
  private sensorSimulator: SensorSimulator;
  private simulationInterval: NodeJS.Timeout | null = null;
  private environmentData: EnvironmentData[] = [];
  private timeStep: number = 1000;  // zu Testzwecken 10 oder 1 statt 100 

  constructor() {
  }

  public async initializeManager() {
    await this.readEnvironmentData();
    console.log('🌱 Initializing Greenhouse Manager...');
    this.sensorSimulator = new SensorSimulator();
    await this.sensorSimulator.initialize(this.environmentData);
    this.initializeGreenhouses(this.sensorSimulator.getCurrentDay());
    this.startSimulation();
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
          plantSize: 10,
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
  }

  private async readEnvironmentData(this: GreenhouseManager) {

    let inputData = fs.readFileSync('./jahresdaten2024.csv', 'utf-8');
    const records = parse(inputData, {
      delimiter: ";",
    }
    );
    records.forEach(async (record) => {
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
