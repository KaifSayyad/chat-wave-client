import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import About from './About';
import Message from './Message';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import '../assets/styles/ChatPage.css';

// const SERVER_URL = import.meta.env.VITE_SERVER_URL; // Update with your server URL
const SERVER_URL = "http://localhost:9999/api"

const ChatPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [hasPartner, setHasPartner] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      // console.log(`Connected to server with socket id = ${newSocket.id}`);
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
      // console.log(`Partner found with partner id = ${partnerId}`);
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
      setMessages([]);
      setMessages([]); // Reset messages when partner disconnects
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

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


    // console.log('Sending message:', packet);

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
    <Container maxWidth="md" className="chat-container">
      <Paper elevation={3} className="chat-paper" sx={{
        backgroundColor: '#1f2833',
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" className="chat-header"
          sx={{
            backgroundColor: '#c5c6c7', // Set your desired background color
            padding: '8px 16px', // Add padding to space out the buttons
            borderRadius: '4px', // Add some border radius for a rounded look
            boxShadow: '1px 2px 6px rgba(0, 0, 0, 0.6)', // Add a subtle box shadow
          }}
        >
          <h1>ChatWave</h1>
          <Box className="navbar-buttons">
            <Button variant="contained" color="primary" onClick={handleConnect}>
              {isConnected ? 'Disconnect' : isSearching ? 'Searching...' : 'Connect'}
            </Button>
          </Box>
        </Box>
        {isConnected ? (
          <>
            <Box className="chat-messages">
              {messages.slice().reverse().map((message) => (
                <Message key={message.id} message={message} />
              ))}
            </Box>
            <Box display="flex" className="chat-input">
              <TextField
                fullWidth
                multiline
                maxRows={4}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}                
                  variant="outlined"
                placeholder="Type a message"
              />
              <Button variant="contained" color="primary" onClick={handleSendMessage} style={{ marginLeft: '10px' }}>
                ➤
              </Button>
            </Box>
          </>
        ) : (
          <div className="chat-disconnected">
            <About />
          </div>
        )}
      </Paper>
    </Container>
  );
};

export default ChatPage;
