"use client";

import React, { useState, useRef } from "react";
import { Camera, X, Loader2, User, Upload } from "lucide-react";

interface ImageUploadProps {
  label?: string;
  urlFieldName?: string;
  keyFieldName?: string;
  initialUrl?: string | null;
  initialKey?: string | null;
  folder?: "customers" | "users" | "documents" | "avatars" | string;
  fallbackInitial?: string;
  className?: string;
  onChange?: (val: { url: string | null; key: string | null }) => void;
}

export function ImageUpload({
  label = "Profile Picture",
  urlFieldName = "profilePhotoUrl",
  keyFieldName = "profilePhotoKey",
  initialUrl = null,
  initialKey = null,
  folder = "avatars",
  fallbackInitial = "U",
  className = "",
  onChange,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl || null);
  const [fileKey, setFileKey] = useState<string | null>(initialKey || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Image file size must be less than 8MB.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.fileUrl) {
        setPreviewUrl(data.fileUrl);
        setFileKey(data.fileKey);
        onChange?.({ url: data.fileUrl, key: data.fileKey });
      } else {
        setError(data.error || "Failed to upload image.");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Network error while uploading photo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setFileKey(null);
    setError(null);
    onChange?.({ url: null, key: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}

      {/* Hidden inputs for Server Action form submission */}
      <input type="hidden" name={urlFieldName} value={previewUrl || ""} />
      <input type="hidden" name={keyFieldName} value={fileKey || ""} />

      <div className="flex items-center gap-3.5 p-2 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
        {/* Modern Circular Avatar Preview */}
        <div className="relative group shrink-0">
          <div className="flex h-13 w-13 items-center justify-center rounded-full ring-2 ring-zinc-200 dark:ring-zinc-700 bg-linear-to-tr from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-700 overflow-hidden shadow-xs">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center text-zinc-700 dark:text-zinc-200 font-bold text-base">
                {fallbackInitial ? fallbackInitial.charAt(0).toUpperCase() : <User className="h-5 w-5 text-zinc-400" />}
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs text-white">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>

          {previewUrl && !isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:scale-90 transition"
              title="Remove photo"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-750 active:scale-95 disabled:opacity-50 transition"
            >
              <Camera className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
              <span>{previewUrl ? "Change Photo" : "Upload Photo"}</span>
            </button>

            {previewUrl && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-[11px] text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 font-medium transition"
              >
                Remove
              </button>
            )}
          </div>

          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 truncate">
            JPG, PNG or WebP up to 8MB
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
