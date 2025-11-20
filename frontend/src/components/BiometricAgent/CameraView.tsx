import React, { useRef, useEffect, useState } from 'react';

interface CameraViewProps {
  onVideoReady?: (video: HTMLVideoElement) => void;
  onError?: (error: Error) => void;
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}

export const CameraView: React.FC<CameraViewProps> = ({
  onVideoReady,
  onError,
  width = 640,
  height = 480,
  facingMode = 'user',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: width },
            height: { ideal: height },
            facingMode: facingMode,
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsLoading(false);
          onVideoReady?.(videoRef.current);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '카메라 접근 실패';
        setError(errorMessage);
        setIsLoading(false);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [width, height, facingMode, onVideoReady, onError]);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">카메라 로딩 중...</div>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
};

