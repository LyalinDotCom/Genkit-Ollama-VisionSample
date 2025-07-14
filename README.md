# Vision Text Extractor - Genkit + Ollama + Next.js

A modern web application for extracting text from images using Google Genkit and Ollama vision models. This sample demonstrates how to build production-ready AI applications with local language models, optimized for developer laptops.

![Vision Text Extractor Screenshot](./public/screenshot.png)

## Features

- 🖼️ **Multiple Input Methods**: Upload images via drag-and-drop, file selection, URL, or paste from clipboard
- 🤖 **Multiple Vision Models**: Support for Gemma 3 (4B, 12B, 27B), LLaVA, and other Ollama vision models
- 🎨 **Modern UI**: Compact layout with side-by-side input/output, dark mode support
- ⚡ **Real-time Streaming**: See results as they're generated with live updates
- 🔧 **Customizable Prompts**: Pre-built templates for common use cases and custom prompt support
- 📊 **Multiple Output Formats**: View results as text, JSON, or markdown
- 💾 **Export Options**: Download or copy extracted text with one click
- 🔍 **Compact Image Preview**: Zoom and rotate images without excessive scrolling
- 📌 **Sticky Results Panel**: Results stay visible while you adjust settings

## What's New

- ✅ **Gemma 3 27B Support**: Now supports the full Gemma 3 family (4B, 12B, 27B)
- ✅ **Improved UI**: Compact layout prevents excessive scrolling, results always visible
- ✅ **Default to Gemma 3**: Changed default model from LLaVA to Gemma 3 4B
- ✅ **Better Confidence Display**: Fixed confidence level display from metadata
- ✅ **Collapsible Prompt Section**: Advanced options hidden by default for cleaner UI

## Prerequisites

