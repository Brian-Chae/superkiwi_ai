import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/Layout/MainLayout';
import { Calendar } from './pages/Calendar';
import { Timer } from './pages/Timer';
import { Tracker } from './pages/Tracker';
import { Report } from './pages/Report';
import { AI } from './pages/AI';
import { Settings } from './pages/Settings';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Calendar />} />
          <Route path="/timer" element={<Timer />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/report" element={<Report />} />
          <Route path="/ai" element={<AI />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
