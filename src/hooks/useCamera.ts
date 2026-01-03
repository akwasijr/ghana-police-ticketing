// useCamera hook - Enhanced Camera with Compression & Thumbnails

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TicketPhoto } from '@/types/ticket.types';
import { v4 as uuidv4 } from 'uuid';

// Photo configuration constants
const PHOTO_CONFIG = {
  MAX_WIDTH: 1920,        // 2MP max
  MAX_HEIGHT: 1080,
  MAX_SIZE_KB: 500,       // 500KB max compressed size
  THUMBNAIL_WIDTH: 200,
  THUMBNAIL_HEIGHT: 150,
  QUALITY_HIGH: 0.85,
  QUALITY_MEDIUM: 0.7,
  QUALITY_LOW: 0.5,
};

interface CapturedPhoto extends TicketPhoto {
  blob: Blob;
  thumbnailBlob?: Blob;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

interface UseCameraReturn {
  // State
  isSupported: boolean;
  isActive: boolean;
  hasPermission: boolean | null;
  error: string | null;
  stream: MediaStream | null;
  facingMode: 'user' | 'environment';
  isCapturing: boolean;
  lastPhoto: CapturedPhoto | null;
  
  // Actions
  startCamera: () => Promise<boolean>;
  stopCamera: () => void;
  capturePhoto: (options?: CaptureOptions) => Promise<CapturedPhoto | null>;
  switchCamera: () => void;
  clearLastPhoto: () => void;
  
