"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeService = void 0;
class RealtimeService {
    static clients = new Map();
    /**
     * Register a new SSE subscriber client
     */
    static addClient(clientId, userId, role, departmentId, res) {
        // Send initial SSE handshake headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        });
        const client = {
            id: clientId,
            userId,
            role,
            departmentId: departmentId || null,
            res,
        };
        this.clients.set(clientId, client);
        // Initial connection event
        res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);
        // Clean up when client disconnects
        res.on('close', () => {
            this.clients.delete(clientId);
        });
    }
    /**
     * Remove client manually
     */
    static removeClient(clientId) {
        this.clients.delete(clientId);
    }
    /**
     * Broadcast an event to filtered or all connected SSE clients
     */
    static broadcast(event, payload, targetFilter) {
        let deliveredCount = 0;
        const message = `event: ${event}\ndata: ${JSON.stringify({ event, payload, timestamp: new Date().toISOString() })}\n\n`;
        for (const [clientId, client] of this.clients.entries()) {
            if (targetFilter) {
                if (targetFilter.userIds && !targetFilter.userIds.includes(client.userId)) {
                    continue;
                }
                if (targetFilter.roles && !targetFilter.roles.includes(client.role)) {
                    continue;
                }
                if (targetFilter.departmentId && client.departmentId !== targetFilter.departmentId) {
                    continue;
                }
            }
            try {
                client.res.write(message);
                deliveredCount++;
            }
            catch (err) {
                // Connection died; remove client
                this.clients.delete(clientId);
            }
        }
        return { deliveredCount, totalClients: this.clients.size };
    }
    /**
     * Get total live connections
     */
    static getStats() {
        return {
            activeConnections: this.clients.size,
            connectedUserIds: Array.from(new Set(Array.from(this.clients.values()).map((c) => c.userId))),
        };
    }
}
exports.RealtimeService = RealtimeService;
