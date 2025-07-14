import { extractTextFromImage } from '@/lib/genkit/flows';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  model: z.string(),
  imageBase64: z.string(),
  prompt: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received request body:', { model: body.model, promptLength: body.prompt?.length, hasImage: !!body.imageBase64 });
    
    // Validate request
    const validatedData = requestSchema.parse(body);
    
    // Check if Ollama is running and model is available
    const ollamaCheck = await fetch(
      `${process.env.OLLAMA_SERVER_ADDRESS || 'http://127.0.0.1:11434'}/api/tags`,
      { method: 'GET', signal: AbortSignal.timeout(5000) }
    ).catch(() => null);
    
    if (!ollamaCheck || !ollamaCheck.ok) {
      return NextResponse.json(
        { error: 'Ollama is not running. Please start Ollama first.' },
        { status: 503 }
      );
    }
    
    const ollamaData = await ollamaCheck.json();
    const availableModels = ollamaData.models?.map((m: any) => m.name) || [];
    
    if (!availableModels.includes(validatedData.model)) {
      return NextResponse.json(
        { 
          error: `Model ${validatedData.model} is not available in Ollama.`,
          details: `Please run: ollama pull ${validatedData.model}`,
          availableModels
        },
        { status: 400 }
      );
    }
    
    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Calling extractTextFromImage flow...');
          // Call the Genkit flow directly (it's already a function)
          const result = await extractTextFromImage({
            ...validatedData,
            outputFormat: 'text',
          });
          
          console.log('Flow completed successfully');
          // Send the result
          const finalData = `data: ${JSON.stringify(result)}\n\n`;
          controller.enqueue(encoder.encode(finalData));
          
          // Send done signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error: any) {
          console.error('Flow error:', error);
          const errorMessage = error.message || 'Unknown error';
          const errorData = `data: ${JSON.stringify({ error: errorMessage })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Request validation error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 }
    );
  }
}