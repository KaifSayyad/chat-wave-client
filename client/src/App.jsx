import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Home from './components/Home.jsx';
import ChatPage from './components/ChatPage.jsx';
import LoginPage from './components/LoginPage.jsx';
import SignupPage from './components/SignupPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import Loading from './utils/Loading.jsx';

import app from '../firebase.js';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);
  const location = useLocation();
  const navigate = useNavigate(); // Hook to programmatically navigate

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // Logout function
  const handleLogout = async () => {
    try {
      localStorage.removeItem('userId');
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  // Handle route changes for /logout
  useEffect(() => {
    if (location.pathname === '/logout') {
      handleLogout();
    }
  }, [location.pathname]);

  const getRouteElement = (element) => {
    if (loading) {
      return <Loading />; // Optionally show a loading indicator
    }

    if (!user) {
      if (location.pathname === '/dashboard') {
        toast.error('Please log in first to access the dashboard!', {
          position: "top-center",
          autoClose: 4000,
        });
      }
      return <Navigate to="/login" replace />;
    } else if (user && !user.emailVerified) {
      if (location.pathname === '/dashboard') {
        toast.warning('Please verify your email before accessing the dashboard.', {
          position: "top-center",
          autoClose: 4000,
        });
      }
      return <Navigate to="/home" replace />;
    }

    return element;
  };

  return (
    <div className="App">
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/signup" element={<SignupPage setUser={setUser} />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/dashboard" element={getRouteElement(<Dashboard />)} />
        <Route path="/logout" element={null} /> {/* Handle logout with useEffect */}
      </Routes>
    </div>
  );
}

export default App;
