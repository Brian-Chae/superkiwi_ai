import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let faceLandmarker: FaceLandmarker | null = null;

/**
 * MediaPipe FaceLandmarker 초기화
 */
export async function initializeFaceLandmarker(): Promise<FaceLandmarker> {
  if (faceLandmarker) {
    return faceLandmarker;
  }

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: 'GPU',
    },
    outputFaceBlendshapes: false,
    runningMode: 'VIDEO',
    numFaces: 1,
  });

  return faceLandmarker;
}

/**
 * 비디오 프레임에서 얼굴 랜드마크 감지
 */
export async function detectFace(
  video: HTMLVideoElement,
  timestamp: number
): Promise<{
  landmarks: any[] | null;
  detected: boolean;
}> {
  if (!faceLandmarker) {
    await initializeFaceLandmarker();
  }

  if (!faceLandmarker) {
    return { landmarks: null, detected: false };
  }

  try {
    const results = faceLandmarker.detectForVideo(video, timestamp);
    
    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
      return {
        landmarks: results.faceLandmarks[0],
        detected: true,
      };
    }

    return { landmarks: null, detected: false };
  } catch (error) {
    console.error('Face detection error:', error);
    return { landmarks: null, detected: false };
  }
}

/**
 * 얼굴 랜드마크에서 눈 좌표 추출
 */
export function extractEyeLandmarks(landmarks: any[]): {
  leftEye: { x: number; y: number }[];
  rightEye: { x: number; y: number }[];
} {
  // MediaPipe FaceLandmarker의 눈 랜드마크 인덱스
  // 왼쪽 눈: 33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246
  // 오른쪽 눈: 362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398
  
  const leftEyeIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
  const rightEyeIndices = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];

  const leftEye = leftEyeIndices.map((idx) => ({
    x: landmarks[idx]?.x || 0,
    y: landmarks[idx]?.y || 0,
  }));

  const rightEye = rightEyeIndices.map((idx) => ({
    x: landmarks[idx]?.x || 0,
    y: landmarks[idx]?.y || 0,
  }));

  return { leftEye, rightEye };
}

