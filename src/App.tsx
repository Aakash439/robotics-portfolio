import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BootScreen } from './components/BootScreen';
import { WorkbenchRuler } from './components/WorkbenchRuler';
import { BenchtopTestSuite } from './components/BenchtopTestSuite';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { CustomCursor } from './components/CustomCursor';
import { ParkourRobot } from './components/ParkourRobot';
import { HomePage } from './pages/HomePage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { trackInstagramVisitor } from './utils/visitorTracker';

export const App: React.FC = () => {
  useEffect(() => {
    // Run in background after initial page load so performance is never impacted
    const timer = window.setTimeout(() => {
      trackInstagramVisitor();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#ECECEB] text-[#111111] selection:bg-[#FF5500]/20 selection:text-[#111111] relative">
        <WorkbenchRuler />
        <BootScreen />
        <CustomCursor />
        <ParkourRobot />
        <BenchtopTestSuite />
        <KeyboardShortcuts />
        <Navbar />
        <div className="flex-1 pt-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects/:slug" element={<ProjectDetailPage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
