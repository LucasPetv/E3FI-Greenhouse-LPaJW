
// ===========================
// src/services/WebSocketService.ts
// ===========================

import WebSocket from 'ws';
import { GreenhouseManager } from './GreenhouseManager';

export class WebSocketService {
  private wss: WebSocket.Server;
  private greenhouseManager: GreenhouseManager;
  private broadcastInterval: NodeJS.Timeout | null = null;
  private port: number;

  constructor(port: number, greenhouseManager: GreenhouseManager) {
    this.greenhouseManager = greenhouseManager;
    this.port = port;
    this.wss = new WebSocket.Server({ port });
    this.setupWebSocket();
    this.startBroadcast();
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('🔌 New WebSocket connection established');
      
      // Send current data immediately
      this.sendDataToClient(ws);
      
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          console.log('📨 Received message:', data);
          
          // Handle different message types
          if (data.type === 'subscribe') {
            // Client wants to subscribe to specific greenhouse
            ws.send(JSON.stringify({
              type: 'subscription_confirmed',
              greenhouse_id: data.greenhouse_id,
              timestamp: new Date().toISOString()
            }));
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
      });
      
      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    });
    
    console.log(`🌐 WebSocket server listening on port ${this.port}`);
  }

  private startBroadcast(): void {
    // Broadcast updates every 30 seconds
    this.broadcastInterval = setInterval(() => {
      this.broadcastToAllClients();
    }, 30000);
  }

  private sendDataToClient(ws: WebSocket): void {
    if (ws.readyState === WebSocket.OPEN) {
      const data = {
        type: 'sensor_update',
        data: this.greenhouseManager.getAllGreenhouses(),
        timestamp: new Date().toISOString()
      };
      ws.send(JSON.stringify(data));
    }
  }

  private broadcastToAllClients(): void {
    const data = {
      type: 'sensor_update',
      data: this.greenhouseManager.getAllGreenhouses(),
      timestamp: new Date().toISOString()
    };
    
    const message = JSON.stringify(data);
    let clientCount = 0;
    
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        clientCount++;
      }
    });
    
    if (clientCount > 0) {
      console.log(`📡 Broadcasted sensor data to ${clientCount} clients`);
    }
  }

  public stop(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
    }
    this.wss.close();
    console.log('🔌 WebSocket service stopped');
  }
}