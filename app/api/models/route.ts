import { NextResponse } from 'next/server';
import { getModelDisplayInfo } from '@/lib/genkit/config';
import { checkOllamaStatus } from '@/lib/ollama';

export async function GET() {
  try {
    // Check which models are actually available
    const status = await checkOllamaStatus();
    
    // Build model list from discovered models
    const models = status.models.map(modelId => {
      const displayInfo = getModelDisplayInfo(modelId);
      
      // Get size from Ollama API if available
      const sizeInfo = modelId.includes(':') ? modelId.split(':')[1] : '';
      
      return {
        id: modelId,
        name: displayInfo.name,
        description: displayInfo.description,
        size: sizeInfo || 'Unknown',
        available: true,
        // Prefer gemma3 models
        recommended: modelId.toLowerCase().startsWith('gemma3'),
      };
    });
    
    // Sort models: recommended first, then alphabetically
    models.sort((a, b) => {
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      return a.name.localeCompare(b.name);
    });
    
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