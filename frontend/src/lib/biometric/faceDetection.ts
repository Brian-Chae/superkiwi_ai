import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let faceLandmarker: FaceLandmarker | null = null;
let initializationPromise: Promise<FaceLandmarker> | null = null;

/**
 * MediaPipe FaceLandmarker 초기화
 * 
 * 로그 메시지 설명:
 * - "Sets FaceBlendshapesGraph acceleration to xnnpack": XNNPACK CPU 가속 활성화 (정상)
 * - "GL version: 3.0": WebGL 2.0 정상 작동 (정상)
 * - "OpenGL error checking is disabled": 성능 최적화를 위한 설정 (정상)
 * - "Created TensorFlow Lite XNNPACK delegate for CPU": CPU 가속 엔진 생성 (정상)
 * - "Feedback manager requires...": 피드백 텐서 지원 비활성화 (정상, 기능에 영향 없음)
 */
export async function initializeFaceLandmarker(): Promise<FaceLandmarker> {
  // 이미 초기화되어 있으면 즉시 반환
  if (faceLandmarker) {
    return faceLandmarker;
  }

  // 이미 초기화 중이면 기존 Promise 반환 (동시 초기화 방지)
  if (initializationPromise) {
    return initializationPromise;
  }

  // 개발 환경에서 MediaPipe 내부 로그 억제 (선택적)
  const isDevelopment = import.meta.env.DEV;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;
  
  if (isDevelopment) {
    // 개발 환경에서만 MediaPipe 내부 경고/정보 로그 필터링
    console.warn = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      // MediaPipe 내부 경고는 필터링 (필요한 경우만 표시)
      if (
        !message.includes('Sets FaceBlendshapesGraph') &&
        !message.includes('OpenGL error checking is disabled') &&
        !message.includes('Feedback manager requires')
      ) {
        originalConsoleWarn(...args);
      }
    };
    
    console.info = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      // MediaPipe 내부 정보는 필터링 (필요한 경우만 표시)
      if (
        !message.includes('GL version') &&
        !message.includes('Created TensorFlow Lite XNNPACK') &&
        !message.includes('Graph successfully started running')
      ) {
        originalConsoleInfo(...args);
      }
    };
  }

  // 초기화 Promise 생성 및 캐싱
  initializationPromise = (async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
      );

      // 웹 브라우저에서는 GPU delegate가 불안정할 수 있으므로 CPU delegate 사용
      // XNNPACK은 CPU에서 최적화된 추론 엔진으로 충분히 빠릅니다
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: 'GPU', // GPU delegate 사용 (더 빠른 성능)
        },
        outputFaceBlendshapes: true, // 표정 데이터 출력
        outputFacialTransformationMatrixes: true, // 변환 행렬 출력
        runningMode: 'VIDEO',
        numFaces: 2, // 최대 2개 얼굴 감지
      });

      // 콘솔 복원
      if (isDevelopment) {
        console.warn = originalConsoleWarn;
        console.info = originalConsoleInfo;
      }

      console.log('✅ MediaPipe FaceLandmarker 초기화 완료 (CPU 가속 사용)');
      initializationPromise = null; // 초기화 완료 후 Promise 초기화
      return faceLandmarker;
    } catch (error) {
      // 콘솔 복원
      if (isDevelopment) {
        console.warn = originalConsoleWarn;
        console.info = originalConsoleInfo;
      }
      initializationPromise = null; // 에러 발생 시 Promise 초기화
      console.error('❌ MediaPipe 초기화 실패:', error);
      throw error;
    }
  })();

  return initializationPromise;
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
  blendshapes?: any;
}> {
  if (!faceLandmarker) {
    await initializeFaceLandmarker();
  }

  if (!faceLandmarker) {
    return { landmarks: null, detected: false };
  }

  // 비디오가 준비되었는지 확인
  if (
    !video ||
    video.readyState < 2 || // HAVE_CURRENT_DATA
    video.videoWidth === 0 ||
    video.videoHeight === 0
  ) {
    return { landmarks: null, detected: false };
  }

  try {
    // MediaPipe 내부 로그 완전 억제 (detectForVideo 호출 시에도 로그가 출력됨)
    const isDevelopment = import.meta.env.DEV;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;
    
    if (isDevelopment) {
      // 모든 MediaPipe 내부 로그 필터링
      console.warn = (...args: any[]) => {
        const message = args[0]?.toString() || '';
        if (
          !message.includes('Sets FaceBlendshapesGraph') &&
          !message.includes('OpenGL error checking is disabled') &&
          !message.includes('Feedback manager requires')
        ) {
          originalConsoleWarn(...args);
        }
      };
      
      console.info = () => {
        // MediaPipe 내부 정보 로그는 모두 필터링
        // (GL version, XNNPACK, Graph successfully 등)
      };
    }

    const results = faceLandmarker.detectForVideo(video, timestamp);
    
    // 콘솔 복원
    if (isDevelopment) {
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;
    }
    
    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
      return {
        landmarks: results.faceLandmarks[0],
        detected: true,
        blendshapes: results.faceBlendshapes ? results.faceBlendshapes[0] : null,
      };
    }

    return { landmarks: null, detected: false, blendshapes: null };
  } catch (error) {
    // 콘솔 복원
    const isDevelopment = import.meta.env.DEV;
    if (isDevelopment) {
      const originalConsoleInfo = console.info;
      console.info = originalConsoleInfo;
    }
    
    // MediaPipe 내부 에러는 조용히 처리 (비디오가 준비되지 않았을 때 발생)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('ROI width and height must be > 0')) {
      console.error('❌ Face detection error:', error);
    }
    return { landmarks: null, detected: false };
  }
}

