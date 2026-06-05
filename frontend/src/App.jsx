import { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const updatedMessages = [
      ...messages,
      {
        role: "user",
        content: input,
      },
    ];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b:free",
            messages: updatedMessages,
          }),
        }
      );

      const data = await response.json();

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: data.response,
        },
      ]);
    } catch (err) {
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "Connection error.",
        },
      ]);
    }

    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2>Chat GUI</h2>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "10px",
          marginBottom: "10px",
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent:
                msg.role === "user"
                  ? "flex-end"
                  : "flex-start",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                maxWidth: "70%",
                padding: "12px",
                borderRadius: "12px",
                background:
                  msg.role === "user"
                    ? "#2563eb"
                    : "#f1f5f9",
                color:
                  msg.role === "user"
                    ? "white"
                    : "black",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div>
            <em>Thinking...</em>
          </div>
        )}
      </div>

      <textarea
        rows="4"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type message..."
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "10px",
        }}
      />

      <button
        onClick={sendMessage}
        style={{
          marginTop: "10px",
          padding: "10px",
        }}
      >
        Send
      </button>
    </div>
  );
}

export default App;
