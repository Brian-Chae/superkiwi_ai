import React from 'react';

interface HourGridProps {
  pixelsPerHour?: number;
}

export const HourGrid: React.FC<HourGridProps> = ({ pixelsPerHour = 100 }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="relative w-full">
      {hours.map((hour) => (
        <div
          key={hour}
          className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-700"
          style={{
            top: `${hour * pixelsPerHour}px`,
            height: `${pixelsPerHour}px`,
          }}
        >
          <div className="absolute left-0 top-0 px-2 text-xs text-gray-500 dark:text-gray-400">
            {String(hour).padStart(2, '0')}:00
          </div>
        </div>
      ))}
    </div>
  );
};

