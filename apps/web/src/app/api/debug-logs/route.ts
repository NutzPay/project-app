import { NextRequest, NextResponse } from 'next/server';
import { getDebugLogs, clearDebugLogs, getDebugLogsCount } from '@/lib/debug-logger';

export async function GET() {
  return NextResponse.json({
    success: true,
    count: getDebugLogsCount(),
    logs: getDebugLogs(50) // Últimos 50 logs
  });
}

export async function DELETE() {
  clearDebugLogs();
  return NextResponse.json({
    success: true,
    message: 'Debug logs cleared'
  });
}