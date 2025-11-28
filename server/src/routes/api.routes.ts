
// ===========================
// src/routes/api.routes.ts
// ===========================

import { Router, Request, Response } from 'express';
import { GreenhouseManager } from '../services/GreenhouseManager';
import { ApiResponse } from '../types/greenhouse.types';

export class ApiRoutes {
  private router: Router;
  private greenhouseManager: GreenhouseManager;

  constructor(greenhouseManager: GreenhouseManager) {
    this.router = Router();
    this.greenhouseManager = greenhouseManager;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // GET /api/greenhouses - All greenhouses overview
    this.router.get('/greenhouses', (req: Request, res: Response) => {
      try {
        const greenhouses = this.greenhouseManager.getAllGreenhouses();
        const response: ApiResponse<typeof greenhouses> = {
          success: true,
          data: greenhouses,
          timestamp: new Date().toISOString()
        };
        res.json(response);
      } catch (error) {
        res.status(500).json({
          success: false,
          data: null,
          timestamp: new Date().toISOString(),
          error: 'Failed to fetch greenhouses'
        });
      }
    });

    // GET /api/greenhouses/:id/sensors - Specific greenhouse sensors
    this.router.get('/greenhouses/:id/sensors', (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const greenhouse = this.greenhouseManager.getGreenhouse(id);
        
        if (!greenhouse) {
          return res.status(404).json({
            success: false,
            data: null,
            timestamp: new Date().toISOString(),
            error: 'Greenhouse not found'
          });
        }

        const response: ApiResponse<typeof greenhouse> = {
          success: true,
          data: greenhouse,
          timestamp: new Date().toISOString()
        };
        res.json(response);
      } catch (error) {
        res.status(500).json({
          success: false,
          data: null,
          timestamp: new Date().toISOString(),
          error: 'Failed to fetch greenhouse sensors'
        });
      }
    });

    // GET /api/tables/:greenhouseId/:tableId - Specific table data
    this.router.get('/tables/:greenhouseId/:tableId', (req: Request, res: Response) => {
      try {
        const greenhouseId = parseInt(req.params.greenhouseId);
        const tableId = parseInt(req.params.tableId);
        
        const table = this.greenhouseManager.getTable(greenhouseId, tableId);
        
        if (!table) {
          return res.status(404).json({
            success: false,
            data: null,
            timestamp: new Date().toISOString(),
            error: 'Table not found'
          });
        }

        const response: ApiResponse<typeof table> = {
          success: true,
          data: table,
          timestamp: new Date().toISOString()
        };
        res.json(response);
      } catch (error) {
        res.status(500).json({
          success: false,
          data: null,
          timestamp: new Date().toISOString(),
          error: 'Failed to fetch table data'
        });
      }
    });

    // GET /api/health - Health check endpoint
    this.router.get('/health', (req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    });

    // POST /api/tables/:greenhouseId/:tableId/water - Control table watering
    this.router.post('/tables/:greenhouseId/:tableId/water', (req: Request, res: Response) => {
      try {
        const greenhouseId = parseInt(req.params.greenhouseId);
        const tableId = parseInt(req.params.tableId);
        const { state } = req.body;

        if (typeof state !== 'boolean') {
          return res.status(400).json({
            success: false,
            data: null,
            timestamp: new Date().toISOString(),
            error: 'State must be a boolean value'
          });
        }

        const success = this.greenhouseManager.setTableWatering(greenhouseId, tableId, state);

        if (!success) {
          return res.status(404).json({
            success: false,
            data: null,
            timestamp: new Date().toISOString(),
            error: 'Table not found'
          });
        }

        res.json({
          success: true,
          data: { greenhouseId, tableId, water: state },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          data: null,
          timestamp: new Date().toISOString(),
          error: 'Failed to control watering'
        });
      }
    });

    // POST /api/tables/:greenhouseId/:tableId/fertilizer - Control table fertilizer
    this.router.post('/tables/:greenhouseId/:tableId/fertilizer', (req: Request, res: Response) => {
      try {
        const greenhouseId = parseInt(req.params.greenhouseId);
        const tableId = parseInt(req.params.tableId);
        const { state } = req.body;

        if (typeof state !== 'boolean') {
          return res.status(400).json({
            success: false,
            data: null,
            timestamp: new Date().toISOString(),
            error: 'State must be a boolean value'
          });
        }

        const success = this.greenhouseManager.setTableFertilizer(greenhouseId, tableId, state);

        if (!success) {
          return res.status(404).json({
            success: false,
            data: null,
            timestamp: new Date().toISOString(),
            error: 'Table not found'
          });
        }

        res.json({
          success: true,
          data: { greenhouseId, tableId, fertilizer: state },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          data: null,
          timestamp: new Date().toISOString(),
          error: 'Failed to control fertilizer'
        });
      }
    });

