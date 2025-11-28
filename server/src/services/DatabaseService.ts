// ===========================
// src/services/DatabaseService.ts
// ===========================

import fs from "node:fs";
import path from "node:path";
import { PlantTable, GreenhouseData } from "../types/greenhouse.types";

interface TableDataRecord {
  timestamp: Date;
  greenhouseId: number;
  tableId: number;
  position: string;
  plantSize: number;
  plantCount: number;
  temperature: number;
  soilMoisture: number;
  soilFertility: number;
  plantedDate: number;
}

interface GreenhouseDataRecord {
  timestamp: Date;
  greenhouseId: number;
  name: string;
  lightIntensity: number;
  humidity: number;
}

export class DatabaseService {
  private tableDataFile: string;
  private greenhouseDataFile: string;
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), "data");
    this.tableDataFile = path.join(this.dataDir, "table_data.jsonl");
    this.greenhouseDataFile = path.join(this.dataDir, "greenhouse_data.jsonl");
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      console.log("📁 Created data directory");
    }

    // Create files if they don't exist
    if (!fs.existsSync(this.tableDataFile)) {
      fs.writeFileSync(this.tableDataFile, "");
      console.log("📄 Created table_data.jsonl");
    }

    if (!fs.existsSync(this.greenhouseDataFile)) {
      fs.writeFileSync(this.greenhouseDataFile, "");
      console.log("📄 Created greenhouse_data.jsonl");
    }
  }

  // Store table data (called periodically)
  public saveTableData(
    greenhouseId: number,
    table: PlantTable
  ): void {
    const record: TableDataRecord = {
      timestamp: new Date(),
      greenhouseId,
      tableId: table.id,
      position: table.position,
      plantSize: table.plantSize,
      plantCount: table.plantCount,
      temperature: table.temperature,
      soilMoisture: table.soilMoisture,
      soilFertility: table.soilFertility,
      plantedDate: table.plantedDate,
    };

    this.appendToFile(this.tableDataFile, record);
  }

  // Store greenhouse data (called periodically)
  public saveGreenhouseData(greenhouse: GreenhouseData): void {
    const record: GreenhouseDataRecord = {
      timestamp: new Date(),
      greenhouseId: greenhouse.id,
      name: greenhouse.name,
      lightIntensity: greenhouse.lightIntensity,
      humidity: greenhouse.humidity,
    };

    this.appendToFile(this.greenhouseDataFile, record);
  }

  private appendToFile(filePath: string, data: any): void {
    try {
      const jsonLine = JSON.stringify(data) + "\n";
      fs.appendFileSync(filePath, jsonLine, "utf-8");
    } catch (error) {
      console.error(`❌ Error writing to ${filePath}:`, error);
    }
  }

  // Read all table data (for analysis)
  public readTableData(): TableDataRecord[] {
    return this.readJsonLines<TableDataRecord>(this.tableDataFile);
  }

  // Read all greenhouse data (for analysis)
  public readGreenhouseData(): GreenhouseDataRecord[] {
    return this.readJsonLines<GreenhouseDataRecord>(this.greenhouseDataFile);
  }

  private readJsonLines<T>(filePath: string): T[] {
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }

      const content = fs.readFileSync(filePath, "utf-8");
      if (!content.trim()) {
        return [];
      }

      return content
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line) as T);
    } catch (error) {
      console.error(`❌ Error reading ${filePath}:`, error);
      return [];
    }
  }
}
