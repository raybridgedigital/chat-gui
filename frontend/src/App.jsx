import { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  async function sendMessage() {
    if (!input.trim()) return;

    const updatedMessages = [
      ...messages,
      {
        role: "user",
        content: input,
      },
    ];

    setMessages(updatedMessages);
    setInput("");

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
  }

  return (
    <div style={{ maxWidth: "900px", margin: "20px auto" }}>
      <h1>Chat GUI</h1>

      <div
        style={{
          border: "1px solid #ccc",
          minHeight: "500px",
          padding: "10px",
          marginBottom: "10px",
          overflowY: "auto",
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx}>
            <strong>{msg.role}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      <textarea
        rows="4"
        style={{ width: "100%" }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <br />

      <button onClick={sendMessage}>
        Send
      </button>
    </div>
  );
}

export default App;
