import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

const socket = io('https://chatapp-backend-b74z.onrender.com');

function App() {
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    socket.on('update_users', (onlineUsers) => {
      setUsers(onlineUsers);
    });

    socket.on('receive_message', ({ from, message }) => {
      setChat((prevChat) => [...prevChat, { sender: from, message }]);
    });

    return () => {
      socket.off('update_users');
      socket.off('receive_message');
    };
  }, []);

  const joinChat = () => {
    if (!username.trim()) {
      alert('Please enter a username.');
      return;
    }
    socket.emit('join', username);
    setJoined(true);
  };

  const selectRecipient = (user) => {
    setRecipient(user);
    fetchMessages(user);
  };

  const fetchMessages = async (user) => {
    try {
      const response = await axios.get(`https://chatapp-backend-b74z.onrender.com/api/chat/messages/${username}/${user}`);
      setChat(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = () => {
    if (!recipient || !message.trim()) {
      alert('Please select a recipient and enter a message.');
      return;
    }
    socket.emit('send_message', { to: recipient, message });
    setChat((prevChat) => [...prevChat, { sender: 'You', message }]);
    setMessage('');
  };

  return (
    <div className="container">
      {!joined ? (
        <div className="join-box">
          <h2>Enter your name to join the chat</h2>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your name" />
          <button onClick={joinChat}>Join</button>
        </div>
      ) : (
        <div className="chat-area">
          <div className="sidebar">
            <h3>Online Users</h3>
            {users.length === 1 ? <p>No other users online.</p> : users.filter(user => user !== username).map((user, index) => (
              <p key={index} className="user" onClick={() => selectRecipient(user)}>{user}</p>
            ))}
          </div>

          <div className="chat-box-container">
            {recipient ? (
              <>
                <h2>Chat with {recipient}</h2>
                <div className="chat-box">
                  {chat.length === 0 ? <p>No messages yet.</p> : chat.map((msg, index) => (
                    <p key={index} className={`chat-message ${msg.sender === 'You' ? 'sent' : 'received'}`}>
                      <strong>{msg.sender}:</strong> {msg.message}
                    </p>
                  ))}
                </div>
                <div className="message-input">
                  <input type="text" placeholder="Type a message" value={message} onChange={(e) => setMessage(e.target.value)} />
                  <button onClick={sendMessage}>Send</button>
                </div>
              </>
            ) : <h3>Select a user to start chatting</h3>}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
