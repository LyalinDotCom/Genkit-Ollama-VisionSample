'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Link, Image as ImageIcon } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';

interface ImageUploadProps {
  onImageSelect: (file: File | null) => void;
  currentImage: File | null;
}

export function ImageUpload({ onImageSelect, currentImage }: ImageUploadProps) {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        setError('Image size must be less than 10MB');
      } else if (error.code === 'file-invalid-type') {
        setError('Only image files are accepted');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onImageSelect(acceptedFiles[0]);
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    
    setError(null);
    try {
      const response = await fetch(urlInput);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const file = new File([blob], 'image-from-url', { type: blob.type });
      
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }
      
      onImageSelect(file);
      setUrlInput('');
      setShowUrlInput(false);
    } catch (err) {
      setError('Failed to load image from URL');
    }
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          onImageSelect(file);
        }
      }
    }
  }, [onImageSelect]);

  // Set up paste event listener
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Upload Image
        </h2>
        <button
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
        >
          <Link className="h-4 w-4" />
          Use URL
        </button>
      </div>

      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleUrlSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Load
          </button>
        </div>
      )}

      {currentImage ? (
        <div className="relative p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => onImageSelect(null)}
            className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-700 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
          
          <div className="flex items-center gap-4">
            <ImageIcon className="h-12 w-12 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {currentImage.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatFileSize(currentImage.size)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {isDragActive
              ? "Drop the image here"
              : "Drag & drop an image here, or click to select"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Supports PNG, JPG, JPEG, GIF, WebP (max 10MB)
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            💡 Tip: You can also paste images with Ctrl/Cmd + V
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}