import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { gsap } from "gsap";
import "../assets/styles/Home.css";

const Home = () => {
  const navigate = useNavigate();
  const headingRef = useRef(null);
  const paragraphRef = useRef(null);

  useEffect(() => {
    const scrambleText = (element, newText, duration) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const iterations = Math.floor(duration * 60); // 60fps
      let interval = setInterval(() => {
        element.textContent = newText
          .split('')
          .map((char, i) => {
            if (Math.random() > 0.5 || i > Math.floor(element.textContent.length * (iterations / duration) / 60)) {
              return char;
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('');
        duration--;
        if (duration <= 0) {
          clearInterval(interval);
          element.textContent = newText;
        }
      }, 3000 / 60);
    };

    const revealText = (element, newText, duration) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      element.textContent = '';
      let charIndex = 0;

      const revealNextChar = () => {
        if (charIndex < newText.length) {
          const char = newText[charIndex];
          element.textContent += chars.includes(char) ? chars[Math.floor(Math.random() * chars.length)] : char;

          gsap.to(element, {
            duration: 0.1,
            textContent: newText.substring(0, charIndex + 1),
            onComplete: revealNextChar
          });

          charIndex++;
        }
      };

      revealNextChar();
    };

    scrambleText(headingRef.current, 'ChatWave', 10);
    setTimeout(() => revealText(paragraphRef.current, 'Connect with random people around the world in an instant.', 1), 1000);
  }, []);

  return (
    <div className="home">
      <div className="content">
        <h1 ref={headingRef}>ChatWave</h1>
        <p ref={paragraphRef}>
          Connect with random people around the world in an instant.
        </p>
        <div className="buttons">
          <Button variant="primary" onClick={() => navigate('/login')}>
            Login
          </Button>
          <Button variant="primary" onClick={() => navigate('/chat')}>
            Chat Anonymously
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
