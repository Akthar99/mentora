"use client";
import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/app/utils/cropImage";
import { uploadImage } from "@/app/utils/uploadImage";
import { X, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface ProfileImageModalProps {
  userId: string;
  onClose: () => void;
  onImageSaved: (url: string) => void;
}

export default function ProfileImageModal({
  userId,
  onClose,
  onImageSaved,
}: ProfileImageModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    try {
      setLoading(true);
      setUploadProgress(0);

      // Crop image into Blob
      const croppedImageBlob = await getCroppedImg(
        imageSrc!,
        croppedAreaPixels,
        rotation
      );

      // Convert Blob to File
      const croppedFile = new File([croppedImageBlob], `profile_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      // Upload with progress callback
      const url = await uploadImage(userId, croppedFile, (progress) =>
        setUploadProgress(progress)
      );

      onImageSaved(url);
      onClose();
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("Failed to upload image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-black"
        >
          <X size={20} />
        </button>

        <div className="p-6 flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-3">Update Profile Picture</h2>

          {!imageSrc ? (
            <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 cursor-pointer hover:bg-gray-50">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-gray-500">
                Click to upload or drag your photo here
              </p>
            </label>
          ) : (
            <div className="relative w-full h-64 bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            </div>
          )}

          {imageSrc && (
            <>
              <div className="flex gap-3 mt-4 items-center">
                <button
                  onClick={() => setZoom((z) => Math.min(z + 0.1, 3))}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(z - 0.1, 1))}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  <ZoomOut size={18} />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  <RotateCcw size={18} />
                </button>
              </div>

              <button
                onClick={handleUpload}
                disabled={loading}
                className="mt-6 w-full bg-black text-white py-2 rounded-xl hover:bg-gray-900 transition disabled:opacity-60"
              >
                {loading
                  ? `Uploading… ${uploadProgress.toFixed(0)}%`
                  : "Save Picture"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
