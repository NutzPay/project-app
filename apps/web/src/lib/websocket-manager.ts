// Store WebSocket connections by transaction ID
const connections = new Map<string, Set<WebSocket>>();

// Function to add a WebSocket connection
export function addConnection(transactionId: string, socket: WebSocket) {
  if (!connections.has(transactionId)) {
    connections.set(transactionId, new Set());
  }
  connections.get(transactionId)?.add(socket);
}

// Function to remove a WebSocket connection
export function removeConnection(transactionId: string, socket: WebSocket) {
  const transactionConnections = connections.get(transactionId);
  if (transactionConnections) {
    transactionConnections.delete(socket);
    
    // Clean up empty sets
    if (transactionConnections.size === 0) {
      connections.delete(transactionId);
    }
  }
}

// Function to broadcast payment updates to all connected clients for a transaction
export function broadcastPaymentUpdate(transactionId: string, status: any) {
  const transactionConnections = connections.get(transactionId);
  
  if (!transactionConnections || transactionConnections.size === 0) {
    console.log('📡 No WebSocket connections for transaction:', transactionId);
    return;
  }

  const message = JSON.stringify({
    transactionId,
    status: status.status,
    usdtAmount: status.usdtAmount,
    brlAmount: status.brlAmount,
    timestamp: new Date().toISOString(),
    message: status.message,
    type: 'payment_update'
  });

  console.log(`📡 Broadcasting payment update to ${transactionConnections.size} connections:`, transactionId);

  // Send to all connected clients for this transaction
  transactionConnections.forEach((socket) => {
    try {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      } else {
        // Remove closed connections
        transactionConnections.delete(socket);
      }
    } catch (error) {
      console.error('❌ Error sending WebSocket message:', error);
      transactionConnections.delete(socket);
    }
  });

  // Clean up empty connection sets
  if (transactionConnections.size === 0) {
    connections.delete(transactionId);
  }
}

// Alias for backward compatibility
export { broadcastPaymentUpdate as broadcast };