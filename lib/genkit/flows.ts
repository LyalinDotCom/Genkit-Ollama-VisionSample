import { z } from 'zod';
import { ai, VISION_MODELS, type VisionModel } from './config';
import { generate } from 'genkit';

// Input validation schema
export const imageExtractionInputSchema = z.object({
  imageBase64: z.string().describe('Base64 encoded image data'),
  model: z.enum([
    VISION_MODELS.LLAVA_7B,
    VISION_MODELS.LLAVA_13B,
    VISION_MODELS.LLAVA_34B,
    VISION_MODELS.GEMMA3_4B,
    VISION_MODELS.GEMMA3_12B,
    VISION_MODELS.GEMMA3_27B,
  ]).optional().default(VISION_MODELS.GEMMA3_4B).describe('Vision model to use'),
  prompt: z.string().optional().default('Extract all text from this image. Include any handwritten text, printed text, or text in UI elements. Format the output clearly.').describe('Custom prompt for text extraction'),
  outputFormat: z.enum(['text', 'json', 'markdown']).optional().default('text').describe('Output format for extracted text'),
});

// Output schema
export const imageExtractionOutputSchema = z.object({
  extractedText: z.string().describe('The text extracted from the image'),
  metadata: z.object({
    model: z.string(),
    processingTime: z.number(),
    imageSize: z.number(),
    confidence: z.string().optional(),
  }).describe('Metadata about the extraction process'),
});

// Main image text extraction flow
export const extractTextFromImage = ai.defineFlow(
  {
    name: 'extractTextFromImage',
    inputSchema: imageExtractionInputSchema,
    outputSchema: imageExtractionOutputSchema,
    streamSchema: z.string(), // Enable streaming
  },
  async (input, { sendChunk }) => {
    const startTime = Date.now();

    try {
      // Calculate image size from base64
      const imageSize = Buffer.from(input.imageBase64, 'base64').length;

      // Validate image size (max 10MB)
      if (imageSize > 10 * 1024 * 1024) {
        throw new Error('Image size exceeds 10MB limit');
      }

      console.log(`Processing image (${(imageSize / 1024).toFixed(2)}KB) with model: ${input.model}`);

      // Send initial status
      sendChunk('Starting text extraction...\n');

      const response = await generate({
        model: `ollama/${input.model}`,
        prompt: [
          { text: input.prompt },
          { image: { base64: input.imageBase64 } },
        ],
        config: {
          temperature: 0.3,
        },
      });

      const extractedText = response.text();
      const processingTime = Date.now() - startTime;

      // Format output based on requested format
      let formattedText = extractedText;
      if (input.outputFormat === 'json') {
        try {
          formattedText = JSON.stringify(
            {
              text: extractedText,
              lines: extractedText.split('\n').filter((line: string) => line.trim()),
              wordCount: extractedText.split(/\s+/).filter((word: string) => word).length,
            },
            null,
            2
          );
        } catch {
          formattedText = extractedText;
        }
      } else if (input.outputFormat === 'markdown') {
        formattedText = `# Extracted Text\n\n${extractedText}`;
      }

      // Send final chunk
      sendChunk(`\nExtraction complete! Processing time: ${processingTime}ms`);

      return {
        extractedText: formattedText,
        metadata: {
          model: input.model,
          processingTime,
          imageSize,
          confidence: 'High',
        },
      };
    } catch (error) {
      console.error('Error processing image:', error);

      let errorMessage = 'Failed to extract text from image';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        extractedText: '',
        metadata: {
          model: input.model,
          processingTime: Date.now() - startTime,
          imageSize: 0,
          confidence: 'Error: ' + errorMessage,
        },
      };
    }
  }
);

// Check Ollama status flow
export const checkOllamaStatus = ai.defineFlow(
  {
    name: 'checkOllamaStatus',
    outputSchema: z.object({
      isRunning: z.boolean(),
      models: z.array(z.string()),
      error: z.string().optional(),
    }),
  },
  async () => {
    try {
      const response = await fetch(
        `${process.env.OLLAMA_SERVER_ADDRESS || 'http://127.0.0.1:11434'}/api/tags`,
        { method: 'GET', signal: AbortSignal.timeout(5000) }
      );

      if (!response.ok) {
        throw new Error('Cannot connect to Ollama. Make sure it is running.');
      }

      const data = await response.json();
      const models = data.models
        ?.map((m: any) => m.name)
        ?.filter((name: string) => Object.values(VISION_MODELS).includes(name as VisionModel)) || [];

      return {
        isRunning: true,
        models,
      };
    } catch (error) {
      return {
        isRunning: false,
        models: [],
        error: 'Cannot connect to Ollama. Make sure it is running.',
      };
    }
  }
);