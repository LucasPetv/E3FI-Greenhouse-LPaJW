
// ===========================
// src/services/SensorSimulator.ts
// ===========================

import { PlantTable, EnvironmentData, GreenhouseData } from '../types/greenhouse.types';

export class SensorSimulator {

  private logging: boolean = true;
  private environmentData: EnvironmentData[] = [];
  private currentDay = 100;
  private minuteOfTheDay: number = 0;


  constructor() {
  }

  public getCurrentDay(): number {
    return this.currentDay;
  }

  public async initialize(envData: EnvironmentData[]) {
    this.environmentData.push(...envData);
    console.log(`Loaded ${this.environmentData.length} days of environment data.`);
  }

  public async simulateAllGreenhouses(greenhouses: Map<number, GreenhouseData>) {

    // Update Greenhouse data
    greenhouses.forEach((greenhouse) => {

      greenhouse.tables.forEach(table => {
        this.updateTableData(table, greenhouse);
      });
    });

    this.minuteOfTheDay++;
    if (this.minuteOfTheDay >= 1440) {
      this.minuteOfTheDay = 0;
      this.currentDay++;
      console.log(`Day ${this.currentDay.toFixed(1)}.`);
    }
  };


  public async updateTableData(table: PlantTable, house: GreenhouseData) {
    if (table.plantSize <= 0) {  // plants are dead
      return table;
    }


    table.plantSize += 0.001;
    if (this.logging) {
      console.log(`Table ${table.position} plant size: ${table.plantSize.toFixed(3)}`);
    }
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