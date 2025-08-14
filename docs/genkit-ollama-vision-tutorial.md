---
title: Build a Vision Text Extractor (Genkit + Ollama + Next.js)
description: Learn how to build a local app that extracts text from images using Genkit flows, Ollama vision models, and a Next.js API route.
---

This tutorial shows how to recreate the sample app that extracts text from images using locally served vision models via Ollama and a Next.js API powered by Genkit.

Why Next.js? We’re using a small Next.js app purely to make testing the sample fun and fast: it gives us an instant UI and easy API routes. Genkit flows are framework‑agnostic—you can reuse the same `lib/genkit/*` code in any Node.js environment—but we’ll demonstrate everything inside a Next.js app for convenience.

Model choice: Examples below default to Google’s Gemma 3 vision model via Ollama (for example, `gemma3:27b`). You can substitute another supported vision model if needed.

1. [Set up your project](#1-set-up-your-project)
2. [Install dependencies](#2-install-dependencies)
3. [Configure Genkit and Ollama](#3-configure-genkit-and-ollama)
4. [Implement the extraction flow](#4-implement-the-extraction-flow)
5. [Expose the flow as an API route](#5-expose-the-flow-as-an-api-route)
6. [Build a minimal Next.js UI](#6-build-a-minimal-nextjs-ui)
7. [Add scripts and run locally](#7-add-scripts-and-run-locally)
8. [Test in the browser (and curl)](#8-test-in-the-browser-and-curl)
9. [Troubleshooting](#9-troubleshooting)

## Prerequisites

- Node.js v18+ and npm
- [Ollama](https://ollama.com) installed and running locally
- At least one vision model installed, for example: `ollama pull gemma3:27b`

## Implementation Steps

### 1. Set up your project

```bash
npx create-next-app@latest genkit-vision-nextjs --ts --use-npm --eslint && \
cd genkit-vision-nextjs
```

### 2. Install dependencies

```bash
npm install genkit genkitx-ollama @genkit-ai/next zod
npm install -D tsx typescript
```

### 3. Configure Genkit and Ollama

Create `lib/genkit/config.ts`:

```ts
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

Optional: in your shell, configure the endpoint (defaults shown above):

```bash
export OLLAMA_SERVER_ADDRESS=http://127.0.0.1:11434
```

### 4. Implement the extraction flow

Create `lib/genkit/flows.ts` with a streaming vision flow:

```ts
import { z } from 'zod';
import { ai } from './config';
import { ollama } from 'genkitx-ollama';

export const imageExtractionInput = z.object({
  imageBase64: z.string(),
  model: z.string(), // e.g., 'gemma3:27b'
  prompt: z.string().optional().default('Extract all text from this image.'),
});

export const extractTextFromImage = ai.defineFlow(
  {
    name: 'extractTextFromImage',
    inputSchema: imageExtractionInput,
    outputSchema: z.object({ extractedText: z.string() }),
    streamSchema: z.string(),
  },
  async (input, { sendChunk }) => {
    const { response, stream } = await ai.generateStream({
      model: ollama.model(input.model),
      prompt: [
        { text: input.prompt },
        { media: { contentType: 'image/jpeg', url: `data:image/jpeg;base64,${input.imageBase64}` } },
      ],
      config: { temperature: 0.3 },
    });

    for await (const chunk of stream) sendChunk(chunk.text);
    const final = await response;
    return { extractedText: final.text };
  }
);
```

### 5. Expose the flow as an API route

Create `app/api/extract-text/route.ts`:

```ts
import { appRoute } from '@genkit-ai/next';
import { extractTextFromImage } from '@/lib/genkit/flows';

export const POST = appRoute(extractTextFromImage);
```

### 6. Build a minimal Next.js UI

Create a simple page at `app/page.tsx` that selects an image, sets the model (default Gemma 3), and streams results from the API using Genkit's Next client.

```tsx
// app/page.tsx
"use client";
import { useState } from 'react';
import { streamFlow } from '@genkit-ai/next/client';
import type { extractTextFromImage } from '@/lib/genkit/flows';

export default function HomePage() {
  const [model, setModel] = useState('gemma3:27b');
  const [prompt, setPrompt] = useState('Extract all text from this image.');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);

  async function toBase64(file: File): Promise<string> {
    const buf = await file.arrayBuffer();
    return Buffer.from(buf).toString('base64');
  }

  async function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOutput('');
    setBusy(true);
    try {
      const imageBase64 = await toBase64(file);
      const { stream, output } = streamFlow<typeof extractTextFromImage>({
        url: '/api/extract-text',
        input: { model, imageBase64, prompt },
      });
      for await (const chunk of stream) setOutput(prev => prev + chunk);
      const final = await output;
      setOutput(final.extractedText);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>Vision Text Extractor</h1>
      <p>Choose an image, select model, and stream extracted text.</p>
      <label>
        Model:&nbsp;
        <input value={model} onChange={e => setModel(e.target.value)} />
      </label>
      <br />
      <label>
        Prompt:&nbsp;
        <input value={prompt} onChange={e => setPrompt(e.target.value)} />
      </label>
      <br />
      <input type="file" accept="image/*" onChange={onSelectFile} disabled={busy} />
      <pre style={{ whiteSpace: 'pre-wrap', background: '#111', color: '#0f0', padding: 12, marginTop: 16 }}>
        {output || (busy ? 'Processing…' : 'Output will appear here…')}
      </pre>
    </main>
  );
}
```

This page demonstrates the value of using Next.js in this tutorial: you get an instant UI to exercise your Genkit flow and observe streaming in real time.

### 7. Add scripts and run locally

In `package.json`, add convenient scripts (examples):

```json
{
  "scripts": {
    "dev": "next dev --turbopack -p 9002",
    "genkit:watch": "genkit start -- tsx --watch lib/genkit/flows.ts",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  }
}
```

Run the two processes in separate terminals:

```bash
# Terminal A: Genkit runtime + Developer UI (http://localhost:4000)
npm run genkit:watch

# Terminal B: Next.js app (http://localhost:9002)
npm run dev
```

### 8. Test in the browser (and curl)

Open `http://localhost:9002` and try an image. You should see streamed output in the UI. Optionally, you can also test the API directly with curl using a base64-encoded JPEG/PNG:

```bash
curl -X POST http://localhost:9002/api/extract-text \
  -H 'content-type: application/json' \
  -d '{
    "model": "gemma3:27b",
    "imageBase64": "<base64>",
    "prompt": "Extract all text from this image."
  }'
```

The response streams chunks and then returns `{ extractedText: "..." }`.

### 9. Troubleshooting

- Ensure Ollama is running: `ollama serve`; list models: `ollama list`.
- Large images: keep under ~10MB for smoother processing.
- Connectivity: set `OLLAMA_SERVER_ADDRESS` if Ollama isn’t on the default host/port.
- If the Genkit Developer UI can’t connect, run the Genkit runtime and Next.js server in separate terminals (don’t nest commands).
