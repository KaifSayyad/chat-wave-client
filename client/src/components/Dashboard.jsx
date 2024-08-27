import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import Navbar from '../utils/Navbar';
import Message from '../components/Message';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import app from './../../firebase.js';
import { TextField, IconButton, CircularProgress, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { toast } from 'react-toastify';
import '../assets/styles/Dashboard.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL;
const DEBOUNCE_DELAY = 100; // Adjust delay as needed

const Dashboard = () => {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const messagesRef = useRef([]);
  const partnerSocketIdRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const unsentMessagesRef = useRef([]); // Buffer for unsent messages

  const auth = getAuth(app);

  // Fetch userId from localStorage or Firebase Authentication
  const fetchUserId = useCallback(async () => {
    try {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
        await fetchChats(storedUserId);
      } else {
        onAuthStateChanged(auth, (user) => {
          if (user) {
            setUserId(user.uid);
            localStorage.setItem('userId', user.uid); // Cache userId locally
            fetchChats(user.uid);
          } else {
            setError('User not authenticated');
            toast.error('User not authenticated');
          }
        });
      }
    } catch (err) {
      console.error('Error fetching user ID:');
      setError('Failed to authenticate user');
      toast.error('Failed to authenticate user');
    }
  }, [auth]);

  // WebSocket connection management
  const initializeSocket = useCallback(() => {
    if (userId) {
      const socket = io(SERVER_URL, {
        transports: ['websocket'],
        path: '/socket.io',
        query: { userId },
      });

      socket.on('connect', () => {
        console.info('Connected to server');
      });

      socket.on('partner-found', (partnerId) => {
        // console.info('Partner found with socket ID:', partnerId);
        partnerSocketIdRef.current = partnerId;
      });

      socket.on('message', (data) => {
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, { ...data, from: 'partner' }];
          messagesRef.current = updatedMessages.slice(-100); // Keep the last 100 messages
          return updatedMessages;
        });
      });

      socket.on('disconnect', () => {
        console.info('Disconnected from server');
        partnerSocketIdRef.current = null;
      });

      socketRef.current = socket;

      return () => {
        socket.close();
      };
    }
  }, [userId]);

  // Fetch user chats
  const fetchChats = useCallback(async (userId) => {
    try {
      setLoadingChats(true);
      const response = await fetch(`${SERVER_URL}/api/chats/getUserChats/${userId}`);
      if (!response.ok){
        toast.error("Failed to fetch chats", {
          position : 'top-center',
          autoClose : 3000,
        });
      };
      const data = await response.json();
      // console.log(data);
      setChats(data);
    } catch (err) {
      // console.error('Error fetching chats:', err);
      setError('Could not load chats');
      toast.error('Could not load chats');
    } finally {
      setLoadingChats(false);
    }
  }, []);

  // Fetch messages for the selected chat
  const fetchMessages = useCallback(async (chatId) => {
    if (chatId === activeChatId) return;

    try {
      setLoadingMessages(true);
      setActiveChatId(chatId);
      const response = await fetch(`${SERVER_URL}/api/chats/getChatMessages/${userId}/${chatId}`);
      if (!response.ok){
        toast.error("Failed to fetch messages", {
          position : 'top-center',
          autoClose : 3000,
        });
      };
      const data = await response.json();

      setMessages(data.slice(-100));
      messagesRef.current = data.slice(-100);
    } catch (err) {
      console.error('Error fetching messages:');
      setError('Could not load messages');
      toast.error('Could not load messages');
    } finally {
      setLoadingMessages(false);
    }

    // Fetch partner socket ID for the active chat
    try {
      const partnerId = await fetch(`${SERVER_URL}/api/chats/getPartnerId/${userId}/${chatId}`).then((res) => res.json());
      socketRef.current?.emit('look-for-partnerId', partnerId);
    } catch (err) {
      console.error('Error fetching partner ID:');
      toast.error('Failed to find chat partner');
    }
  }, [activeChatId, userId]);

  // Send a new message with debouncing
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    const messagePayload = {
      from: userId,
      body: messageContent,
      timestamp: new Date().toISOString(),
    };

    const newMessageObject = { ...messagePayload, from: 'me', _id: Date.now().toString() };
    messagesRef.current = [...messagesRef.current, newMessageObject].slice(-100);
    setMessages([...messagesRef.current]);

    // Add message to the buffer
    unsentMessagesRef.current = [...unsentMessagesRef.current, newMessageObject];
    setNewMessage('');
    setSendingMessage(true);

    if (partnerSocketIdRef.current) {
      // Emit message through WebSocket if partner is online
      socketRef.current?.emit('message', messagePayload);
    } 

    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        // Send messages to backend if partner is offline
        const response = await fetch(`${SERVER_URL}/api/chats/updateChat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            chatId: activeChatId,
            messages: unsentMessagesRef.current,
          }),
        });
        if (!response.ok){
          toast.error("Failed to send message", {
            position : 'top-center',
            autoClose : 3000,
          });
        }
        // console.log(response);
        unsentMessagesRef.current = []; // Clear the buffer after successful update
      } catch (err) {
        console.error('Error sending message:');
        setError('Could not send message');
        toast.error('Could not send message');
      } finally {
        setSendingMessage(false);
      }
    }, DEBOUNCE_DELAY); // Debounce delay
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Initialize the user ID and WebSocket connection
  useEffect(() => {
    fetchUserId();
  }, [fetchUserId]);

  useEffect(() => {
    const cleanupSocket = initializeSocket();
    return () => cleanupSocket?.();
  }, [initializeSocket]);

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="saved-chats">
          <Typography variant="h6" className='saved-chats-heading'>Saved Chats</Typography>
          {loadingChats ? (
            <CircularProgress />
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : chats.length > 0 ? (
            <ul className="chat-list">
              {chats.map((chat) => (
                <li
                  key={chat._id}
                  className={`chat-item ${chat._id === activeChatId ? 'active' : ''}`}
                  onClick={() => fetchMessages(chat._id)}
                >
                  Chat with {chat.partnerName || 'Unknown'}
                </li>
              ))}
            </ul>
          ) : (
            <Typography>No chats available</Typography>
          )}
        </div>

        <div className="chat-area">
          {loadingMessages ? (
            <CircularProgress />
          ) : activeChatId ? (
            <>
              <div className="messages-container">
                {messagesRef.current.map((message, index) => (
                  <Message key={message._id ? message._id : `${message.timestamp}-${index}`} message={message} />
                ))}
              </div>
              <div className="new-message-area">
                <TextField
                  variant="outlined"
                  fullWidth
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <IconButton onClick={handleSendMessage} color="primary" disabled={sendingMessage}>
                  {sendingMessage ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
              </div>
            </>
          ) : (
            <Typography>Select a chat to start messaging</Typography>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
