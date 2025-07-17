import { useEffect, useState, useRef } from "react";
import "./app.css";

function App() {
  const [serverMessage, setServerMessage] = useState("Loading...");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Hello! Welcome to TasteBot. Try asking about food, movies, music, travel, trends & more.",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:3001/")
      .then((res) => res.text())
      .then((data) => setServerMessage(data))
      .catch(() => setServerMessage("Failed to connect to backend"));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: input },
    ]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            "🤖 I'm a demo bot. Here's what you said: " +
            input,
        },
      ]);
    }, 700);
    setInput("");
  }

  const quickReplies = [
    "Show me Italian restaurants.",
    "Latest movies to watch?",
    "Suggest trending songs.",
    "Travel ideas for this summer.",
    "Any vegan cafe nearby?",
    "Fashion trends 2025?",
  ];

  return (
    <div className="chat-center-bg">
      <div className="chat-container glassy">
        <div className="chat-header">
          <span className="bot-avatar">🤖</span>
          Qloo TasteBot
        </div>
        <div className="server-status">{serverMessage}</div>
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-row ${msg.sender}`}>
              <span className="avatar">
                {msg.sender === "bot" ? "🤖" : "🧑"}
              </span>
              <div className={`message-bubble ${msg.sender}`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form className="chat-input-area" onSubmit={handleSubmit} autoComplete="off">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            aria-label="Chat message input"
          />
          <button type="submit" className="chat-send-btn" aria-label="Send">
            ➤
          </button>
        </form>
        <div className="chat-buttons">
          {quickReplies.map((prompt, i) => (
            <button
              key={i}
              type="button"
              className="quick-btn"
              onClick={() => setInput(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
