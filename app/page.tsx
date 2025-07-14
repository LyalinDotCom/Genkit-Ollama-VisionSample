'use client';

import { useState } from 'react';
import { Header } from './components/Header';
import { ImageUpload } from './components/ImageUpload';
import { ImagePreview } from './components/ImagePreview';
import { ModelSelector } from './components/ModelSelector';
import { PromptInput } from './components/PromptInput';
import { ExtractionResults } from './components/ExtractionResults';
import { fileToBase64 } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { streamFlow } from '@genkit-ai/next/client';
import type { extractTextFromImage } from '@/lib/genkit/flows';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [extractionPrompt, setExtractionPrompt] = useState(
    'Extract all readable text from this image. Include all visible text elements.'
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [confidence, setConfidence] = useState('');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!selectedImage) return;

    setIsExtracting(true);
    setError(null);
    setExtractedText('');
    setStreamingText('');
    setConfidence('');
    setMetadata({});

    try {
      const base64Image = await fileToBase64(selectedImage);
      
      // Use streamFlow from Genkit client
      const { stream, output } = streamFlow<typeof extractTextFromImage>({
        url: '/api/extract-text',
        input: {
          model: selectedModel,
          imageBase64: base64Image,
          prompt: extractionPrompt,
          outputFormat: 'text',
        }
      });

      // Process the stream
      for await (const chunk of stream) {
        setStreamingText(prev => prev + chunk);
      }

      // Wait for the final output
      const result = await output;
      setExtractedText(result.extractedText);
      setConfidence(result.metadata?.confidence || 'High');
      setMetadata(result.metadata || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract text');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      
      <main className="container mx-auto px-4 py-4">
        <div className="max-w-7xl mx-auto">
          {/* Compact layout with results always visible */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Input */}
            <div className="space-y-4">
              <ImageUpload 
                onImageSelect={setSelectedImage}
                currentImage={selectedImage}
              />
              
              {selectedImage && (
                <>
                  {/* Compact image preview */}
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 max-h-[300px] overflow-hidden">
                    <ImagePreview file={selectedImage} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ModelSelector
                      onModelSelect={setSelectedModel}
                      currentModel={selectedModel}
                    />
                    
                    <button
                      onClick={handleExtract}
                      disabled={isExtracting || !selectedImage || !selectedModel}
                      className="h-fit self-end py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      title={!selectedModel ? 'Please select a model first' : undefined}
                    >
                      {isExtracting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Extracting...
                        </>
                      ) : (
                        'Extract Text'
                      )}
                    </button>
                  </div>
                  
                  <details className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <summary className="cursor-pointer font-medium text-gray-900 dark:text-white">
                      Customize Prompt
                    </summary>
                    <div className="mt-4">
                      <PromptInput
                        onPromptChange={setExtractionPrompt}
                        currentPrompt={extractionPrompt}
                      />
                    </div>
                  </details>
                </>
              )}
            </div>
            
            {/* Right Column - Results (always visible) */}
            <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">
              <div className="space-y-4 h-full flex flex-col">
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}
                
                {/* Results area with visual indicator */}
                <div className={`flex-1 relative ${!selectedImage && !extractedText && !isExtracting ? '' : ''}`}>
                  {(!selectedImage && !extractedText && !isExtracting) ? (
                    <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                          Results will appear here
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm">
                          👈 Upload an image to get started
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ExtractionResults
                      extractedText={extractedText}
                      confidence={confidence}
                      metadata={metadata}
                      isLoading={isExtracting}
                      streamingText={streamingText}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
