import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiMessageCircle } from 'react-icons/fi';
import { useFocusStore } from '../state/useFocusStore';
import { useActivityStore } from '../state/useActivityStore';
import { useTimerStore } from '../state/useTimerStore';
import { useBlocksStore } from '../state/useBlocksStore';
import { recommendationEngine } from '../lib/ai/recommendationEngine';
import type { Recommendation } from '../lib/ai/recommendationEngine';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const AI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { currentFocus, averageFocus } = useFocusStore();
  const { activityData } = useActivityStore();
  const { session } = useTimerStore();
  const { blocks } = useBlocksStore();

  // 초기 환영 메시지
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '안녕하세요! 생산성 AI 어시스턴트입니다. 집중도, 작업 시간, 생체신호 데이터를 기반으로 도움을 드릴 수 있습니다. 무엇을 도와드릴까요?',
        timestamp: Date.now(),
      }]);
    }
  }, [messages.length]);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // AI 응답 생성 (규칙 기반)
  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // 추천 생성
    const recommendations = recommendationEngine.generateRecommendations(
      currentFocus,
      activityData,
      session
    );

    // 집중도 관련 질문
    if (lowerMessage.includes('집중') || lowerMessage.includes('focus')) {
      if (currentFocus) {
        return `현재 집중도는 ${(currentFocus.focusScore * 100).toFixed(1)}%입니다. 평균 집중도는 ${(averageFocus * 100).toFixed(1)}%입니다. ${
          currentFocus.focusScore < 0.5
            ? '집중도가 낮습니다. 잠시 휴식을 취하시는 것을 권장합니다.'
            : '좋은 집중 상태를 유지하고 계십니다!'
        }`;
      }
      return '생체신호 데이터가 없습니다. 트래커 페이지에서 생체신호 측정을 시작해주세요.';
    }

    // 작업 시간 관련 질문
    if (lowerMessage.includes('시간') || lowerMessage.includes('작업') || lowerMessage.includes('세션')) {
      if (session) {
        const minutes = Math.floor(session.duration / 60);
        return `현재 세션이 ${minutes}분 진행 중입니다. 평균 집중도는 ${(session.avgFocusScore * 100).toFixed(1)}%입니다.`;
      }
      return '현재 진행 중인 타이머 세션이 없습니다. 타이머 페이지에서 세션을 시작해주세요.';
    }

    // 통계 관련 질문
    if (lowerMessage.includes('통계') || lowerMessage.includes('데이터') || lowerMessage.includes('리포트')) {
      const todayBlocks = blocks.filter((block) => {
        const blockDate = new Date(block.start);
        const today = new Date();
        return blockDate.toDateString() === today.toDateString();
      });
      const totalMinutes = todayBlocks.reduce((sum, block) => {
        const start = new Date(block.start);
        const end = new Date(block.end);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60);
      }, 0);
      return `오늘 총 ${todayBlocks.length}개의 시간 블록을 완료했으며, 총 ${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60}분 작업했습니다. 더 자세한 통계는 리포트 페이지에서 확인하실 수 있습니다.`;
    }

    // 추천 관련 질문
    if (lowerMessage.includes('추천') || lowerMessage.includes('조언') || lowerMessage.includes('도움')) {
      if (recommendations.length > 0) {
        return recommendations.map((rec) => rec.message).join('\n\n');
      }
      return '현재 특별한 추천사항이 없습니다. 좋은 상태를 유지하고 계십니다!';
    }

    // 일반적인 응답
    return '죄송합니다. 더 구체적으로 질문해주시면 도움을 드릴 수 있습니다. 집중도, 작업 시간, 통계 등에 대해 물어보실 수 있습니다.';
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // AI 응답 생성 (실제로는 API 호출이지만, 여기서는 규칙 기반)
    setTimeout(() => {
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: generateAIResponse(userMessage.content),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          AI 어시스턴트
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          생산성 관련 질문을 하고 AI의 조언을 받아보세요
        </p>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center mb-2">
                    <FiMessageCircle className="mr-2 text-blue-500" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">AI 어시스턴트</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className={`text-xs mt-2 ${
                  message.role === 'user'
                    ? 'text-blue-100'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString('ko-KR')}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="생산성에 대해 질문하세요..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              rows={2}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <FiSend />
              전송
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            예: "현재 집중도는?", "오늘 작업 시간은?", "추천해줘"
          </div>
        </div>
      </div>
    </div>
  );
};

