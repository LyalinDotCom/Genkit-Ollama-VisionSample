export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  details?: {
    families?: string[];
  };
}

export interface OllamaStatus {
  isRunning: boolean;
  models: string[];
  error?: string;
}

// Known vision-capable model patterns
const VISION_MODEL_PATTERNS = [
  /^llava/i,
  /^bakllava/i,
  /^gemma3/i,  // All Gemma 3 models support vision
  /^gemma.*vision/i,
  /^gemma2.*vision/i,
  /^qwen.*vl/i,
  /^minicpm-v/i,
  /^llama.*vision/i,
  /^moondream/i,
  /vision/i,
  /multimodal/i,
];

/**
 * Checks if a model supports vision capabilities based on its name and families.
 */
function isVisionModel(model: OllamaModel): boolean {
  // Check model name against patterns
  const modelName = model.name.toLowerCase();
  if (VISION_MODEL_PATTERNS.some(pattern => pattern.test(modelName))) {
    return true;
  }
  
  // Check model families if available
  if (model.details?.families) {
    const families = model.details.families.map(f => f.toLowerCase());
    return families.includes('clip') || families.includes('vision');
  }
  
  return false;
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
    
    // Filter for vision-capable models
    const visionModels = (data.models || [])
      .filter((m: OllamaModel) => isVisionModel(m))
      .map((m: OllamaModel) => m.name);

    return {
      isRunning: true,
      models: visionModels,
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
