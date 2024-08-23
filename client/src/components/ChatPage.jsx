import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import ChatInactive from './ChatInactive';
import Message from './Message';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Navbar from '../utils/Navbar'; // Ensure this path is correct
import '../assets/styles/ChatPage.css';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import { app } from './../../firebase.js';
import { updateSocket } from '../../../../chat-wave-server/server/controllers/socketController';

const SERVER_URL = import.meta.env.VITE_SERVER_URL; // Ensure SERVER_URL is correctly set


console.log(SERVER_URL);
const ChatPage = () => {
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [hasPartner, setHasPartner] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const auth = getAuth(app);

  useEffect(() => {

    const unsubsribe =  onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

   unsubsribe();
    // Initialize socket connection
    const newSocket = io(SERVER_URL, {
      transports: ['websocket'],
      path: '/socket.io'
    });
    setSocket(newSocket);

    handleUpdateSocket();

    newSocket.on('connect', () => {
      console.info('Connected to server successfully');
    });

    newSocket.on('disconnect', () => {
      console.info('Disconnected from server');
      setIsConnected(false);
      setHasPartner(false);
      setIsSearching(false);
      setMessages([]); // Reset messages on disconnect
    });

    newSocket.on('partner-found', () => {
      setIsConnected(true);
      setHasPartner(true);
      setIsSearching(false);
      console.info('Partner found!');
    });

    newSocket.on('message', (data) => {
      data['from'] = 'partner';
      setMessages((prevMessages) => [...prevMessages, data].slice(-100));
    });

    newSocket.on('partner-disconnected', () => {
      console.info('Partner disconnected');
      setIsConnected(false);
      setHasPartner(false);
      setIsSearching(false);
      setMessages([]); // Reset messages when partner disconnects
    });

    return () => {
      newSocket.disconnect();
    };
  }, [SERVER_URL]);

  const handleUpdateSocket = async () => {
    try {
      let response;
      console.log("From frontend", user.uid);

      response = await fetch(`${SERVER_URL}/api/socket/updateSocket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          userId: user.uid,
          socketId: socket.id,
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
        alert('Socket updated successfully');
      }
    } catch (error) {
      alert(error);
    }
  };
  const handleConnect = () => {
    if (isConnected) {
      if (window.confirm('Are you sure you want to disconnect?')) {
        socket.emit('forceDisconnect');
      }
    } else {
      setIsSearching(true);
      socket.connect();
      socket.emit('look-for-partner', socket.id);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    const message = {
      id: new Date().getTime(), // Unique ID based on timestamp
      from: 'me',
      body: newMessage,
      status: 'delivered', // Assume message is delivered for now
      timestamp: new Date().toISOString(),
    };

    socket.emit('message', message);

    setMessages((prevMessages) => [...prevMessages, message].slice(-100)); // Keep last 100 messages
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <Navbar />
      {!isConnected || !hasPartner ? (
        <ChatInactive />
      ) : (
      <div className="wrapper">
        <div className="chat-container">
          <div className="chat-messages">
            {messages.toReversed().map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </div>
          <div className="chat-input">
            <TextField
              multiline
              rows={3}
              placeholder="Type a message..."
              variant="outlined"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSendMessage}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
      )}
      <Button
        variant="contained"
        color="primary"
        onClick={handleConnect}
        disabled={isSearching}
      >
        {isConnected ? 'Disconnect' : 'Connect'}
      </Button>
    </>
  );
};

export default ChatPage;
