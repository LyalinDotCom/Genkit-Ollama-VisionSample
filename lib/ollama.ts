import { VISION_MODELS, type VisionModel } from './genkit/config';

export interface OllamaStatus {
  isRunning: boolean;
  models: string[];
  error?: string;
}

/**
 * Checks the status of the Ollama server and lists available vision models.
 */
export async function checkOllamaStatus(): Promise<OllamaStatus> {
  try {
    const response = await fetch(
      `${process.env.OLLAMA_SERVER_ADDRESS || 'http://127.0.0.1:11434'}/api/tags`,
      { method: 'GET', signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      throw new Error('Ollama server is not responding.');
    }

    const data = await response.json();
    
    const availableModels = data.models
      ?.map((m: any) => m.name)
      ?.filter((name: string) => Object.values(VISION_MODELS).includes(name as VisionModel)) || [];

    return {
      isRunning: true,
      models: availableModels,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cannot connect to Ollama.';
    return {
      isRunning: false,
      models: [],
      error: message,
    };
  }
}
