'use client';

import { useState } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { useLocalStorage } from '@/app/hooks/useLocalStorage';

interface PromptInputProps {
  onPromptChange: (prompt: string) => void;
  currentPrompt: string;
}

const PRESET_PROMPTS = [
  {
    id: 'extract-all',
    label: 'Extract All Text',
    prompt: 'Extract all readable text from this image. Include all visible text elements.',
  },
  {
    id: 'structured',
    label: 'Structured Data',
    prompt: 'Extract text from this image and organize it in a structured format. Identify headers, paragraphs, lists, and other text elements.',
  },
  {
    id: 'handwriting',
    label: 'Handwritten Text',
    prompt: 'Focus on extracting any handwritten text in this image. Be careful with letter recognition.',
  },
  {
    id: 'receipt',
    label: 'Receipt/Invoice',
    prompt: 'Extract information from this receipt or invoice. Include items, prices, totals, date, and merchant information.',
  },
  {
    id: 'document',
    label: 'Document OCR',
    prompt: 'Perform OCR on this document image. Extract all text while preserving the document structure and formatting.',
  },
];

export function PromptInput({ onPromptChange, currentPrompt }: PromptInputProps) {
  const [customPrompts, setCustomPrompts] = useLocalStorage<string[]>('customPrompts', []);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');

  const handlePresetSelect = (prompt: string) => {
    onPromptChange(prompt);
  };

  const handleAddCustomPrompt = () => {
    if (newPrompt.trim()) {
      const updated = [...customPrompts, newPrompt.trim()];
      setCustomPrompts(updated);
      onPromptChange(newPrompt.trim());
      setNewPrompt('');
      setIsAddingCustom(false);
    }
  };

  const handleResetToDefault = () => {
    onPromptChange(PRESET_PROMPTS[0].prompt);
  };

  return (
    <div className="space-y-3">

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Preset Prompts
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {PRESET_PROMPTS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset.prompt)}
              className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                currentPrompt === preset.prompt
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {customPrompts.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Custom Prompts
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {customPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => onPromptChange(prompt)}
                className={`px-3 py-2 rounded-lg border text-sm transition-colors truncate ${
                  currentPrompt === prompt
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                title={prompt}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Current Prompt
        </label>
        <div className="relative">
          <textarea
            value={currentPrompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Describe what text you want to extract..."
          />
          <Sparkles className="absolute top-3 right-3 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {!isAddingCustom ? (
        <button
          onClick={() => setIsAddingCustom(true)}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          + Save current as custom prompt
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomPrompt()}
            placeholder="Name for this prompt..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            autoFocus
          />
          <button
            onClick={handleAddCustomPrompt}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Save
          </button>
          <button
            onClick={() => {
              setIsAddingCustom(false);
              setNewPrompt('');
            }}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}