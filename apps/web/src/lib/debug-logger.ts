// Array global para armazenar logs
let debugLogs: string[] = [];

// Função para adicionar log
export function addDebugLog(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  debugLogs.push(logMessage);
  
  // Manter apenas os últimos 100 logs
  if (debugLogs.length > 100) {
    debugLogs = debugLogs.slice(-100);
  }
  
  console.log(logMessage); // Também log no console normal
}

// Função para obter logs
export function getDebugLogs(count = 50) {
  return debugLogs.slice(-count);
}

// Função para limpar logs
export function clearDebugLogs() {
  debugLogs = [];
}

// Função para obter contagem de logs
export function getDebugLogsCount() {
  return debugLogs.length;
}