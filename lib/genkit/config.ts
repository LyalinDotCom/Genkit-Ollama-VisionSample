import { genkit } from 'genkit';
import { ollama } from 'genkitx-ollama';

// Initialize Genkit with Ollama plugin
export const ai = genkit({
  plugins: [
    ollama({
      serverAddress: process.env.OLLAMA_SERVER_ADDRESS || 'http://127.0.0.1:11434',
    }),
  ],
});

// Supported vision models
export const VISION_MODELS = {
  LLAVA_7B: 'llava:7b',
  LLAVA_13B: 'llava:13b',
  LLAVA_34B: 'llava:34b',
  GEMMA3_4B: 'gemma3:4b',
  GEMMA3_12B: 'gemma3:12b',
  GEMMA3_27B: 'gemma3:27b',
} as const;

export type VisionModel = typeof VISION_MODELS[keyof typeof VISION_MODELS];

// Model metadata for UI
export const MODEL_INFO = {
  [VISION_MODELS.GEMMA3_4B]: {
    name: 'Gemma 3 4B',
    size: '3.3GB',
    speed: 'Fast',
    accuracy: 'Very Good',
    description: 'Latest Google model with 128K context window',
    recommended: true,
  },
  [VISION_MODELS.GEMMA3_12B]: {
    name: 'Gemma 3 12B',
    size: '8.1GB',
    speed: 'Medium',
    accuracy: 'Excellent',
    description: 'Better accuracy for complex documents',
  },
  [VISION_MODELS.GEMMA3_27B]: {
    name: 'Gemma 3 27B',
    size: '17GB',
    speed: 'Slow',
    accuracy: 'Outstanding',
    description: 'Highest accuracy for challenging layouts',
  },
  [VISION_MODELS.LLAVA_7B]: {
    name: 'LLaVA 7B',
    size: '4.1GB',
    speed: 'Fast',
    accuracy: 'Good',
    description: 'Alternative vision model',
  },
  [VISION_MODELS.LLAVA_13B]: {
    name: 'LLaVA 13B',
    size: '7.3GB',
    speed: 'Medium',
    accuracy: 'Better',
    description: 'LLaVA with improved accuracy',
  },
  [VISION_MODELS.LLAVA_34B]: {
    name: 'LLaVA 34B',
    size: '20GB',
    speed: 'Slow',
    accuracy: 'Best',
    description: 'Largest LLaVA model',
  },
};