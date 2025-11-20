import React, { useState, useEffect } from 'react';
import { TimeCanvasContainer } from '../components/TimeCanvas/TimeCanvasContainer';
import { BiometricAgent } from '../components/BiometricAgent/BiometricAgent';
import { TimerController } from '../components/Timer/TimerController';
import { SuggestionBanner } from '../components/AIAssistant/SuggestionBanner';
import { useFocusStore } from '../state/useFocusStore';
import { useActivityStore } from '../state/useActivityStore';
import { useTimerStore } from '../state/useTimerStore';
import { recommendationEngine } from '../lib/ai/recommendationEngine';
import type { Recommendation } from '../lib/ai/recommendationEngine';

export const Home: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const { currentFocus, updateFocus } = useFocusStore();
  const { activityData, startMonitoring } = useActivityStore();
  const { session } = useTimerStore();

  // 활동 모니터링 시작
  useEffect(() => {
    const stopMonitoring = startMonitoring();
    return stopMonitoring;
  }, [startMonitoring]);

  // Focus 데이터를 추천 엔진에 추가
  useEffect(() => {
    if (currentFocus) {
      recommendationEngine.addFocusData(currentFocus);
    }
  }, [currentFocus]);

  // 추천 생성
  useEffect(() => {
    const interval = setInterval(() => {
      const newRecommendations = recommendationEngine.generateRecommendations(
        currentFocus,
        activityData,
        session
      );
      setRecommendations(newRecommendations);
    }, 5000); // 5초마다 추천 업데이트

    return () => clearInterval(interval);
  }, [currentFocus, activityData, session]);

  const handleDismissRecommendation = (index: number) => {
    setRecommendations((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            SuperKiwi Time OS
          </h1>
          <button
            onClick={() => setBiometricEnabled(!biometricEnabled)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              biometricEnabled
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500'
            }`}
          >
            {biometricEnabled ? '생체신호 ON' : '생체신호 OFF'}
          </button>
        </div>

        {/* AI 추천 배너 */}
        {recommendations.length > 0 && (
          <div className="mb-4">
            <SuggestionBanner
              recommendations={recommendations}
              onDismiss={handleDismissRecommendation}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Deep Work Timer */}
          <div className="lg:col-span-1">
            <TimerController />
          </div>

          {/* Biometric Agent */}
          {biometricEnabled && (
            <div className="lg:col-span-1">
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  생체신호 측정
                </h2>
                <BiometricAgent
                  enabled={biometricEnabled}
                  onDataUpdate={(data) => {
                    updateFocus({
                      faceDetected: data.faceDetected,
                      gazeStability: data.gazeStability,
                      blinkRate: data.blinkRate,
                      focusScore: data.focusScore,
                      timestamp: data.timestamp,
                    });
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Time Canvas */}
        <div className="mt-4">
          <TimeCanvasContainer />
        </div>
      </div>
    </div>
  );
};
