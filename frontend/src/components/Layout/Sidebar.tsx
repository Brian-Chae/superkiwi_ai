import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiCalendar, 
  FiClock, 
  FiActivity, 
  FiBarChart2, 
  FiMessageCircle, 
  FiSettings 
} from 'react-icons/fi';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: <FiCalendar />, label: '캘린더' },
  { path: '/timer', icon: <FiClock />, label: '타이머' },
  { path: '/tracker', icon: <FiActivity />, label: '트래커' },
  { path: '/report', icon: <FiBarChart2 />, label: '리포트' },
  { path: '/ai', icon: <FiMessageCircle />, label: 'AI' },
  { path: '/settings', icon: <FiSettings />, label: '설정' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="fixed left-0 top-0 h-full w-20 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 z-50">
      <div className="mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
          SK
        </div>
      </div>
      
      <nav className="flex-1 w-full">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} className="w-full">
                <Link
                  to={item.path}
                  className={`
                    flex flex-col items-center justify-center w-full h-16 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                    }
                  `}
                  title={item.label}
                >
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

