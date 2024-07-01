import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import "../assets/styles/Home.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home">
      <div className="content">
        <h1>Welcome to ChatWave</h1>
        <p>
          Connect with random people around the world in an instant. Discover
          new conversations, make friends, and enjoy an engaging chat experience
          with ChatWave.
        </p>
        <Button variant="primary" onClick={() => navigate('/chat')}>
          Connect Now
        </Button>
      </div>
    </div>
  );
};

export default Home;