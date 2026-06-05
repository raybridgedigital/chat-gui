import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

function createConversation() {
  return {
    id: crypto.randomUUID(),
    title: "New Chat",
    messages: [],
  };
}

function App() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [provider, setProvider] = useState("openrouter");
  const [models, setModels] = useState([]);
  const [model, setModel] = useState("");

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] =
    useState(null);

  const chatEndRef = useRef(null);

  const activeConversation =
    conversations.find(
      (c) => c.id === activeConversationId
    ) || conversations[0];

  const messages =
    activeConversation?.messages || [];

  useEffect(() => {
    const saved =
      localStorage.getItem("chatgui_conversations");

    if (saved) {
      const parsed = JSON.parse(saved);

      setConversations(parsed.conversations);
      setActiveConversationId(
        parsed.activeConversationId
      );
    } else {
      const convo = createConversation();

      setConversations([convo]);
      setActiveConversationId(convo.id);
    }
  }, []);

  useEffect(() => {
    if (conversations.length === 0) return;

    localStorage.setItem(
      "chatgui_conversations",
      JSON.stringify({
        conversations,
        activeConversationId,
      })
    );
  }, [
    conversations,
    activeConversationId,
  ]);

  useEffect(() => {
    loadModels();
  }, []);

  async function loadModels() {
    const response = await fetch(
      "http://127.0.0.1:8000/models"
    );

    const data = await response.json();

    const providerModels =
      data[provider];

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

      const providerModels =
        data[provider];

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
    if (
      !input.trim() ||
      loading ||
      !activeConversation
    )
      return;

    const updatedMessages = [
      ...messages,
      {
        role: "user",
        content: input,
      },
    ];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              messages: updatedMessages,
            }
          : c
      )
    );

    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/chat/stream",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            provider,
            model,
            messages:
              updatedMessages,
          }),
        }
      );

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let assistantMessage = "";

      setConversations((prev) =>
        prev.map((c) =>
          c.id ===
          activeConversationId
            ? {
                ...c,
                messages: [
                  ...updatedMessages,
                  {
                    role:
                      "assistant",
                    content: "",
                  },
                ],
              }
            : c
        )
      );

      while (true) {
        const {
          done,
          value,
        } = await reader.read();

        if (done) break;

        const chunk =
          decoder.decode(value);

        assistantMessage += chunk;

        setConversations(
          (prev) =>
            prev.map((c) =>
              c.id ===
              activeConversationId
                ? {
                    ...c,
                    messages: [
                      ...updatedMessages,
                      {
                        role:
                          "assistant",
                        content:
                          assistantMessage,
                      },
                    ],
                  }
                : c
            )
        );
      }
    } catch {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? {
                ...c,
                messages: [
                  ...updatedMessages,
                  {
                    role:
                      "assistant",
                    content:
                      "Connection error.",
                  },
                ],
              }
            : c
        )
      );
    }

    setLoading(false);
  }

  function handleKeyDown(e) {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
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
              setProvider(
                e.target.value
              )
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
              setModel(
                e.target.value
              )
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
        {messages.map(
          (msg, idx) => (
            <div
              key={idx}
              className={`message ${msg.role}`}
            >
              <ReactMarkdown>
                {msg.content}
              </ReactMarkdown>
            </div>
          )
        )}

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
          setInput(
            e.target.value
          )
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
