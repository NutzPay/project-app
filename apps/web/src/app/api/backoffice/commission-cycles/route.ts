import { NextRequest, NextResponse } from 'next/server';
import { commissionService } from '@/lib/commissionService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salesRepId = searchParams.get('salesRepId');
    const action = searchParams.get('action');

    if (action === 'active') {
      const activeCycles = await commissionService.getActiveCycles();
      return NextResponse.json({ cycles: activeCycles });
    }

    if (action === 'stats') {
      const stats = await commissionService.getCommissionStats(salesRepId || undefined);
      return NextResponse.json({ stats });
    }

    if (action === 'performance' && salesRepId) {
      const performance = await commissionService.getSalesRepCyclePerformance(salesRepId);
      return NextResponse.json({ performance });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in commission cycles API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, cycleType, cycleId } = body;

    if (action === 'create-missing') {
      await commissionService.createMissingCycles(cycleType || 'WEEKLY');
      return NextResponse.json({ message: 'Missing cycles created successfully' });
    }

    if (action === 'calculate-commissions' && cycleId) {
      await commissionService.calculateCycleCommissions(cycleId);
      return NextResponse.json({ message: 'Commissions calculated successfully' });
    }

    if (action === 'complete-cycle' && cycleId) {
      await commissionService.completeCycle(cycleId);
      return NextResponse.json({ message: 'Cycle completed successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in commission cycles POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { periodEarningId, paymentReference } = body;

    if (!periodEarningId) {
      return NextResponse.json({ error: 'Period earning ID is required' }, { status: 400 });
    }

    await commissionService.markPeriodEarningAsPaid(periodEarningId, paymentReference);
    return NextResponse.json({ message: 'Period earning marked as paid' });

  } catch (error) {
    console.error('Error marking period earning as paid:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}