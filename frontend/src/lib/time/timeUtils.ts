/**
 * 시간 관련 유틸리티 함수
 */

export const HOURS_IN_DAY = 24;
export const MINUTES_IN_HOUR = 60;
export const PIXELS_PER_HOUR = 100; // 1시간당 픽셀 수

/**
 * 시간 문자열을 분으로 변환 (예: "09:30" -> 570)
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * MINUTES_IN_HOUR + minutes;
}

/**
 * 분을 시간 문자열로 변환 (예: 570 -> "09:30")
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_IN_HOUR);
  const mins = minutes % MINUTES_IN_HOUR;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Date 객체를 시간 문자열로 변환
 */
export function dateToTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * 시간 문자열을 픽셀 위치로 변환
 */
export function timeToPixels(time: string): number {
  return (timeToMinutes(time) / MINUTES_IN_HOUR) * PIXELS_PER_HOUR;
}

/**
 * 픽셀 위치를 시간 문자열로 변환
 */
export function pixelsToTime(pixels: number): string {
  const minutes = Math.round((pixels / PIXELS_PER_HOUR) * MINUTES_IN_HOUR);
  return minutesToTime(Math.max(0, Math.min(minutes, HOURS_IN_DAY * MINUTES_IN_HOUR)));
}

/**
 * 현재 시간을 ISO 8601 형식으로 반환
 */
export function getCurrentTimeISO(): string {
  return new Date().toISOString();
}

/**
 * ISO 8601 문자열을 Date 객체로 변환
 */
export function isoToDate(iso: string): Date {
  return new Date(iso);
}

/**
 * 두 시간 사이의 분 차이 계산
 */
export function getDurationMinutes(start: string, end: string): number {
  const startDate = isoToDate(start);
  const endDate = isoToDate(end);
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
}

/**
 * 오늘 날짜의 시작 시간 (00:00) ISO 문자열
 */
export function getTodayStartISO(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

/**
 * 오늘 날짜의 끝 시간 (23:59:59) ISO 문자열
 */
export function getTodayEndISO(): string {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today.toISOString();
}

