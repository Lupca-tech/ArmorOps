
import React, { useState, useEffect, useRef } from 'react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particlesArray: Particle[] = [];

    class Particle {
      x: number;
      y: number;
      directionX: number;
      directionY: number;
      size: number;
      speed: number;

      constructor(x: number, y: number, directionX: number, directionY: number, size: number) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.speed = 0.1 + Math.random() * 0.3; // Slower speed
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = 'rgba(34, 211, 238, 0.7)'; // cyan-400 with opacity
        ctx.fill();
      }

      update() {
        if (this.x > canvas.width || this.x < 0) {
          this.directionX = -this.directionX;
        }
        if (this.y > canvas.height || this.y < 0) {
          this.directionY = -this.directionY;
        }
        this.x += this.directionX * this.speed;
        this.y += this.directionY * this.speed;
        this.draw();
      }
    }

    const init = () => {
      particlesArray = [];
      const numberOfParticles = (canvas.height * canvas.width) / 10000;
      for (let i = 0; i < numberOfParticles; i++) {
        const size = Math.random() * 1.5 + 1;
        const x = Math.random() * (canvas.width - size * 2) + size;
        const y = Math.random() * (canvas.height - size * 2) + size;
        const directionX = (Math.random() * 2) - 1;
        const directionY = (Math.random() * 2) - 1;
        particlesArray.push(new Particle(x, y, directionX, directionY, size));
      }
    };

    const connect = () => {
      if (!ctx) return;
      let opacityValue = 1;
      const connectDistance = 130;
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a + 1; b < particlesArray.length; b++) {
          const distance = Math.sqrt(
            Math.pow(particlesArray[a].x - particlesArray[b].x, 2) +
            Math.pow(particlesArray[a].y - particlesArray[b].y, 2)
          );
          if (distance < connectDistance) {
            opacityValue = 1 - (distance / connectDistance);
            ctx.strokeStyle = `rgba(207, 250, 254, ${opacityValue * 0.5})`; // light cyan with opacity
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const particle of particlesArray) {
        particle.update();
      }
      connect();
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      init();
    };
    
    // Initial setup
    handleResize();
    animate();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

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
        if (typeof (window as any).gtag === 'function') {
          (window as any).gtag('event', 'login', { 'method': 'Email' });
        }
      } else {
        // Fix: Use auth.createUserWithEmailAndPassword from the compat library.
        await auth.createUserWithEmailAndPassword(email, password);
        if (typeof (window as any).gtag === 'function') {
          (window as any).gtag('event', 'sign_up', { 'method': 'Email' });
        }
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
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'login', { 'method': 'Google' });
      }
      onAuthSuccess();
    } catch (err) {
      const authError = err as firebase.auth.AuthError;
      console.error("Google Sign-In Error:", authError); // Add console logging for debugging
      // Provide more specific user feedback
      switch (authError.code) {
        case 'auth/popup-closed-by-user':
          setError('Sign-in cancelled. Please try again.');
          break;
        case 'auth/popup-blocked':
          setError('Popup blocked by browser. Please allow popups for this site to sign in.');
          break;
        case 'auth/cancelled-popup-request':
          setError('Sign-in cancelled. Please try again.');
          break;
        case 'auth/operation-not-supported-in-this-environment':
          setError('Google Sign-In is not available in this environment. Please use email and password.');
          break;
        default:
          setError('Failed to sign in with Google. Please try again.');
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-[calc(100vh-200px)] animate-fade-in-up p-4 overflow-hidden">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />
      <div className="relative z-10 w-full max-w-md p-8 space-y-6 bg-gray-900/80 backdrop-blur-md rounded-xl shadow-2xl border border-white/10">
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
              {isLoading && !isLogin ? T.signingUp : isLoading && isLogin ? T.loggingIn : (isLogin ? T.login : T.signup)}
            </button>
          </div>
        </form>
        
        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase">Or</span>
            <div className="flex-grow border-t border-gray-600"></div>
        </div>

        <div>
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              type="button"
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-900 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 399.5 0 256S111.8 0 244 0c69.8 0 130.8 28.2 173.4 72.8l-65.4 64.2C337 94.6 295.6 71.8 244 71.8 156.4 71.8 82.3 145.1 82.3 233.2c0 88.2 74.1 161.4 161.7 161.4 97.4 0 142.1-64.8 147.4-95.9H244v-75.5h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
              </svg>
              Sign {isLogin ? 'in' : 'up'} with Google
            </button>
        </div>
        
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
