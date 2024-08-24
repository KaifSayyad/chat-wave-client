import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import ChatInactive from './ChatInactive';
import Message from './Message';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Navbar from '../utils/Navbar'; // Ensure this path is correct
import '../assets/styles/ChatPage.css';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import app from './../../firebase.js'
import { toast } from 'react-toastify';

const SERVER_URL = import.meta.env.VITE_SERVER_URL; // Ensure SERVER_URL is correctly set

const ChatPage = () => {

  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [hasPartner, setHasPartner] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const auth = getAuth(app);
  let newSocket = null;
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if(user && newSocket){
        newSocket.emit('add-to-redis', {userId : user.uid, socketId : newSocket.id});
        newSocket.emit('get-from-redis', {userId : user.uid});
      }else{
        if(user) console.log(`socket is null`);
        if(socket) console.log('user is null');
      }
    });
    return () => unsubscribe();
  }, [auth, newSocket]);

  useEffect(() => {
    // Initialize socket connection
    newSocket = io(SERVER_URL, {
      transports: ['websocket'],
      path: '/socket.io'
    });
    setSocket(newSocket);

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
      // console.info('Partner found!');
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

  const handleConnect = () => {
    if (isConnected) {
      if (window.confirm('Are you sure you want to disconnect?')) {
        socket.emit('forceDisconnect');
        setIsConnected(false);
        setHasPartner(false);
        setIsSearching(false);
        setMessages([]); // Reset messages on disconnect
        newSocket = null;
      }
    } else {
      setIsSearching(true);
      socket.connect();
      socket.emit('look-for-partner', socket.id);
    }
  };

  const handleStopSearching = () => {
    setIsSearching(false);
    socket.emit('stop-searching', socket.id);
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


  const handleSaveChat = () => {
    // Save chat messages to mongoDB
    console.log(`messages.length = ${messages.length}, isConnected = ${isConnected}, hasPartner = ${hasPartner}, newSocket = ${newSocket}, userId = ${localStorage.getItem('userId')}`);
    if(messages.length > 0 && isConnected && hasPartner && localStorage.getItem('userId')){
      console.log('Chat saved successfully!');
      toast.success('Chat saved successfully!', {
        position: 'top-center',
        autoClose: 3000,
      });
    }
  };


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <Navbar handleSaveChat={handleSaveChat} hasPartner={hasPartner}/>
      <div className="wrapper">
        <div className="chat-container">
          {!isConnected && !hasPartner ? (
            <div className="connect-buttons">
              <Button variant="contained" color="primary" onClick={handleConnect} style={{
                marginTop:'10px',
                marginRight:'10px',
                marginLeft:'10px',
                height: '40px',
                width: 'fit-content' }}>
                {isSearching ? 'Searching...' : 'Connect'}
              </Button>

              <Button variant="contained" color="secondary" onClick={handleStopSearching} style={{
                marginTop:'10px',
                marginRight:'10px',
                marginLeft:'10px',
                height: '40px',
                width: 'fit-content',
                display: isSearching ? 'block' : 'none' }}>
                Stop Searching
              </Button>
            </div>
          ) : isConnected && !hasPartner ? (
            <ChatInactive />
          ) : (
            <>
          <div className="chat-header">
            This header will container name and profile picture of the partner
          </div>
          <div className="chat-messages">
            {messages.slice().reverse().map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </div>
          <div className="chat-input">
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              variant="outlined"
              placeholder="Type a message"
              style={{ backgroundColor: 'white', marginRight: '10px', marginLeft: '10px' }}
            />
            <Button variant="contained" color="primary" onClick={handleSendMessage} style={{
              marginRight:'10px', 
              marginLeft:'10px',
              height: '40px',
              width: '50px' }}>
            ➤
            </Button>
          </div>
          </>
        )}
        </div>
      </div>
    </>
  );
};

export default ChatPage;