import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import ChatInactive from './ChatInactive';
import SaveRequest from '../utils/SaveRequest.jsx';
import Message from './Message';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import handleAccidentalDashboard from '../utils/HandleAccidentalDashboard.jsx';
import Navbar from '../utils/Navbar';
import '../assets/styles/ChatPage.css';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import app from './../../firebase.js';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const ChatPage = () => {
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [hasPartner, setHasPartner] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  
  const messagesRef = useRef([]);
  const userIdRef = useRef(null);

  const auth = getAuth(app);
  let newSocket = null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        userIdRef.current = user.uid;
        if (newSocket) {
          newSocket.emit('add-to-redis', { userId: localStorage.getItem('userId'), socketId: newSocket.id });
          newSocket.emit('get-from-redis', { userId: localStorage.getItem('userId') });
        } else {
          console.log(`Socket is null`);
        }
      } else {
        if (socket) console.log('User is null');
      }
    });

    return () => unsubscribe();
  }, [auth, newSocket]);

  useEffect(() => {
    // Initialize socket connection
    newSocket = io(SERVER_URL, {
      transports: ['websocket'],
      path: '/socket.io',
      query: { userId: null },
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
      messagesRef.current = []; // Clear ref
    });

    newSocket.on('partner-found', () => {
      setIsConnected(true);
      setHasPartner(true);
      setIsSearching(false);
    });

    newSocket.on('message', (data) => {
      data['from'] = 'partner';
      // Update both state and ref
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, data].slice(-100);
        messagesRef.current = updatedMessages;
        return updatedMessages;
      });
    });

    newSocket.on('partner-disconnected', () => {
      console.info('Partner disconnected');
      toast.error('Partner disconnected', {
        position: 'top-center',
        autoClose: 3000,
      });

      setIsConnected(false);
      setHasPartner(false);
      setIsSearching(false);
      setMessages([]); // Reset messages when partner disconnects
      messagesRef.current = []; // Clear ref
    });

    newSocket.on('save-request', async () => {
      console.log('Save request received from partner');
      const userId = userIdRef.current;
      if (userId) {
        SaveRequest({
          onAccept: () => {
            console.log('Accepting save request from frontend');
            newSocket.emit('save-request-accepted', { userId });
          },
          onReject: () => {
            console.log('Rejecting save request');
            newSocket.emit('save-request-rejected');
          }
        });
      } else {
        toast.error('User not logged in', {
          position: 'top-center',
          autoClose: 3000,
        });
      }
    });

    newSocket.on('save-request-accepted', async (data) => {
      console.log("Logging data from save-request-accepted", data.userId);
      const partnerId = data.userId;
      const userId = userIdRef.current;

      if (userId && partnerId && messagesRef.current.length > 0) {
        console.log('Sending request to backend');
        const response = await fetch(`${SERVER_URL}/api/chats/saveChat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            partnerId,
            messages: messagesRef.current,
          }),
        });

        if (!response.ok) {
          toast.error('Error saving chat', {
            position: 'top-center',
            autoClose: 3000,
          });
        } else {
          toast.success('Chat saved successfully!', {
            position: 'top-center',
            autoClose: 3000,
          });
        }
      } else {
        toast.error('Partner not found', {
          position: 'top-center',
          autoClose: 3000,
        });
      }
    });

    newSocket.on('save-request-rejected', () => {
      toast.error('Save request rejected by partner', {
        position: 'top-center',
        autoClose: 3000,
      });
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
        messagesRef.current = []; // Clear ref
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
      from: 'me',
      body: newMessage,
      timestamp: new Date().toISOString(),
    };

    socket.emit('message', message);

    // Update both state and ref
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, message].slice(-100);
      messagesRef.current = updatedMessages;
      return updatedMessages;
    });

    setNewMessage('');
  };

  const handleSaveChat = async () => {
    socket.emit('send-save-request');
    toast.success('Save request sent to partner', {
      position: 'top-center',
      autoClose: 3000,
    });
  };

  const onDashboardClick = () => {
    handleAccidentalDashboard(messages, isConnected, hasPartner, navigate);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <Navbar handleSaveChat={handleSaveChat} hasPartner={hasPartner} onDashboardClick={onDashboardClick} />
      <div className="wrapper">
        <div className="chat-container">
          {!isConnected && !hasPartner ? (
            <div className="connect-buttons">
              <Button
                variant="contained"
                color="primary"
                onClick={handleConnect}
                style={{
                  marginTop: '10px',
                  marginRight: '10px',
                  marginLeft: '10px',
                  height: '40px',
                  width: 'fit-content',
                }}
              >
                {isSearching ? 'Searching...' : 'Connect'}
              </Button>

              <Button
                variant="contained"
                color="secondary"
                onClick={handleStopSearching}
                style={{
                  marginTop: '10px',
                  marginRight: '10px',
                  marginLeft: '10px',
                  height: '40px',
                  width: 'fit-content',
                  display: isSearching ? 'block' : 'none',
                }}
              >
                Stop Searching
              </Button>
            </div>
          ) : isConnected && !hasPartner ? (
            <ChatInactive />
          ) : (
            <>
              <div className="chat-header">
                This header will contain name and profile picture of the partner
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
              height: '40px', 
              width: 'fit-content' }}>
              Send
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
