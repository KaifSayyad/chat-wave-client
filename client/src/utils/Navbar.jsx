import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "../assets/styles/Navbar.css";
import logo from "../assets/icons/logo.png";


const Navbar = ({ handleSaveChat, hasPartner, onDashboardClick }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  const navbarItems = [
    isLoggedIn && currentPath !== "/chat"
      ? { title: "Chat Now", link: "/chat" }
      : isLoggedIn && currentPath === "/chat"
      ? { title: "Dashboard", onClick: onDashboardClick }
      : null,
    isLoggedIn && hasPartner && currentPath === "/chat"
      ? { title: "Save Chat", onClick: handleSaveChat }
      : null,
    { title: isLoggedIn ? "Logout" : "Login", link: isLoggedIn ? "/logout" : "/login" },
  ].filter(Boolean); // Remove null entries

  return (
    <nav>
      <div className="logo-container">
        <Link to="/" className="link">
          <img src={logo} alt="logo" className="logo" />
          <span className="chatwave-text">ChatWave</span>
        </Link>
      </div>
      <div className="menu-items">
        {navbarItems.map((item, index) =>
          item.link ? (
            <Link
              className={`link ${item.isDisabled ? "disabled" : ""}`}
              to={item.link}
              key={index}
              aria-disabled={item.isDisabled ? "true" : "false"}
            >
              {item.title}
            </Link>
          ) : (
            <span key={index} className="link" onClick={item.onClick}>
              {item.title}
            </span>
          )
        )}
      </div>
    </nav>
  );
};

export default Navbar;
