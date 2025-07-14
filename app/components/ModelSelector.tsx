'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/app/hooks/useLocalStorage';
import { runFlow } from '@genkit-ai/next/client';
import type { getAvailableModels } from '@/lib/genkit/flows';

interface Model {
  id: string;
  name: string;
  description: string;
  size: string;
  available: boolean;
}

interface ModelSelectorProps {
  onModelSelect: (modelId: string) => void;
  currentModel: string;
}

export function ModelSelector({ onModelSelect, currentModel }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [savedModel, setSavedModel] = useLocalStorage('selectedModel', '');

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    if (savedModel && models.some(m => m.id === savedModel && m.available)) {
      onModelSelect(savedModel);
    }
  }, [savedModel, models]);

  const fetchModels = async () => {
    try {
      const result = await runFlow<typeof getAvailableModels>({
        url: '/api/models',
      });
      setModels(result.models);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setLoading(false);
    }
  };

  const handleModelSelect = (modelId: string) => {
    onModelSelect(modelId);
    setSavedModel(modelId);
    setIsOpen(false);
  };

  const selectedModel = models.find(m => m.id === currentModel);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  const availableModels = models.filter(m => m.available);
  const hasNoModels = availableModels.length === 0;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Model
      </label>

      {hasNoModels && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg mb-2">
          <p className="text-sm text-red-800 dark:text-red-200">
            No vision models found in Ollama. Install a model to get started:
          </p>
          <code className="block mt-1 p-2 bg-gray-900 dark:bg-gray-800 text-white rounded text-sm">
            ollama pull llava:7b
          </code>
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full px-4 py-3 flex items-center justify-between rounded-lg border transition-colors",
            "bg-white dark:bg-gray-800 text-left",
            "hover:bg-gray-50 dark:hover:bg-gray-700",
            "border-gray-300 dark:border-gray-600",
            "focus:outline-none focus:ring-2 focus:ring-blue-500"
          )}
        >
          <div className="flex items-center gap-3">
            {selectedModel ? (
              <>
                {selectedModel.available ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedModel.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedModel.size}
                  </p>
                </div>
              </>
            ) : (
              <span className="text-gray-500">Select a model</span>
            )}
          </div>
          <ChevronDown className={cn(
            "h-5 w-5 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model.id)}
                className={cn(
                  "w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left",
                  currentModel === model.id && "bg-blue-50 dark:bg-blue-900/20"
                )}
              >
                {model.available ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Download className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {model.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {model.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {model.size} • {model.id}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedModel && !selectedModel.available && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            This model is not installed. Run:
          </p>
          <code className="block mt-1 p-2 bg-gray-900 dark:bg-gray-800 text-white rounded text-sm">
            ollama pull {selectedModel.id}
          </code>
        </div>
      )}
    </div>
  );
}