import React, { useRef, useEffect } from 'react';
import { DrawingUtils, FaceLandmarker } from '@mediapipe/tasks-vision';
import type { Landmark } from '../../types/biometric';

interface FaceLandmarkCanvasProps {
  video: HTMLVideoElement | null;
  landmarks: Landmark[] | null;
  width: number;
  height: number;
  showConnectors?: boolean;
  showLandmarks?: boolean;
  blinkDetected?: boolean; // 눈 깜빡임 감지 상태
  earValue?: number; // EAR 값 (0.5 미만이면 눈이 감긴 것으로 판단)
}

/**
 * 얼굴 랜드마크를 Canvas에 그리는 컴포넌트 (레포지토리 방식: DrawingUtils 사용)
 */
export const FaceLandmarkCanvas: React.FC<FaceLandmarkCanvasProps> = ({
  video,
  landmarks,
  width,
  height,
  showConnectors = true,
  showLandmarks = true,
  blinkDetected = false,
  earValue = 1.0,
}) => {
  // 눈이 감겼는지 판단 (EAR < 0.5 또는 blinkDetected)
  const isEyeClosed = blinkDetected || (earValue !== undefined && earValue < 0.5);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !video || !landmarks || video.videoWidth === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 크기를 비디오 크기에 맞춤
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // 이전 프레임 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // DrawingUtils 사용 (레포지토리 방식)
    const drawingUtils = new DrawingUtils(ctx);

    if (showConnectors) {
      // 얼굴 메시 - 선명하면서도 섬세한 스타일
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: '#60606040', lineWidth: 0.5 }
      );

      // 얼굴 윤곽선 - 선명한 블루 라인
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: '#2563EB50', lineWidth: 1.2 }
      );

      // 얼굴 중심선 - 대칭 가이드라인
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_CONTOURS,
        { color: '#8B5CF630', lineWidth: 0.8 }
      );
    }

    if (showLandmarks) {
      // 눈 - 선명한 청록색
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: '#14B8A6A0', lineWidth: 1.3 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: '#14B8A6A0', lineWidth: 1.3 }
      );

      // 홍채 중심점 - 밝은 시안 (눈이 열려있을 때만 그리기)
      // 눈을 감았을 때는 iris를 그리지 않음 (MediaPipe가 추정한 랜드마크를 표시하지 않음)
      if (!isEyeClosed) {
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
          { color: '#06B6D4C0', lineWidth: 1.8 }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
          { color: '#06B6D4C0', lineWidth: 1.8 }
        );
      }

      // 입술 - 선명한 로즈 핑크
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { color: '#EC489990', lineWidth: 1 }
      );

      // 눈썹 - 진한 브라운
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
        { color: '#78350F60', lineWidth: 0.8 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
        { color: '#78350F60', lineWidth: 0.8 }
      );

      // 주요 랜드마크 포인트 - 선명한 블루 점
      drawingUtils.drawLandmarks(landmarks, {
        color: '#3B82F640',
        radius: 0.8
      });
    }
  }, [video, landmarks, showConnectors, showLandmarks, blinkDetected, earValue, isEyeClosed]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
      style={{ transform: 'scaleX(-1)' }}
    />
  );
};

