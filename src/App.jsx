import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Dashboard from './pages/Dashboard';
import QuestionGenerator from './pages/QuestionGenerator';
import QuestionViewer from './pages/QuestionViewer';
import ValidatedQuestions from './pages/ValidatedQuestions';
import UserManagement from './pages/UserManagement';

import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - Acesso direto sem login */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/gerar-questoes" element={<QuestionGenerator />} />
        <Route path="/questoes" element={<QuestionViewer />} />
        <Route path="/questoes-validadas" element={<ValidatedQuestions />} />
        <Route path="/usuarios" element={<UserManagement />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
