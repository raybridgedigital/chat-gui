import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [provider, setProvider] = useState("openrouter");
  const [models, setModels] = useState([]);
  const [model, setModel] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadModels();
  }, []);

  async function loadModels() {
    const response = await fetch(
      "http://127.0.0.1:8000/models"
    );

    const data = await response.json();

    const providerModels = data[provider];

    setModels(providerModels);

    if (providerModels.length > 0) {
      setModel(providerModels[0].id);
    }
  }

  useEffect(() => {
    async function reload() {
      const response = await fetch(
        "http://127.0.0.1:8000/models"
      );

      const data = await response.json();

      const providerModels = data[provider];

      setModels(providerModels);

      if (providerModels.length > 0) {
        setModel(providerModels[0].id);
      }
    }

    reload();
  }, [provider]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

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
        "http://127.0.0.1:8000/chat/stream",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider,
            model,
            messages: updatedMessages,
          }),
        }
      );

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let assistantMessage = "";

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "",
        },
      ]);

      while (true) {

        const { done, value } =
          await reader.read();

        if (done) break;

        const chunk =
          decoder.decode(value);

        assistantMessage += chunk;

        setMessages([
          ...updatedMessages,
          {
            role: "assistant",
            content: assistantMessage,
          },
        ]);
      }
    } catch {
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
    <div className="app">
      <header className="topbar">
        <h2>Chat GUI</h2>

        <div className="selectors">
          <select
            value={provider}
            onChange={(e) =>
              setProvider(e.target.value)
            }
          >
            <option value="openrouter">
              OpenRouter
            </option>

            <option value="ollama">
              Ollama
            </option>
          </select>

          <select
            value={model}
            onChange={(e) =>
              setModel(e.target.value)
            }
          >
            {models.map((m) => (
              <option
                key={m.id}
                value={m.id}
              >
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="chat-window">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${msg.role}`}
          >
            <ReactMarkdown>
              {msg.content}
            </ReactMarkdown>
          </div>
        ))}

        {loading && (
          <div className="thinking">
            Thinking...
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      <textarea
        value={input}
        rows="4"
        placeholder="Type message..."
        onChange={(e) =>
          setInput(e.target.value)
        }
        onKeyDown={handleKeyDown}
      />

      <button onClick={sendMessage}>
        Send
      </button>
    </div>
  );
}

export default App;
