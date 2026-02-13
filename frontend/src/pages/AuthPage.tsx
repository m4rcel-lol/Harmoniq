import { useState, type FormEvent } from 'react';
import { useStore } from '../store';

interface AuthPageProps {
  onSuccess: () => void;
}

export function AuthPage({ onSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!username || username.length < 3) {
          setError('Username must be at least 3 characters');
          setLoading(false);
          return;
        }
        await register(username, email, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[var(--radius-lg)] bg-gradient-to-br from-harmoniq-blue to-[var(--color-aurora-end)] mb-4">
            <span className="text-white text-2xl font-bold">H</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Harmoniq</h1>
          <p className="text-text-muted mt-1">
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-bg-secondary rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-elevation-2)] border border-border"
        >
          {error && (
            <div className="mb-4 p-3 rounded-[var(--radius-sm)] bg-danger/10 text-danger text-sm" role="alert">
              {error}
            </div>
          )}

          {!isLogin && (
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-text-primary mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-sm)] bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-harmoniq-blue focus:ring-1 focus:ring-harmoniq-blue transition-colors"
                placeholder="Enter username"
                required={!isLogin}
                minLength={3}
                maxLength={32}
              />
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--radius-sm)] bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-harmoniq-blue focus:ring-1 focus:ring-harmoniq-blue transition-colors"
              placeholder="Enter email"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--radius-sm)] bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-harmoniq-blue focus:ring-1 focus:ring-harmoniq-blue transition-colors"
              placeholder="Enter password"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-[var(--radius-sm)] bg-harmoniq-blue text-white font-medium hover:bg-harmoniq-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-text-muted mt-4">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-harmoniq-blue hover:underline font-medium"
            >
              {isLogin ? 'Register' : 'Log In'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