  // Refs
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

interface CameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  quality?: number;
}

interface CaptureOptions {
  type?: 'evidence' | 'vehicle' | 'license' | 'other';
  includeLocation?: boolean;
  generateThumbnail?: boolean;
}

const defaultOptions: CameraOptions = {
  facingMode: 'environment',
  width: PHOTO_CONFIG.MAX_WIDTH,
  height: PHOTO_CONFIG.MAX_HEIGHT,
  quality: PHOTO_CONFIG.QUALITY_HIGH,
};

export function useCamera(options: CameraOptions = {}): UseCameraReturn {
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastPhoto, setLastPhoto] = useState<CapturedPhoto | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    options.facingMode || defaultOptions.facingMode!
  );
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  const isSupported = !!(
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  );

  // Start camera stream
  const startCamera = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Camera is not supported on this device');
      return false;
    }

    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: mergedOptions.width },
          height: { ideal: mergedOptions.height },
        },
        audio: false,
      });

      setStream(mediaStream);
      setHasPermission(true);
      setIsActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      return true;
    } catch (err) {
      const error = err as Error;
      let errorMessage: string;

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access.';
        setHasPermission(false);
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application.';
      } else {
        errorMessage = 'Unable to access camera: ' + error.message;
      }

      setError(errorMessage);
      setIsActive(false);
      return false;
    }
  }, [isSupported, facingMode, mergedOptions.width, mergedOptions.height]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
  }, [stream]);

  // Compress image to target size
  const compressImage = async (
    canvas: HTMLCanvasElement,
    targetSizeKB: number,
    maxIterations: number = 5
  ): Promise<{ blob: Blob; quality: number }> => {
    let quality = PHOTO_CONFIG.QUALITY_HIGH;
    let blob: Blob | null = null;
    let iterations = 0;

    while (iterations < maxIterations) {
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', quality);
      });

      if (!blob) break;

      const sizeKB = blob.size / 1024;
      if (sizeKB <= targetSizeKB || quality <= PHOTO_CONFIG.QUALITY_LOW) {
        break;
      }

      // Reduce quality for next iteration
      quality -= 0.1;
      iterations++;
    }

    return { blob: blob!, quality };
  };

  // Generate thumbnail
  const generateThumbnail = async (
    sourceCanvas: HTMLCanvasElement
  ): Promise<Blob | null> => {
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = PHOTO_CONFIG.THUMBNAIL_WIDTH;
    thumbCanvas.height = PHOTO_CONFIG.THUMBNAIL_HEIGHT;

    const ctx = thumbCanvas.getContext('2d');
    if (!ctx) return null;

    // Calculate aspect ratio fit
    const sourceAspect = sourceCanvas.width / sourceCanvas.height;
    const thumbAspect = PHOTO_CONFIG.THUMBNAIL_WIDTH / PHOTO_CONFIG.THUMBNAIL_HEIGHT;

    let drawWidth = PHOTO_CONFIG.THUMBNAIL_WIDTH;
    let drawHeight = PHOTO_CONFIG.THUMBNAIL_HEIGHT;
    let offsetX = 0;
    let offsetY = 0;

    if (sourceAspect > thumbAspect) {
      drawHeight = PHOTO_CONFIG.THUMBNAIL_WIDTH / sourceAspect;
      offsetY = (PHOTO_CONFIG.THUMBNAIL_HEIGHT - drawHeight) / 2;
    } else {
      drawWidth = PHOTO_CONFIG.THUMBNAIL_HEIGHT * sourceAspect;
      offsetX = (PHOTO_CONFIG.THUMBNAIL_WIDTH - drawWidth) / 2;
    }

    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, PHOTO_CONFIG.THUMBNAIL_WIDTH, PHOTO_CONFIG.THUMBNAIL_HEIGHT);
    ctx.drawImage(sourceCanvas, offsetX, offsetY, drawWidth, drawHeight);

    return new Promise((resolve) => {
      thumbCanvas.toBlob(resolve, 'image/jpeg', 0.7);
    });
  };

  // Capture photo from video stream
  const capturePhoto = useCallback(async (
    captureOptions: CaptureOptions = {}
  ): Promise<CapturedPhoto | null> => {
    if (!videoRef.current || !canvasRef.current || !isActive) {
      setError('Camera is not active');
      return null;
    }

    setIsCapturing(true);
    setError(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        setError('Unable to get canvas context');
        return null;
      }

      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get original size
      const originalBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 1);
      });
      const originalSize = originalBlob?.size || 0;

      // Compress to target size
      const { blob: compressedBlob } = await compressImage(
        canvas,
        PHOTO_CONFIG.MAX_SIZE_KB
      );

      if (!compressedBlob) {
        setError('Failed to capture photo');
        return null;
      }

      // Generate thumbnail if requested
      let thumbnailBlob: Blob | null = null;
      if (captureOptions.generateThumbnail !== false) {
        thumbnailBlob = await generateThumbnail(canvas);
      }

      // Create photo object
      const photo: CapturedPhoto = {
        id: uuidv4(),
        uri: URL.createObjectURL(compressedBlob),
        timestamp: new Date().toISOString(),
        type: (captureOptions.type || 'evidence') as any,
        blob: compressedBlob,
        thumbnailBlob: thumbnailBlob || undefined,
        width: canvas.width,
        height: canvas.height,
        originalSize,
        compressedSize: compressedBlob.size,
        compressionRatio: originalSize > 0 
          ? Math.round((1 - compressedBlob.size / originalSize) * 100) 
          : 0,
        uploaded: false,
      };

      setLastPhoto(photo);
      return photo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Capture failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [isActive]);

  // Switch between front and back camera
  const switchCamera = useCallback(() => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    
    if (isActive) {
      stopCamera();
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  }, [facingMode, isActive, stopCamera, startCamera]);

  // Clear last photo
  const clearLastPhoto = useCallback(() => {
    if (lastPhoto?.uri) {
      URL.revokeObjectURL(lastPhoto.uri);
    }
    setLastPhoto(null);
  }, [lastPhoto]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (lastPhoto?.uri) {
        URL.revokeObjectURL(lastPhoto.uri);
      }
    };
  }, [stream, lastPhoto]);

  return {
    isSupported,
    isActive,
    hasPermission,
    error,
    stream,
    facingMode,
    isCapturing,
    lastPhoto,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    clearLastPhoto,
    videoRef,
    canvasRef,
  };
}

// Enhanced resize with quality iteration
export async function compressToTargetSize(
  file: File | Blob,
  targetSizeKB: number = PHOTO_CONFIG.MAX_SIZE_KB,
  maxWidth: number = PHOTO_CONFIG.MAX_WIDTH,
  maxHeight: number = PHOTO_CONFIG.MAX_HEIGHT
): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    
    img.onload = async () => {
      URL.revokeObjectURL(url);
      
      let { width, height } = img;
      
      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Iterate to find optimal quality
      let quality = PHOTO_CONFIG.QUALITY_HIGH;
      let blob: Blob | null = null;
      
      while (quality >= PHOTO_CONFIG.QUALITY_LOW) {
        blob = await new Promise<Blob | null>((res) => {
          canvas.toBlob(res, 'image/jpeg', quality);
        });
        
        if (blob && blob.size / 1024 <= targetSizeKB) {
          break;
        }
        quality -= 0.1;
      }
      
      if (blob) {
        resolve({ blob, width, height });
      } else {
        reject(new Error('Could not compress image'));
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };
  });
}

// Helper to resize an image
export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not create blob'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Could not load image'));
    };
  });
}

// Get photo metadata from file
export async function getPhotoMetadata(file: File | Blob): Promise<{
  width: number;
  height: number;
  size: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };
  });
}