- Node.js 18.x or later
- [Ollama](https://ollama.com) installed and running
- At least one vision-capable model installed (e.g., `gemma3:4b`)

### Installing Vision Models

```bash
# Install recommended Gemma 3 vision models (default)
ollama pull gemma3:4b      # Fast, good quality, 3.3GB (recommended)
ollama pull gemma3:12b     # Better quality, 8.1GB
ollama pull gemma3:27b     # Best quality, 17GB

# Alternative LLaVA models
ollama pull llava:7b       # Fast alternative, 4.1GB
ollama pull llava:13b      # Better LLaVA model, 7.3GB
```

## Installation

1. Clone this repository:
```bash
git clone <your-repo-url>
cd genkit-vision-nextjs
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
genkit-vision-nextjs/
├── app/
│   ├── api/
│   │   ├── extract-text/    # Genkit flow API endpoint
│   │   └── models/          # Model availability endpoint
│   ├── components/          # React components
│   │   ├── Header.tsx       # App header with theme toggle
│   │   ├── ImageUpload.tsx  # Image input component
│   │   ├── ImagePreview.tsx # Image viewer with controls
│   │   ├── ModelSelector.tsx # Model selection dropdown
│   │   ├── PromptInput.tsx  # Prompt customization
│   │   └── ExtractionResults.tsx # Results display
│   ├── hooks/              # Custom React hooks
│   └── page.tsx           # Main application page
├── lib/
│   ├── genkit/
│   │   ├── ai.ts          # Genkit configuration
│   │   ├── flows.ts       # Text extraction flow
│   │   └── config.ts      # Model configurations
│   └── utils.ts           # Utility functions
└── public/                # Static assets
```

## How It Works

### Genkit Integration

This app uses Google Genkit for AI orchestration with flows running on Next.js API routes:

```typescript
// lib/genkit/flows.ts
export const extractTextFromImage = ai.defineFlow({
  name: 'extractTextFromImage',
  inputSchema: imageExtractionInputSchema,
  outputSchema: imageExtractionOutputSchema,
  streamSchema: z.string(),
}, async (input, { sendChunk }) => {
  // Direct Ollama API integration for vision models
});
```

### API Routes

The Genkit flow is exposed as a Next.js API route:

```typescript
// app/api/extract-text/route.ts
import { extractTextFromImage } from '@/lib/genkit/flows';
import { appRoute } from '@genkit-ai/app-server';

export const POST = appRoute(extractTextFromImage);
```

### Frontend Integration

The React frontend consumes the API with streaming support:

```typescript
const response = await fetch('/api/extract-text', {
  method: 'POST',
  body: JSON.stringify({
    model: selectedModel,
    imageBase64: base64Image,
    prompt: extractionPrompt,
  }),
});

// Handle streaming response
const reader = response.body?.getReader();
// ... process chunks
```

## Configuration

### Environment Variables

Create a `.env.local` file:

```env
# Ollama API endpoint (optional, defaults to http://localhost:11434)
OLLAMA_API_URL=http://localhost:11434
```

### Model Configuration

Models are configured in `lib/genkit/config.ts`:

```typescript
export const MODEL_INFO = {
  'gemma3:4b': {
    name: 'Gemma 3 4B',
    description: 'Latest Google model with 128K context window',
    size: '3.3GB',
  },
  'gemma3:12b': {
    name: 'Gemma 3 12B',
    description: 'Better accuracy for complex documents',
    size: '8.1GB',
  },
  'gemma3:27b': {
    name: 'Gemma 3 27B',
    description: 'Highest accuracy for challenging layouts',
    size: '17GB',
  },
  // ... more models
};
```

## Usage

1. **Upload an Image**: Drag and drop, select a file, paste from clipboard, or provide a URL
2. **Select a Model**: Choose from available vision models (green checkmark indicates installed models)
3. **Customize the Prompt**: Use preset prompts or create your own
4. **Extract Text**: Click the button to start extraction
5. **View Results**: See extracted text with streaming updates
6. **Export**: Copy to clipboard or download as text/JSON

## Recommended Scripts for Development

This project includes scripts to run the Genkit runtime and the Next.js frontend in parallel, which is the recommended setup for development.

### Running Genkit DevUI with Frameworks (e.g., Next.js)

To ensure a smooth developer experience, you should run two processes side-by-side in separate terminals:

```bash
# Terminal 1: Genkit runtime for DevUI
npm run genkit:watch

# Terminal 2: Your app frontend
npm run dev
```

- `npm run genkit:watch`: Starts the Genkit runtime in watch mode, so it will automatically restart when you make changes to your Genkit configuration or flows. The Genkit Developer UI will be available at [http://localhost:4000](http://localhost:4000).
- `npm run dev`: Starts the Next.js development server. Your application will be available at [http://localhost:9002](http://localhost:9002).

### Clarify What DevUI Connects To

The Genkit DevUI connects to the **Genkit runtime**, not the frontend server. It is essential that Genkit is running in `dev` mode (via `genkit start`) for the DevUI features to work correctly.

### Warn Against `genkit start -- npm run dev`

This approach doesn't work reliably with apps like Next.js because `npm run dev` starts its own process that doesn’t expose Genkit runtime hooks properly. Using this command can cause the "Waiting to connect to Genkit runtime..." issue in the DevUI.

### Building for Production

```bash
npm run build
npm start
```

## Troubleshooting

### Ollama Connection Issues

If the app can't connect to Ollama:

1. Ensure Ollama is running: `ollama serve`
2. Check the API endpoint in your environment variables
3. Verify models are installed: `ollama list`

### Model Not Available

If a model shows as unavailable:

1. Install it with Ollama: `ollama pull model-name`
2. Refresh the page to update model availability

### Image Processing Errors

- Ensure images are under 10MB
- Supported formats: PNG, JPG, JPEG, GIF, WebP
- For URLs, ensure CORS is enabled on the image server

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [Google Genkit](https://genkit.dev) for AI orchestration
- [Ollama](https://ollama.com) for local model serving
- [Next.js](https://nextjs.org) for the web framework
- [Tailwind CSS](https://tailwindcss.com) for styling