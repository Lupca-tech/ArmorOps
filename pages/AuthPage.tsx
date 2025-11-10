import React, { useState } from 'react';
import { auth } from '../services/firebase';
// Fix: Import firebase v9 compat to resolve module export errors for auth functions and types.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { Translation } from '../translations';

interface AuthPageProps {
  onAuthSuccess: () => void;
  T: Translation;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess, T }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!isLogin) {
      if (password !== confirmPassword) {
        setError(T.passwordMismatchError);
        setIsLoading(false);
        return;
      }
      // Password must be at least 8 characters, with one uppercase, one lowercase, and one special character.
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
      if (!passwordRegex.test(password)) {
        setError(T.passwordComplexityError);
        setIsLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        // Fix: Use auth.signInWithEmailAndPassword from the compat library.
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        // Fix: Use auth.createUserWithEmailAndPassword from the compat library.
        await auth.createUserWithEmailAndPassword(email, password);
      }
      onAuthSuccess();
    } catch (err) {
      // Fix: Use firebase.auth.AuthError type from the compat library.
      const authError = err as firebase.auth.AuthError;
      // Simple error message handling
      switch (authError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Invalid email or password.');
          break;
        case 'auth/email-already-in-use':
          setError('An account with this email already exists.');
          break;
        case 'auth/weak-password':
          setError(T.passwordComplexityError);
          break;
        default:
          setError('An authentication error occurred. Please try again.');
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] animate-fade-in-up p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-white/10">
        <h2 className="text-2xl font-bold text-center text-cyan-400">
          {isLogin ? T.login : T.signup}
        </h2>
        <form className="space-y-6" onSubmit={handleAuthAction}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              {T.emailLabel}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-gray-900 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/80 focus:border-cyan-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              {T.passwordLabel}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-gray-900 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/80 focus:border-cyan-500"
            />
          </div>
          
           {!isLogin && (
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300">
                {T.confirmPasswordLabel}
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 mt-1 text-white bg-gray-900 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/80 focus:border-cyan-500"
              />
            </div>
          )}


          {error && <p className="text-sm text-center text-red-400 bg-red-900/50 p-2 rounded-md border border-red-700">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {isLoading ? (isLogin ? T.loggingIn : T.signingUp) : (isLogin ? T.login : T.signup)}
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-400">
          {isLogin ? T.loginPrompt : T.signupPrompt}{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setPassword('');
              setConfirmPassword('');
            }}
            className="font-medium text-cyan-400 hover:text-cyan-300 focus:outline-none focus:underline"
          >
            {isLogin ? T.signup : T.login}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;