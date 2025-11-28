
// ===========================
// src/server.ts
// ===========================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { GreenhouseManager } from './services/GreenhouseManager';
import { ApiRoutes } from './routes/api.routes';
import { WebSocketService } from './services/WebSocketService';

class GreenhouseServer {
  private app: express.Application;
  private greenhouseManager: GreenhouseManager;
  private webSocketService: WebSocketService;
  private port: number;
  private wsPort: number;

  constructor() {
    this.port = parseInt(process.env.PORT || '3000');
    this.wsPort = parseInt(process.env.WS_PORT || '3001');
    
    this.app = express();
    this.app.use(express.json());

    this.greenhouseManager = new GreenhouseManager();
    this.greenhouseManager.initializeManager();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(morgan('combined'));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // API routes
    const apiRoutes = new ApiRoutes(this.greenhouseManager);
    this.app.use('/api', apiRoutes.getRouter());
    
    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Greenhouse Simulation Server',
        version: '1.0.0',
        endpoints: {
          greenhouses: '/api/greenhouses',
          specific_greenhouse: '/api/greenhouses/:id/sensors',
          specific_table: '/api/tables/:greenhouseId/:tableId',
          health: '/api/health',
          websocket: `ws://localhost:${this.wsPort}`
        },
        timestamp: new Date().toISOString()
      });
    });
  }

  private setupWebSocket(): void {
    this.webSocketService = new WebSocketService(this.wsPort, this.greenhouseManager);
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        data: null,
        timestamp: new Date().toISOString(),
        error: 'Endpoint not found'
      });
    });
    
    // Global error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('❌ Unhandled error:', err);
      res.status(500).json({
        success: false,
        data: null,
        timestamp: new Date().toISOString(),
        error: 'Internal server error'
      });
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log('🚀 ==========================================');
      console.log('🌱 GREENHOUSE SIMULATION SERVER STARTED');
      console.log('🚀 ==========================================');
      console.log(`🌐 HTTP Server running on: http://localhost:${this.port}`);
      console.log(`🔌 WebSocket Server running on: ws://localhost:${this.wsPort}`);
      console.log('📊 API Endpoints:');
      console.log(`   GET  /api/greenhouses`);
      console.log(`   GET  /api/greenhouses/:id/sensors`);
      console.log(`   GET  /api/tables/:greenhouseId/:tableId`);
      console.log(`   GET  /api/health`);
      console.log('🔄 Simulation running every 30 seconds');
      console.log('🚀 ==========================================');
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      this.greenhouseManager.stop();
      this.webSocketService.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      this.greenhouseManager.stop();
      this.webSocketService.stop();
      process.exit(0);
    });
  }
}

// Start the server
const server = new GreenhouseServer();
server.start();