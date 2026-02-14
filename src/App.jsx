import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QuestionGenerator from './pages/QuestionGenerator';
import QuestionViewer from './pages/QuestionViewer';
import ValidatedQuestions from './pages/ValidatedQuestions';
import UserManagement from './pages/UserManagement';

import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota pública - Login */}
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas */}
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/gerar-questoes" element={<PrivateRoute><QuestionGenerator /></PrivateRoute>} />
          <Route path="/questoes" element={<PrivateRoute><QuestionViewer /></PrivateRoute>} />
          <Route path="/questoes-validadas" element={<PrivateRoute><ValidatedQuestions /></PrivateRoute>} />
          <Route path="/usuarios" element={<PrivateRoute><UserManagement /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
