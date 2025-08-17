# Build a Vision Text Extractor with Genkit, Ollama, and Next.js

Learn how to build a local app that extracts text from images using locally served vision models via Ollama, starting with a simple Genkit flow and building up to a full Next.js application with drag-and-drop UI.

## Prerequisites

- Node.js v18+ and npm
- [Ollama](https://ollama.com) installed and running locally
- A vision model installed, for example: `ollama pull llava` or `ollama pull gemma2:2b`

## Part 1: Set Up the Core Genkit Flow

### Step 1: Initialize the project

```bash
npx create-next-app@latest genkit-vision-nextjs --ts --use-npm --eslint
cd genkit-vision-nextjs
```

Accept the defaults when prompted (No to Tailwind, No to src directory, etc.)

### Step 2: Install Genkit dependencies

```bash
npm install genkit genkitx-ollama zod
npm install -D tsx
```

### Step 3: Configure Genkit with Ollama

Create the Genkit configuration file:

```bash
mkdir -p lib/genkit
```

Create `lib/genkit/config.ts`:

```typescript
import { genkit } from 'genkit';
import { ollama } from 'genkitx-ollama';

export const ai = genkit({
  plugins: [
    ollama({
      serverAddress: process.env.OLLAMA_SERVER_ADDRESS || 'http://127.0.0.1:11434',
    }),
  ],
});
```

### Step 4: Create the text extraction flow

Create `lib/genkit/flows.ts` with streaming support:

```typescript
import { z } from 'zod';
import { ai } from './config';
import { ollama } from 'genkitx-ollama';

// Define input schema
export const imageExtractionInput = z.object({
  imageBase64: z.string(),
  model: z.string().default('llava'), // or your preferred model
  prompt: z.string().optional().default('Extract all text from this image.'),
});

// Define the flow with streaming support
export const extractTextFromImage = ai.defineFlow(
  {
    name: 'extractTextFromImage',
    inputSchema: imageExtractionInput,
    outputSchema: z.object({ extractedText: z.string() }),
    streamSchema: z.string(), // Enable streaming for UI
  },
  async (input, { sendChunk }) => {
    const { response, stream } = await ai.generateStream({
      model: ollama.model(input.model),
      prompt: [
        { text: input.prompt },
        { media: { 
          contentType: 'image/jpeg', 
          url: `data:image/jpeg;base64,${input.imageBase64}` 
        }},
      ],
      config: { temperature: 0.3 },
    });

    // Stream chunks for real-time UI feedback
    if (sendChunk) {
      for await (const chunk of stream) {
        sendChunk(chunk.text);
      }
    }
    
    const final = await response;
    return { extractedText: final.text };
  }
);
```

### Step 5: Add Genkit scripts to package.json

Update your `package.json` scripts section:

```json
{
  "scripts": {
    "dev": "next dev --turbopack -p 9002",
    "genkit:start": "genkit start -- tsx lib/genkit/flows.ts",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  }
}
```

### Step 6: Test the flow with Genkit Developer UI

Start the Genkit runtime:

```bash
npm run genkit:start
```

This will:
1. Start the Genkit runtime
2. Open the Developer UI at http://localhost:4000

#### Testing in the Developer UI:

1. Navigate to http://localhost:4000
2. Click on **"Flows"** in the left sidebar
3. Select **"extractTextFromImage"**
4. In the input panel, provide a JSON object with a base64 encoded image:

```json
{
  "imageBase64": "YOUR_BASE64_IMAGE_STRING_HERE",
  "model": "llava",
  "prompt": "Extract all text from this image."
}
```

**Tip:** To quickly get a base64 string from an image:
- On macOS/Linux: `base64 -i your-image.jpg | pbcopy`
- Or use an online converter temporarily for testing

5. Click **"Run"** and observe the extracted text in the output panel

Great! Your Genkit flow is working. Now let's build a user-friendly interface.

## Part 2: Build the Next.js Application

### Step 7: Install Next.js integration

```bash
npm install @genkit-ai/next
```

### Step 8: Create API route

Create the directory and file `app/api/extract-text/route.ts`:

```bash
mkdir -p app/api/extract-text
```

```typescript
import { appRoute } from '@genkit-ai/next';
import { extractTextFromImage } from '@/lib/genkit/flows';

export const POST = appRoute(extractTextFromImage);
```

This single line exposes your Genkit flow as a Next.js API endpoint!

### Step 9: Create the interactive UI with drag-and-drop

Replace the contents of `app/page.tsx`:

```tsx
"use client";
import { useState, useCallback } from 'react';
import { streamFlow } from '@genkit-ai/next/client';
import type { extractTextFromImage } from '@/lib/genkit/flows';

export default function HomePage() {
  const [model, setModel] = useState('llava');
  const [prompt, setPrompt] = useState('Extract all text from this image.');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  async function toBase64(file: File): Promise<string> {
    const buf = await file.arrayBuffer();
    return Buffer.from(buf).toString('base64');
  }

  const processFile = useCallback(async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setOutput('');
    setBusy(true);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const imageBase64 = await toBase64(file);
      const { stream, output } = streamFlow<typeof extractTextFromImage>({
        url: '/api/extract-text',
        input: { model, imageBase64, prompt },
      });
      
      // Stream the response
      for await (const chunk of stream) {
        setOutput(prev => prev + chunk);
      }
      
      const final = await output;
      setOutput(final.extractedText);
    } catch (error) {
      console.error('Error:', error);
      setOutput('Error processing image. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [model, prompt]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>🔍 Vision Text Extractor</h1>
      <p>Extract text from images using local AI models via Ollama</p>
      
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Model:
            <input 
              value={model} 
              onChange={e => setModel(e.target.value)}
              style={{ 
                width: '100%', 
                padding: 8, 
                marginTop: 4,
                border: '1px solid #ccc',
                borderRadius: 4
              }}
              placeholder="e.g., llava, gemma2:2b"
            />
          </label>
        </div>
        <div style={{ flex: 2 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Prompt:
            <input 
              value={prompt} 
              onChange={e => setPrompt(e.target.value)}
              style={{ 
                width: '100%', 
                padding: 8, 
                marginTop: 4,
                border: '1px solid #ccc',
                borderRadius: 4
              }}
            />
          </label>
        </div>
      </div>

      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `3px dashed ${isDragging ? '#0070f3' : '#ccc'}`,
          borderRadius: 8,
          padding: 40,
          textAlign: 'center',
          backgroundColor: isDragging ? '#f0f8ff' : '#fafafa',
          marginBottom: 20,
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
      >
        <p style={{ margin: 0, fontSize: 18, color: '#666' }}>
          📁 Drag & drop an image here
        </p>
        <p style={{ margin: '10px 0', color: '#999' }}>or</p>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileSelect}
          disabled={busy}
          style={{ fontSize: 16 }}
        />
      </div>

      {imagePreview && (
        <div style={{ marginBottom: 20 }}>
          <h3>Preview:</h3>
          <img 
            src={imagePreview} 
            alt="Preview" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: 300, 
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }} 
          />
        </div>
      )}

      <div style={{ 
        backgroundColor: '#1a1a1a',
        color: '#0f0',
        padding: 20,
        borderRadius: 8,
        minHeight: 200,
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        {output || (busy ? '⏳ Processing image...' : '💡 Output will appear here...')}
      </div>
    </main>
  );
}
```

## Part 3: Run and Test the Complete Application

### Step 10: Start the application

You'll need two terminal windows:

**Terminal 1** - Start Genkit runtime (optional, but useful for debugging):
```bash
npm run genkit:start
```

**Terminal 2** - Start Next.js dev server:
```bash
npm run dev
```

### Step 11: Test with the UI

1. Open your browser to **http://localhost:9002**
2. You'll see the Vision Text Extractor interface
3. Try these testing approaches:
   - **Drag and drop**: Drag an image with text directly onto the drop zone
   - **File selection**: Click to browse and select an image
   - **Different models**: Try changing the model (e.g., `llava`, `gemma2:2b`)
   - **Custom prompts**: Modify the prompt for specific extraction needs

4. Watch as the AI extracts text in real-time with streaming feedback!

### Step 12: Debug with Developer UI (Optional)

While your app is running, you can also:
1. Visit the Genkit Developer UI at **http://localhost:4000**
2. View flow execution traces
3. Test the flow with different inputs
4. Monitor performance and debug issues

## How It Works

1. **Genkit Flow**: The core logic lives in `lib/genkit/flows.ts` - this is portable and can be used in any Node.js environment
2. **API Route**: The flow is exposed via Next.js API routes using `@genkit-ai/next`
3. **Streaming UI**: The client uses `streamFlow` to show real-time extraction progress
4. **Local Processing**: Everything runs locally via Ollama - no cloud APIs needed!

## Troubleshooting

### Common Issues and Solutions

**Ollama not running:**
```bash
# Start Ollama
ollama serve

# Verify it's running
curl http://localhost:11434/api/tags
```

**Model not found:**
```bash
# List available models
ollama list

# Pull a vision model
ollama pull llava
```

**Build warnings:**
- Warnings about `@opentelemetry/exporter-jaeger` or `@genkit-ai/firebase` are harmless
- These are optional dependencies that Genkit checks for

**Slow processing:**
- Smaller models (gemma2:2b) are faster but less accurate
- Larger models (llava, gemma2:27b) provide better results
- First run may be slow as Ollama loads the model

## Next Steps

Now that you have a working vision text extractor, you can:

1. **Add more features:**
   - Support for multiple images
   - Batch processing
   - Export extracted text to files
   - History of extractions

2. **Enhance the UI:**
   - Add progress indicators
   - Support paste from clipboard
   - Add OCR-specific presets (receipts, documents, handwriting)

3. **Optimize performance:**
   - Implement caching for repeated extractions
   - Add image preprocessing (resize, enhance contrast)
   - Use different models based on image type

4. **Extend the flow:**
   - Add translation after extraction
   - Summarize extracted text
   - Extract structured data (tables, forms)

## Summary

You've successfully built a complete vision text extraction application that:
- ✅ Uses local AI models via Ollama (privacy-first)
- ✅ Provides real-time streaming feedback
- ✅ Supports drag-and-drop for easy image upload
- ✅ Integrates with Genkit's Developer UI for debugging
- ✅ Can be tested at each layer of the stack

The modular architecture means your Genkit flow can be reused in any Node.js environment - not just Next.js!