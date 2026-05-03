import { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:3000';

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ userName: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await axios.post(`${API}/auth/register`, form, { withCredentials: true });
        setIsRegister(false);
        return;
      }
      const res = await axios.post(
        `${API}/auth/login`,
        { email: form.email, password: form.password },
        { withCredentials: true }
      );
      // decode userId from token payload (middle part, base64)
      const payload = JSON.parse(atob(res.data.accessToken.split('.')[1]));
      onLogin(res.data.accessToken, { userId: payload.userId, email: form.email });
    } catch (err) {
      setError(err.response?.data || 'Something went wrong');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>PingMe</h2>
        <p style={styles.sub}>{isRegister ? 'Create an account' : 'Sign in to chat'}</p>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegister && (
            <input
              style={styles.input}
              placeholder="Username"
              value={form.userName}
              onChange={e => setForm({ ...form, userName: e.target.value })}
              required
            />
          )}
          <input
            style={styles.input}
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={styles.input}
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
          <button style={styles.btn} type="submit">
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <p style={styles.toggle}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span style={styles.link} onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Login' : 'Register'}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' },
  card: { background: '#fff', padding: '2rem', borderRadius: '12px', width: '360px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' },
  title: { fontSize: '1.8rem', marginBottom: '4px', color: '#1a1a2e' },
  sub: { color: '#888', marginBottom: '1.5rem', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem', outline: 'none' },
  btn: { padding: '10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' },
  error: { color: '#e53e3e', marginBottom: '0.8rem', fontSize: '0.85rem' },
  toggle: { marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: '#666' },
  link: { color: '#4f46e5', cursor: 'pointer', fontWeight: 600 },
};
