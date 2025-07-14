import { genkit } from 'genkit';
import { ollama } from 'genkitx-ollama';

// Initialize Genkit with Ollama plugin using new syntax
export const ai = genkit({
  plugins: [
    ollama({
      serverAddress: process.env.OLLAMA_SERVER_ADDRESS || 'http://127.0.0.1:11434',
    }),
  ],
});

// Known vision model patterns - used for UI display hints
const KNOWN_VISION_MODELS: Record<string, { name: string; description: string }> = {
  'llava': { name: 'LLaVA', description: 'Efficient multimodal vision model' },
  'llava-llama3': { name: 'LLaVA Llama 3', description: 'LLaVA with Llama 3 base' },
  'llava-phi3': { name: 'LLaVA Phi 3', description: 'LLaVA with Phi 3 base' },
  'bakllava': { name: 'BakLLaVA', description: 'Alternative LLaVA implementation' },
  'llava-v1.6-mistral': { name: 'LLaVA v1.6 Mistral', description: 'LLaVA with Mistral base' },
  'gemma3': { name: 'Gemma 3', description: 'Google\'s latest multimodal model with vision capabilities' },
  'gemma': { name: 'Gemma', description: 'Google\'s multimodal model' },
  'gemma2': { name: 'Gemma 2', description: 'Google\'s Gemma 2 model' },
  'qwen2-vl': { name: 'Qwen2 VL', description: 'Qwen vision-language model' },
  'minicpm-v': { name: 'MiniCPM-V', description: 'Efficient vision model' },
  'llama3.2-vision': { name: 'Llama 3.2 Vision', description: 'Meta\'s vision model' },
  'moondream': { name: 'Moondream', description: 'Lightweight vision model' },
};

// Helper to get friendly model info
export function getModelDisplayInfo(modelId: string): { name: string; description: string } {
  // Check for exact match
  if (KNOWN_VISION_MODELS[modelId]) {
    return KNOWN_VISION_MODELS[modelId];
  }
  
  // Check for prefix match (e.g., "llava:7b" matches "llava")
  const baseModel = modelId.split(':')[0];
  if (KNOWN_VISION_MODELS[baseModel]) {
    const size = modelId.split(':')[1];
    return {
      name: `${KNOWN_VISION_MODELS[baseModel].name} ${size?.toUpperCase() || ''}`.trim(),
      description: KNOWN_VISION_MODELS[baseModel].description,
    };
  }
  
  // Default: capitalize and clean up the model ID
  return {
    name: modelId.split(':').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' '),
    description: 'Vision-capable model',
  };
}