
import React, { useRef, useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploaderProps {
  id: string;
  label: string;
  onImageUpload: (base64: string) => void;
  imagePreview: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ id, label, onImageUpload, imagePreview }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageUpload(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files?.[0] || null);
  };
  
  const onDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files?.[0] || null);
  }, [handleFileChange]);


  return (
    <div className="w-full">
      <label
        htmlFor={id}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center w-full aspect-square md:aspect-[4/3] border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300
        ${isDragging ? 'border-indigo-500 bg-gray-700' : 'border-gray-600 bg-gray-800 hover:bg-gray-700 hover:border-indigo-600'}`}
      >
        {imagePreview ? (
          <img src={imagePreview} alt={label} className="absolute inset-0 w-full h-full object-cover rounded-lg" />
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
            <UploadIcon />
            <p className="mb-2 text-sm font-semibold">{label}</p>
            <p className="text-xs">Click to upload or drag and drop</p>
          </div>
        )}
        <input
          id={id}
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={onFileSelect}
        />
      </label>
    </div>
  );
};

export default ImageUploader;
