import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./../assets/styles/Navbar.css";
import logo from "./../assets/icons/logo.png";

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const location = useLocation();
    const currentPath = location.pathname;

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if(user) setIsLoggedIn(true);
        });

        // Clean up the subscription on unmount
        return () => unsubscribe();
    }, []);

    const navbarItems = [
        (isLoggedIn) ?
            {
            title: currentPath === "/chat" ? "Save Chat" : "Chat Anonymously",
            link: currentPath === "/chat" ? "/save" : "/chat",
            isDisabled: currentPath !== "/chat" || !isLoggedIn
        } : {},
        {
            title: isLoggedIn ? "Logout" : "Login",
            link: isLoggedIn ? "/logout" : "/login"
        }
    ];

    return (
        <nav>
            <div className="logo-container">
                <Link to="/" className="link">
                    <img src={logo} alt="logo" className="logo" />
                    <span className="chatwave-text">ChatWave</span>
                </Link>
            </div>
            <div className="menu-items">
                {navbarItems.map((item, index) => (
                    <Link
                        className={`link ${item.isDisabled ? "disabled" : ""}`}
                        to={item.link}
                        key={index}
                        aria-disabled={item.isDisabled ? "true" : "false"}
                    >
                        {item.title}
                    </Link>
                ))}
            </div>
        </nav>
    );
};

export default Navbar;