    // POST /api/greenhouses/:id/fan - Control greenhouse fan
    this.router.post('/greenhouses/:id/fan', (req: Request, res: Response) => {
      try {
        const greenhouseId = parseInt(req.params.id);
        const { state } = req.body;

        if (typeof state !== 'boolean') {
          return res.status(400).json({
            success: false,
            data: null,
            timestamp: new Date().toISOString(),
            error: 'State must be a boolean value'
          });
        }

        const success = this.greenhouseManager.setGreenhouseFan(greenhouseId, state);

        if (!success) {
          return res.status(404).json({
            success: false,
            data: null,
            timestamp: new Date().toISOString(),
            error: 'Greenhouse not found'
          });
        }

        res.json({
          success: true,
          data: { greenhouseId, fan: state },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          data: null,
          timestamp: new Date().toISOString(),
          error: 'Failed to control fan'
        });
      }
    });

    // POST /api/greenhouses/:id/shading - Control greenhouse shading
    this.router.post('/greenhouses/:id/shading', (req: Request, res: Response) => {
      try {
        const greenhouseId = parseInt(req.params.id);
        const { percentage } = req.body;

        if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
          return res.status(400).json({
            success: false,
            data: null,
            timestamp: new Date().toISOString(),
            error: 'Percentage must be a number between 0 and 100'
          });
        }

        const success = this.greenhouseManager.setGreenhouseShading(greenhouseId, percentage);

        if (!success) {
          return res.status(404).json({
            success: false,
            data: null,
            timestamp: new Date().toISOString(),
            error: 'Greenhouse not found'
          });
        }

        res.json({
          success: true,
          data: { greenhouseId, shading: percentage },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          data: null,
          timestamp: new Date().toISOString(),
          error: 'Failed to control shading'
        });
      }
    });

    // POST /api/tables/:greenhouseId/:tableId/light - Control table artificial light
    this.router.post('/tables/:greenhouseId/:tableId/light', (req: Request, res: Response) => {
      try {
        const greenhouseId = parseInt(req.params.greenhouseId);
        const tableId = parseInt(req.params.tableId);
        const { lumens } = req.body;

        if (typeof lumens !== 'number' || lumens < 0 || lumens > 2000) {
          return res.status(400).json({
            success: false,
            data: null,
            timestamp: new Date().toISOString(),
            error: 'Invalid lumens value (must be 0-2000)'
          });
        }

        const success = this.greenhouseManager.setTableLight(greenhouseId, tableId, lumens);

        if (!success) {
          return res.status(404).json({
            success: false,
            data: null,
            timestamp: new Date().toISOString(),
            error: 'Table not found'
          });
        }

        res.json({
          success: true,
          data: { greenhouseId, tableId, lumens },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          data: null,
          timestamp: new Date().toISOString(),
          error: 'Failed to control table light'
        });
      }
    });

    // GET /api/environment/current - Get current environment data
    this.router.get('/environment/current', (req: Request, res: Response) => {
      try {
        const envData = this.greenhouseManager.getCurrentEnvironment();
        res.json({
          success: true,
          data: envData,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          data: null,
          timestamp: new Date().toISOString(),
          error: 'Failed to fetch environment data'
        });
      }
    });

    // GET /api/simulation/status - Get simulation status
    this.router.get('/simulation/status', (req: Request, res: Response) => {
      try {
        const status = this.greenhouseManager.getSimulationStatus();
        res.json({
          success: true,
          data: status,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          data: null,
          timestamp: new Date().toISOString(),
          error: 'Failed to fetch simulation status'
        });
      }
    });

    // POST /api/simulation/speed - Set simulation speed
    this.router.post('/simulation/speed', (req: Request, res: Response) => {
      try {
        const { speed } = req.body;

        if (typeof speed !== 'number' || ![1, 10, 100].includes(speed)) {
          return res.status(400).json({
            success: false,
            data: null,
            timestamp: new Date().toISOString(),
            error: 'Invalid speed value (must be 1, 10, or 100)'
          });
        }

        this.greenhouseManager.setSimulationSpeed(speed);

        res.json({
          success: true,
          data: { speed },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          data: null,
          timestamp: new Date().toISOString(),
          error: 'Failed to set simulation speed'
        });
      }
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}
