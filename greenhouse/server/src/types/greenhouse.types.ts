// ===========================
// src/types/greenhouse.types.ts
// ===========================

// data storage for outside environmental sensors
//1 date	Datum
//2	tavg	Durchschnittstemperatur
//3	tmin	Min. Temperatur
//4	tmax	Max. Temperatur
//5	prcp	Gesamtniederschlag
//6	snow	Schneehöhe
//7	wdir	Windrichtung
//8	wspd	Windgeschwindigkeit
//9	wpgt	Spitzenböe
//10	pres	Luftdruck
//11	tsun	Sonnenscheindauer
export interface EnvironmentData {
  date:	Date,
  tavg:	number,
  tmin:	number,
  tmax: number,
  prcp:	number,
  snow:	number,
  pres:	number,
  tsun:	number
}

// export data structure for nosql-database
export interface PlantTableStorage {
  id: number,
  temperature: number;    // °C
  plantSize: number;       // %
  soilMoisture: number; // lx
  timestamp: Date;
}


// topic names as shortcuts behind 
export interface PlantTable {
  id: number;
  position: string;        // A1, A2, B1, etc.
  plantSize: number;
  temperature: number;    // °C 
  soilMoisture: number;    // %
  soilFertility: number; // %
  artLight: number;
  water: boolean;
  fertilizer: boolean;
  plantedDate: number;  // day in the year
}

export interface GreenhouseData {
  id: number;
  name: string;
  lightIntensity: number;  // lx
  temperature: number;
  humidity: number;        // %
  fan: boolean;
  shading: number;
  tables: PlantTable[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  metadata?: any;
}