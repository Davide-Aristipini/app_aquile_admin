import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { isSupabaseConfigured, supabase } from './lib/supabase.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ArticleEditor from './pages/ArticleEditor.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import ConfigMissing from './components/ConfigMissing.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true);
      return undefined;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return <LoadingScreen />;
  }

  if (!isSupabaseConfigured) {
    return <ConfigMissing />;
  }

  if (!session) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/articles/new" element={<ArticleEditor />} />
      <Route path="/articles/:id" element={<ArticleEditor />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
