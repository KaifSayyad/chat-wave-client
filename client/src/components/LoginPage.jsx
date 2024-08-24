import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import '../assets/styles/LoginPage.css';

const LoginPage = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    // Check if the user is already logged in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        navigate('/dashboard');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, navigate, setUser]);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Email and password are required');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem('userId', userCredential.user.uid);
      console.log('User logged in:', userCredential.user.email);
      localStorage.setItem('userId', userCredential.user.uid);
      setEmail('');
      setPassword('');
      setUser(userCredential.user);
      navigate('/dashboard');
    } catch (error) {
      switch (error.code) {
        case 'auth/invalid-email':
          alert('Invalid email format. Please enter a valid email.');
          break;
        case 'auth/user-not-found':
          alert('User not found. Please check your email.');
          break;
        case 'auth/wrong-password':
          alert('Invalid password. Please enter the correct password.');
          break;
        default:
          console.error('Login failed:', error.message);
          alert("You haven't signed up yet. Please sign up first.");
          navigate('/signup');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <h1>Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <button onClick={handleSignup}>
          Signup
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
