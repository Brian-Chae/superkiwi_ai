import React, { useState, useEffect } from 'react';
import { FiMoon, FiSun, FiBell, FiCamera, FiSave } from 'react-icons/fi';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  notificationSound: boolean;
  autoStartBiometric: boolean;
}

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    theme: 'system',
    biometricEnabled: false,
    notificationsEnabled: true,
    notificationSound: true,
    autoStartBiometric: false,
  });

  // 토글 스위치 기본 클래스
  const toggleSwitchBaseClasses = "w-11 h-6 rounded-full peer bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600";
  const toggleSwitchDisabledClasses = "w-11 h-6 rounded-full peer bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed";

  // 로컬 스토리지에서 설정 불러오기
  useEffect(() => {
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  // 테마 적용
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const handleSettingChange = (key: keyof SettingsState, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('app-settings', JSON.stringify(newSettings));
  };

  const handleSave = () => {
    localStorage.setItem('app-settings', JSON.stringify(settings));
    alert('설정이 저장되었습니다.');
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          설정
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          애플리케이션 설정을 관리하세요
        </p>
      </div>

      <div className="space-y-6">
        {/* 테마 설정 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? (
                <FiMoon className="text-2xl text-gray-900 dark:text-white" />
              ) : (
                <FiSun className="text-2xl text-gray-900 dark:text-white" />
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">테마</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">화면 테마를 선택하세요</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSettingChange('theme', 'light')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                settings.theme === 'light'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <FiSun className="mx-auto mb-1" />
              <div className="text-sm font-medium">라이트</div>
            </button>
            <button
              onClick={() => handleSettingChange('theme', 'dark')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                settings.theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <FiMoon className="mx-auto mb-1" />
              <div className="text-sm font-medium">다크</div>
            </button>
            <button
              onClick={() => handleSettingChange('theme', 'system')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                settings.theme === 'system'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="mx-auto mb-1 text-lg">⚙️</div>
              <div className="text-sm font-medium">시스템</div>
            </button>
          </div>
        </div>

        {/* 생체신호 설정 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiCamera className="text-2xl text-gray-900 dark:text-white" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">생체신호 측정</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">생체신호 측정 관련 설정</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">생체신호 측정 활성화</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  얼굴 인식 및 집중도 측정 기능
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.biometricEnabled}
                  onChange={(e) => handleSettingChange('biometricEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">자동 시작</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  타이머 시작 시 자동으로 생체신호 측정 시작
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoStartBiometric}
                  onChange={(e) => handleSettingChange('autoStartBiometric', e.target.checked)}
                  disabled={!settings.biometricEnabled}
                  className="sr-only peer"
                />
                <div className={settings.biometricEnabled ? toggleSwitchBaseClasses : toggleSwitchDisabledClasses}></div>
              </label>
            </div>
          </div>
        </div>

        {/* 알림 설정 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiBell className="text-2xl text-gray-900 dark:text-white" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">알림</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">알림 및 소리 설정</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">알림 활성화</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  작업 완료 및 추천 알림 받기
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">알림 소리</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  알림 시 소리 재생
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationSound}
                  onChange={(e) => handleSettingChange('notificationSound', e.target.checked)}
                  disabled={!settings.notificationsEnabled}
                  className="sr-only peer"
                />
                <div className={settings.notificationsEnabled ? toggleSwitchBaseClasses : toggleSwitchDisabledClasses}></div>
              </label>
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-semibold"
          >
            <FiSave />
            설정 저장
          </button>
        </div>
      </div>
    </div>
  );
};

