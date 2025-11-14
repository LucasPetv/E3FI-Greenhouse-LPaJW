
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
  }

  public getRouter(): Router {
    return this.router;
  }
}
