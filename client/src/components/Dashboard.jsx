import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Navbar from '../utils/Navbar';
import Message from '../components/Message';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import app from './../../firebase.js';
import { TextField, IconButton, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import '../assets/styles/Dashboard.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const Dashboard = () => {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]); // Use an array for messages
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  
  const messagesRef = useRef([]); // Use useRef with an array for messages
  const partnerSocketIdRef = useRef(null); // Ref for partner socket ID
  const debounceTimeoutRef = useRef(null);
  const newMessagesRef = useRef([]); // Use useRef to store messages to be sent

  const auth = getAuth(app);

  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
        fetchChats(storedUserId);
      } else {
        onAuthStateChanged(auth, (user) => {
          if (user) {
            setUserId(user.uid);
            fetchChats(user.uid);
          } else {
            setError('User not authenticated');
          }
        });
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      console.log('Connecting to server with user ID:', userId);
      const newSocket = io(SERVER_URL, {
        transports: ['websocket'],
        path: '/socket.io',
        query: { userId },
      });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.info('Connected to server successfully');
      });

      newSocket.on('partner-found', (partnerId) => {
        console.info('Partner found with socket ID:', partnerId);
        partnerSocketIdRef.current = partnerId; // Update the ref
        console.log(partnerSocketIdRef);
      });

      newSocket.on('message', (data) => {
        data['from'] = 'partner';
        // Update both state and ref
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, data].slice(-100);
          messagesRef.current = updatedMessages;
          console.log(updatedMessages);
          return updatedMessages;
        });
        
      });

      newSocket.on('disconnect', () => {
        console.info('Disconnected from server');
        partnerSocketIdRef.current = null; // Reset partner socket ID on disconnect
      });

      return () => newSocket.close();
    }
  }, [userId, SERVER_URL]);

  const fetchChats = async (userId) => {
    try {
      setLoadingChats(true);
      const response = await fetch(`${SERVER_URL}/api/chats/getUserChats/${userId}`);
      if (!response.ok){
        toast.error('Failed to fetch chats', {
          position : 'top-center',
          autoClose: 3000,
       });
      }
      const data = await response.json();
      setChats(data);
    } catch (err) {
      console.error('Error fetching chats:', err);
      setError('Could not load chats');
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchMessages = async (chatId) => {
    // Check if the clicked chat is the same as the currently active chat
    if (chatId === activeChatId) return; // No need to fetch messages again

    try {
      setLoadingMessages(true);
      setActiveChatId(chatId);
      const response = await fetch(`${SERVER_URL}/api/chats/getChatMessages/${userId}/${chatId}`);
      if (!response.ok){
        toast.error('Failed to fetch messages', {
          position : 'top-center',
          autoClose: 3000,
        });

      };
      const data = await response.json();

      // Update messages state with new messages, avoiding duplicates
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, data].slice(-100);
        messagesRef.current = updatedMessages;
        return updatedMessages;
      });      
      console.log(messages);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Could not load messages');
    } finally {
      setLoadingMessages(false);
    }

    // Fetch partner socket ID for the active chat
    const partnerId = await fetch(`${SERVER_URL}/api/chats/getPartnerId/${userId}/${chatId}`).then((res) => res.json());
    socket.emit('look-for-partnerId', partnerId);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    const messagePayload = {
      from: userId,
      body: messageContent,
      timestamp: new Date().toISOString(),
    };

    const newMessageObject = { ...messagePayload, from: 'me', _id: Date.now() };

    // Add new message to ref
    messagesRef.current = [...messagesRef.current, newMessageObject].slice(-100);

    setNewMessage('');
    setSendingMessage(true);

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        if (partnerSocketIdRef.current) {
          // If a partner is found and connected via WebSocket, send the message through socket
          socket.emit('message', messagePayload);
        } else {
          // Fallback to server-based messaging if partner not connected
          const response = await fetch(`${SERVER_URL}/api/chats/updateChat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userId,
              chatId: activeChatId,
              messages: newMessagesRef.current, // Send all new messages
            }),
          });
          if (!response.ok){
            toast.error('Failed to send message', {
              position : 'top-center',
              autoClose: 3000,
            });
          };
          const data = await response.json();
          // Update messages with server response
          messagesRef.current = [...messagesRef.current, ...data].slice(-100);
          newMessagesRef.current = []; // Clear the ref array after successful sending
        }
      } catch (err) {
        console.error('Error sending message:', err);
        setError('Could not add message to database');
        // messagesRef.current = messagesRef.current.filter(msg => msg._id !== newMessageObject._id);
      } finally {
        setSendingMessage(false);
      }
    }, 500); // Debounce delay of 500ms
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="saved-chats">
          <div className='saved-chats-heading'>Saved Chats</div>
          {loadingChats ? (
            <CircularProgress />
          ) : error ? (
            <p>{error}</p>
          ) : chats.length > 0 ? (
            <ul className="chat-list">
              {chats.map((chat) => (
                <li
                  key={chat._id}
                  className={`chat-item ${chat._id === activeChatId ? 'active' : ''}`}
                  onClick={() => fetchMessages(chat._id)}
                >
                  Chat with {chat.participants?.filter((id) => id !== userId)[0] || 'Unknown'}
                </li>
              ))}
            </ul>
          ) : (
            <p>No chats available</p>
          )}
        </div>

        <div className="chat-area">
          {loadingMessages ? (
            <CircularProgress />
          ) : activeChatId ? (
            <>
              <div className="messages-container">
                {messages.map((message) => (
                  <Message key={message._id ? message._id : message.timestamp} message={message} />
                ))}
              </div>
              <div className="message-input-container">
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type a message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sendingMessage}
                />
                <IconButton color="primary" onClick={handleSendMessage} disabled={sendingMessage || !newMessage.trim()}>
                  <SendIcon />
                </IconButton>
              </div>
            </>
          ) : (
            <p>Select a chat to start messaging</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
