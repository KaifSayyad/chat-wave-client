import React, { useState, useEffect } from 'react';
import Navbar from '../utils/Navbar';
import Message from '../components/Message';
import '../assets/styles/Dashboard.css';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // If using Firebase Auth
import app from './../../firebase.js'; // If using Firebase Auth
import { TextField, IconButton, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const SERVER_URL = import.meta.env.VITE_SERVER_URL; // Ensure SERVER_URL is correctly set

const Dashboard = () => {
  const [chats, setChats] = useState([]); // Array of chats
  const [activeChatId, setActiveChatId] = useState(null); // ID of the active chat
  const [messages, setMessages] = useState([]); // Messages of the active chat
  const [newMessage, setNewMessage] = useState(''); // New message input
  const [loadingChats, setLoadingChats] = useState(true); // Loading state for chats
  const [loadingMessages, setLoadingMessages] = useState(false); // Loading state for messages
  const [sendingMessage, setSendingMessage] = useState(false); // Sending message state
  const [userId, setUserId] = useState(null); // Current user's ID
  const [error, setError] = useState(null); // Error state
  const auth = getAuth(app); // Firebase Auth instance
  
  // Fetch userId on component mount (from localStorage or Firebase Auth)
  useEffect(() => {
    const fetchUserId = async () => {
      // Example with localStorage
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
        fetchChats(storedUserId);
      } else {
        // Example with Firebase Auth
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

  // Fetch all chats for the user
  const fetchChats = async (userId) => {
    try {
      setLoadingChats(true);
      const response = await fetch(`${SERVER_URL}/api/chats/getUserChats/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch chats');
      const data = await response.json();
      setChats(data);
    } catch (err) {
      console.error('Error fetching chats:', err);
      setError('Could not load chats');
    } finally {
      setLoadingChats(false);
    }
  };

  // Fetch messages for a specific chat
  const fetchMessages = async (chatId) => {
    try {
      setLoadingMessages(true);
      setActiveChatId(chatId);
      const response = await fetch(`${SERVER_URL}/api/chats/getChatMessages/${userId}/${chatId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Could not load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return; // Prevent sending empty messages
    const messageContent = newMessage.trim();
    const messagePayload = {
      from: userId,
      body: messageContent,
      timestamp: new Date().toISOString(),
    };

    // Optimistically update UI
    setMessages((prevMessages) => [...prevMessages, { ...messagePayload, from: 'me', _id: Date.now() }]);
    setNewMessage('');
    setSendingMessage(true);
    console.log(userId, activeChatId, messagePayload);
    try {
      const response = await fetch(`${SERVER_URL}/api/chats/updateChat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId : userId,
          chatId: activeChatId,
          message: messagePayload,
        }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      const data = await response.json();
      // Update the last message with the correct ID from the server
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messagePayload._id ? { ...msg, _id: data._id, timestamp: data.timestamp } : msg
        )
      );
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Could not send message');
      // Remove the optimistically added message
      setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messagePayload._id));
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle Enter key press in message input
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
        {/* Chats List */}
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

        {/* Chat Area */}
        <div className="chat-area">
          {loadingMessages ? (
            <CircularProgress />
          ) : activeChatId ? (
            <>
              <div className="messages-container">
                {messages.map((message) => (
                  <Message key={message._id} message={message} />
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
