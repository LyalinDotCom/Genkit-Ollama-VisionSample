'use client';

import { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import Image from 'next/image';

interface ImagePreviewProps {
  file: File | null;
}

export function ImagePreview({ file }: ImagePreviewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImageUrl(null);
    }
  }, [file]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  if (!imageUrl || !file) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Preview
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[40px] text-center">
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          <button
            onClick={handleRotate}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Rotate"
          >
            <RotateCw className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800">
        <div className="overflow-auto max-h-[250px] p-2">
          <div 
            className="relative mx-auto transition-transform duration-300"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center',
              width: 'fit-content',
            }}
          >
            <img
              src={imageUrl}
              alt="Preview"
              className="max-w-full h-auto rounded"
              style={{ maxHeight: '200px', objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}