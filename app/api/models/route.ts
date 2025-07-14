import { NextResponse } from 'next/server';
import { MODEL_INFO } from '@/lib/genkit/config';
import { checkOllamaStatus } from '@/lib/genkit/flows';

export async function GET() {
  try {
    // Check which models are actually available
    const status = await checkOllamaStatus();
    
    // Build model list with availability info
    const models = Object.entries(MODEL_INFO).map(([id, info]) => ({
      id,
      ...info,
      available: status.models.includes(id),
    }));
    
    return NextResponse.json({
      models,
      ollamaStatus: status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}