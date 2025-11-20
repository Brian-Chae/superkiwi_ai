import React, { useState } from 'react';
import { EnhancedBiometricAgent, type EnhancedBiometricData } from '../components/BiometricAgent/EnhancedBiometricAgent';
import { useFocusStore } from '../state/useFocusStore';

export const Tracker: React.FC = () => {
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const { updateFocus } = useFocusStore();

  const handleDataUpdate = (data: EnhancedBiometricData) => {
    // 기존 Focus Store 업데이트 (호환성 유지)
    updateFocus({
      faceDetected: data.faceDetected,
      gazeStability: data.gazeStability,
      blinkRate: data.blinkRate,
      focusScore: data.focusScore,
      timestamp: data.timestamp,
    });
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            트래커
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            실시간 생체신호를 측정하고 집중도를 모니터링하세요
          </p>
        </div>
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

      <div className="max-w-6xl mx-auto">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <EnhancedBiometricAgent
            enabled={biometricEnabled}
            onDataUpdate={handleDataUpdate}
            showVisualization={true}
          />
        </div>
      </div>
    </div>
  );
};

