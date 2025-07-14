'use client';

import { useState } from 'react';
import { Copy, Download, FileText, FileJson, FileCode, Check } from 'lucide-react';
import { cn, downloadTextFile } from '@/lib/utils';

interface ExtractionResultsProps {
  extractedText: string;
  confidence: string;
  metadata?: Record<string, any>;
  isLoading?: boolean;
  streamingText?: string;
}

type ViewMode = 'text' | 'json' | 'markdown';

export function ExtractionResults({ 
  extractedText, 
  confidence, 
  metadata, 
  isLoading = false,
  streamingText = ''
}: ExtractionResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('text');
  const [copied, setCopied] = useState(false);

  const displayText = streamingText || extractedText;

  const handleCopy = async () => {
    const textToCopy = viewMode === 'json' 
      ? JSON.stringify({ extractedText: displayText, confidence, metadata }, null, 2)
      : displayText;
    
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = viewMode === 'json'
      ? JSON.stringify({ extractedText: displayText, confidence, metadata }, null, 2)
      : displayText;
    const filename = `extracted-text-${Date.now()}.${viewMode === 'json' ? 'json' : 'txt'}`;
    downloadTextFile(content, filename);
  };

  const formatContent = () => {
    if (viewMode === 'json') {
      return (
        <pre className="whitespace-pre-wrap font-mono text-sm">
          {JSON.stringify({ extractedText: displayText, confidence, metadata }, null, 2)}
        </pre>
      );
    }

    if (viewMode === 'markdown') {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <pre className="whitespace-pre-wrap">{displayText}</pre>
        </div>
      );
    }

    return (
      <div className="whitespace-pre-wrap">
        {displayText}
      </div>
    );
  };

  if (!displayText && !isLoading) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Extracted Text
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('text')}
              className={cn(
                "px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1",
                viewMode === 'text'
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <FileText className="h-3 w-3" />
              Text
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={cn(
                "px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1",
                viewMode === 'json'
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <FileJson className="h-3 w-3" />
              JSON
            </button>
            <button
              onClick={() => setViewMode('markdown')}
              className={cn(
                "px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1",
                viewMode === 'markdown'
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <FileCode className="h-3 w-3" />
              Markdown
            </button>
          </div>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Download"
          >
            <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {confidence && confidence !== "low" && !isLoading && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Confidence:
          </span>
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            confidence === "high" 
              ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
              : confidence === "medium"
              ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
              : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300"
          )}>
            {confidence}
          </span>
        </div>
      )}

      <div className={cn(
        "relative rounded-lg border bg-gray-50 dark:bg-gray-900 p-4 min-h-[200px] max-h-[400px] overflow-y-auto",
        "border-gray-300 dark:border-gray-600",
        isLoading && "animate-pulse"
      )}>
        {isLoading && !streamingText ? (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        ) : (
          <div className="text-gray-900 dark:text-gray-100">
            {formatContent()}
            {isLoading && streamingText && (
              <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1"></span>
            )}
          </div>
        )}
      </div>

      {metadata && Object.keys(metadata).length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            Metadata
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto text-xs">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}