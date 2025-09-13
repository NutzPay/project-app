import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const ips = await prisma.authorizedIP.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ ips });
  } catch (error) {
    console.error('Error fetching authorized IPs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { ipAddress, description } = await request.json();

    if (!ipAddress) {
      return NextResponse.json(
        { error: 'IP address is required' },
        { status: 400 }
      );
    }

    // Basic IP validation
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (!ipv4Regex.test(ipAddress) && !ipv6Regex.test(ipAddress)) {
      return NextResponse.json(
        { error: 'Invalid IP address format' },
        { status: 400 }
      );
    }

    // Check if IP already exists
    const existingIP = await prisma.authorizedIP.findUnique({
      where: { ipAddress }
    });

    if (existingIP) {
      return NextResponse.json(
        { error: 'IP address already exists' },
        { status: 409 }
      );
    }

    const ip = await prisma.authorizedIP.create({
      data: {
        ipAddress,
        description: description || null,
        isActive: true
      }
    });

    return NextResponse.json({ ip }, { status: 201 });
  } catch (error) {
    console.error('Error creating authorized IP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}