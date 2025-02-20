import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";
import { LuBotMessageSquare } from "react-icons/lu";
import { IoSend } from "react-icons/io5";
import { FaCopy } from "react-icons/fa";
import { TiTick } from "react-icons/ti";

const socket = io("https://buzz-chat-app-p81t.onrender.com");

function App() {
  const [roomCode, setRoomCode] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on("previousMessages", (msgs) => {
      setMessages(msgs);
    });

    socket.on("roomCreated", (code) => {
      setRoomCode(code);
      socket.emit("joinRoom", code);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("previousMessages");
      socket.off("roomCreated");
    };
  }, []);

  const createRoom = () => {
    socket.emit("createRoom");
  };

  const handleJoinClick = () => {
    setShowJoinInput(true);
  };

  const joinRoom = () => {
    if (roomCode.trim() !== "") {
      socket.emit("joinRoom", roomCode);
    }
  };

  const sendMessage = () => {
    if (!roomCode || message.trim() === "") return;
    socket.emit("sendMessage", { roomCode, message, sender: "User" });
    setMessage("");
  };

  const leaveRoom = () => {
    if (roomCode) {
      socket.emit("leaveRoom", roomCode);
      setRoomCode(""); 
      setMessages([]); 
      setShowJoinInput(false); 
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); 
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Buzz <LuBotMessageSquare/></h1>
      </div>

      {!roomCode ? (
        <div className="main">
          <button className="btn" onClick={createRoom}>Create Room</button>

          {!showJoinInput ? (
            <button className="btn" onClick={handleJoinClick}>Join Room</button>
          ) : (
            <div className="join-room">
              <input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
              />
              <button className="btn" onClick={joinRoom}>Join</button>
            </div>
          )}
        </div>
      ) : (
        <div className="chat-room">
          <div className="room-head">
            <div className="code-container">
              <h2 className="room-code">Room Code:</h2>
              <div className="code">
                <p>{roomCode}</p>
                <button className="copy-btn" onClick={copyToClipboard}>
                {copied ? <TiTick /> : <FaCopy />}
                </button>
              </div>
              
            </div>
            <button className="exit-btn" onClick={leaveRoom}>Exit Room</button>
          </div>

          <div className="messages-container">
            {messages.length > 0 ? (
              messages.map((msg, idx) => (
                <div key={idx} className="message">
                  <strong>{msg.sender}:</strong> {msg.message}
                </div>
              ))
            ) : (
              <p>No messages yet</p>
            )}
          </div>
          
          <div className="message-input">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button className="sent-btn" onClick={sendMessage}><IoSend /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
