import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
    }
    setLoading(false);
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={handleLogin}>
        <h2>Accesso admin</h2>
        <p>Inserisci le credenziali per gestire gli articoli.</p>
        <div className="editor-grid">
          <label>
            Email
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && <p style={{ color: '#b6362c' }}>{error}</p>}
          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Accesso...' : 'Entra'}
          </button>
        </div>
      </form>
    </div>
  );
}
