/**
 * 머리 자세 (Head Pose) 계산
 * Pitch, Yaw, Roll 각도 계산
 */

interface Point3D {
  x: number;
  y: number;
  z: number;
}

/**
 * 3D 점들로부터 머리 자세 계산
 * MediaPipe Face Landmarker의 468개 랜드마크 사용
 */
export function calculateHeadPose(landmarks: any[]): {
  pitch: number; // 위/아래 (degrees)
  yaw: number; // 좌/우 (degrees)
  roll: number; // 기울기 (degrees)
} {
  if (!landmarks || landmarks.length < 468) {
    return { pitch: 0, yaw: 0, roll: 0 };
  }

  // 레포지토리 방식: 주요 얼굴 특징점 인덱스
  const nose = landmarks[1]; // 코 끝
  const chin = landmarks[152]; // 턱
  const leftEye = landmarks[33]; // 왼쪽 눈 바깥쪽
  const rightEye = landmarks[263]; // 오른쪽 눈 바깥쪽
  const forehead = landmarks[10]; // 이마

  if (!nose || !chin || !leftEye || !rightEye || !forehead) {
    return { pitch: 0, yaw: 0, roll: 0 };
  }

  // 레포지토리 방식: 머리 회전 각도 계산
  // Yaw (좌우 회전)
  const eyeCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2,
  };
  const yaw = Math.atan2(nose.x - eyeCenter.x, 0.5) * (180 / Math.PI);

  // Pitch (위아래 회전)
  const faceHeight = forehead.y - chin.y;
  const pitch = Math.atan2(nose.y - eyeCenter.y, Math.abs(faceHeight)) * (180 / Math.PI);

  // Roll (기울기)
  const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

  return {
    pitch: Math.round(pitch),
    yaw: Math.round(yaw),
    roll: Math.round(roll),
  };
}