/**
 * 얼굴 랜드마크에서 눈 좌표 추출
 * 표준 EAR 계산을 위한 6개 포인트 추출
 * calculateEAR 함수가 기대하는 순서: [왼쪽 끝, 위쪽 중간1, 위쪽 중간2, 오른쪽 끝, 아래쪽 중간1, 아래쪽 중간2]
 * MediaPipe Face Mesh 표준 인덱스:
 * - 왼쪽 눈 (시점에서 오른쪽): 33(왼쪽), 7(위), 163(위), 144(오른쪽), 145(아래), 153(아래)
 * - 오른쪽 눈 (시점에서 왼쪽): 263(왼쪽), 249(위), 390(위), 373(오른쪽), 374(아래), 380(아래)
 */
export function extractEyeLandmarks(landmarks: any[]): {
  leftEye: { x: number; y: number }[];
  rightEye: { x: number; y: number }[];
} {
  // 표준 EAR 계산을 위한 6개 포인트
  // calculateEAR 함수가 기대하는 순서: [0:왼쪽, 1:위1, 2:위2, 3:오른쪽, 4:아래1, 5:아래2]
  // MediaPipe Face Mesh 표준 인덱스 (정확한 순서):
  // - 왼쪽 눈: 33(왼쪽 끝), 7(위), 163(위), 144(오른쪽 끝), 145(아래), 153(아래)
  // - 오른쪽 눈: 263(왼쪽 끝), 249(위), 390(위), 373(오른쪽 끝), 374(아래), 380(아래)
  
  // 왼쪽 눈 (시점에서 오른쪽) - MediaPipe 표준 인덱스
  // 순서: [왼쪽 끝(33), 위쪽 중간1(7), 위쪽 중간2(163), 오른쪽 끝(144), 아래쪽 중간1(145), 아래쪽 중간2(153)]
  const leftEyeIndices = [33, 7, 163, 144, 145, 153];
  
  // 오른쪽 눈 (시점에서 왼쪽) - MediaPipe 표준 인덱스  
  // 순서: [왼쪽 끝(263), 위쪽 중간1(249), 위쪽 중간2(390), 오른쪽 끝(373), 아래쪽 중간1(374), 아래쪽 중간2(380)]
  const rightEyeIndices = [263, 249, 390, 373, 374, 380];

  const leftEye = leftEyeIndices.map((idx) => {
    const landmark = landmarks[idx];
    if (!landmark) {
      return { x: 0, y: 0 };
    }
    return {
      x: landmark.x || 0,
      y: landmark.y || 0,
    };
  });

  const rightEye = rightEyeIndices.map((idx) => {
    const landmark = landmarks[idx];
    if (!landmark) {
      return { x: 0, y: 0 };
    }
    return {
      x: landmark.x || 0,
      y: landmark.y || 0,
    };
  });

  return { leftEye, rightEye };
}

/**
 * 레포지토리 방식의 눈 인덱스 구조 반환 (개선된 EAR 계산용)
 * 주의: MediaPipe는 시점 기준으로 left/right를 구분
 * - leftEye: 시점에서 오른쪽 눈 (랜드마크 인덱스 386, 374, ...)
 * - rightEye: 시점에서 왼쪽 눈 (랜드마크 인덱스 159, 145, ...)
 */
export function getEyeIndices() {
  return {
    // 시점에서 오른쪽 눈 (leftEye)
    leftEye: {
      upper: [386, 374, 373, 390, 249, 263],  // 위쪽 눈꺼풀
      lower: [362, 398, 384, 385, 387, 388],  // 아래쪽 눈꺼풀
      left: 263,   // 왼쪽 끝
      right: 362   // 오른쪽 끝
    },
    // 시점에서 왼쪽 눈 (rightEye)
    rightEye: {
      upper: [159, 145, 144, 163, 7, 33],     // 위쪽 눈꺼풀
      lower: [133, 173, 157, 158, 153, 154],  // 아래쪽 눈꺼풀
      left: 133,   // 왼쪽 끝
      right: 33    // 오른쪽 끝
    },
  };
}

