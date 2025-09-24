import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';
import { getCurrentAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const currentAdmin = await getCurrentAdmin(request);
    
    if (!currentAdmin) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Acesso negado. Apenas administradores podem alterar configurações.',
          code: 'UNAUTHORIZED'
        },
        { status: 403 }
      );
    }
    const { apiKey, secretKey, webhookUrl, environment } = await request.json();

    // Path to the .env.local file
    const envPath = path.join(process.cwd(), '.env.local');

    // Read current .env.local content
    let envContent = '';
    try {
      envContent = await readFile(envPath, 'utf8');
    } catch (error) {
      // File doesn't exist, create new content
      envContent = '';
    }

    // Update or add Xgate environment variables
    const xgateVars = {
      'XGATE_API_URL': environment === 'production' ? 'https://api.xgate.com/v1' : 'https://sandbox.xgate.com/v1',
      'XGATE_API_KEY': apiKey,
      'XGATE_WEBHOOK_SECRET': secretKey,
      'XGATE_PIX_KEY': 'your-pix-key@xgate.com', // This should be provided by Xgate
      'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    };

    // Split content into lines
    let envLines = envContent.split('\n');

    // Update or add each Xgate variable
    Object.entries(xgateVars).forEach(([key, value]) => {
      const existingIndex = envLines.findIndex(line => line.startsWith(`${key}=`));
      const newLine = `${key}=${value}`;
      
      if (existingIndex >= 0) {
        envLines[existingIndex] = newLine;
      } else {
        envLines.push(newLine);
      }
    });

    // Add a comment section for Xgate if it doesn't exist
    if (!envContent.includes('# Xgate API Configuration')) {
      const xgateSection = [
        '',
        '# Xgate API Configuration',
        ...Object.entries(xgateVars).map(([key, value]) => `${key}=${value}`),
        ''
      ];
      
      // Remove the individual lines we just added and replace with the section
      Object.keys(xgateVars).forEach(key => {
        const index = envLines.findIndex(line => line.startsWith(`${key}=`));
        if (index >= 0) {
          envLines.splice(index, 1);
        }
      });
      
      envLines.push(...xgateSection);
    }

    // Write back to file
    await writeFile(envPath, envLines.join('\n'), 'utf8');

    console.log('✅ Xgate configuration saved to .env.local');

    return NextResponse.json({
      success: true,
      message: 'Configurações da Xgate salvas com sucesso',
      envPath: envPath
    });

  } catch (error) {
    console.error('❌ Error saving Xgate configuration:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao salvar configurações da Xgate',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}