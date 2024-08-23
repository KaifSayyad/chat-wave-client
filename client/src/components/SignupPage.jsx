import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import axios from 'axios';
import { app, firestore } from '../../firebase.js';
import './../assets/styles/SignupPage.css'; // Import your CSS file for styling

const SERVER_URL = import.meta.env.VITE_SERVER_URL; // Ensure SERVER_URL is correctly set

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!email || !username || !password || !confirmPassword) {
      alert('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update the user's display name
      await updateProfile(user, {
        displayName: username,
      });

      // Send email verification
      await sendEmailVerification(user);
      let response;
      // Create a new user document in Firestore
      response = await fetch(`${SERVER_URL}/api/users/addUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          userId: user.uid,
          username: username,
          email: email,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const message = data.message || "Something went wrong, please try again later"
        alert(message);
        window.location.reload();
      }
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        alert('Signup successful! Please verify your email.');
        navigate('/login'); 
      }
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        alert('Email is already in use.');
      } else {
        alert(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-screen">
        <div className="signup-container">
        <h2>Signup</h2>
        <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
        />
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
        <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button onClick={handleSignup} disabled={loading}>
            {loading ? 'Signing up...' : 'Signup'}
        </button>
        </div>
    </div>
  );
};

export default SignupPage;