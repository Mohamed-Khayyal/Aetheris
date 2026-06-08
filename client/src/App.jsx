import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout       from './components/Layout';
import HomePage     from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage    from './pages/LoginPage';
import CategoryPage from './pages/CategoryPage';
import TopicPage    from './pages/TopicPage';
import NewTopicPage from './pages/NewTopicPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProfilePage from './pages/ProfilePage';
import './index.css';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth pages (no navbar/footer) */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login"    element={<LoginPage />} />

          {/* Main layout */}
          <Route element={<Layout />}>
            <Route path="/"                     element={<HomePage />} />
            <Route path="/category/:category"   element={<CategoryPage />} />
            <Route path="/topic/:id"            element={<TopicPage />} />
            <Route path="/new-topic"            element={<NewTopicPage />} />
            <Route path="/admin"                element={<AdminDashboardPage />} />
            <Route path="/profile"              element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
