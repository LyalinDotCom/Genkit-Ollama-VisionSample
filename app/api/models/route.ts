import { appRoute } from '@genkit-ai/next';
import { getAvailableModels } from '@/lib/genkit/flows';

// Use the appRoute helper to expose the flow as an API endpoint
export const POST = appRoute(getAvailableModels);