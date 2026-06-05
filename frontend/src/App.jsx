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

  const [attachedFile, setAttachedFile] =
    useState(null);

  const [attachedContent, setAttachedContent] =
    useState("");

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] =
    useState(null);

  const chatEndRef = useRef(null);
  const chatWindowRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const pinnedToBottomRef = useRef(true);

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

    if (
      pinnedToBottomRef.current &&
      chatEndRef.current
    ) {
      chatEndRef.current.scrollIntoView();
    }

  }, [messages]);

  
function handleChatScroll() {

    const el =
      chatWindowRef.current;

    if (!el) return;

    const nearBottom =
      el.scrollHeight -
      el.scrollTop -
      el.clientHeight < 100;

    pinnedToBottomRef.current =
      nearBottom;
  }

  function createNewChat() {
    const convo = createConversation();

    setConversations((prev) => [
      convo,
      ...prev,
    ]);

    setActiveConversationId(convo.id);
  }


  function renameConversation(id) {

    const convo =
      conversations.find(
        (c) => c.id === id
      );

    const newTitle = prompt(
      "Rename conversation:",
      convo?.title || ""
    );

    if (!newTitle?.trim()) return;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              title: newTitle.trim(),
            }
          : c
      )
    );
  }

  function deleteConversation(id) {

    if (
      !confirm(
        "Delete this conversation?"
      )
    )
      return;

    const updated =
      conversations.filter(
        (c) => c.id !== id
      );

    if (updated.length === 0) {

      const convo =
        createConversation();

      setConversations([convo]);
      setActiveConversationId(
        convo.id
      );

      return;
    }

    setConversations(updated);

    if (
      activeConversationId === id
    ) {
      setActiveConversationId(
        updated[0].id
      );
    }
  }

  async function sendMessage() {
    if (
      loading ||
      !activeConversation
    )
      return;

    if (
      !input.trim() &&
      !attachedFile
    )
      return;

    const title =
      activeConversation.messages.length === 0
        ? (
            input.trim()
              ? input.slice(0, 40)
              : attachedFile
                ? `📄 ${attachedFile.name}`
                : "New Chat"
          )
        : activeConversation.title;

    const finalPrompt =
      attachedFile
        ? `FILE: ${attachedFile.name}

${attachedContent}

USER QUESTION:

${input}`
        : input;

    const displayMessage =
      attachedFile
        ? `📎 ${attachedFile.name}

${input}`
        : input;

    const updatedMessages = [
      ...messages,
      {
        role: "user",
        content: displayMessage,
      },
    ];

    const apiMessages = [
      ...messages,
      {
        role: "user",
        content: finalPrompt,
      },
    ];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              title,
              messages: updatedMessages,
            }
          : c
      )
    );

    setInput("");

    setAttachedFile(null);
    setAttachedContent("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    pinnedToBottomRef.current = true;

    setLoading(true);

    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 50);

    setAttachedFile(null);
    setAttachedContent("");


    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 50);

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
              apiMessages,
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

  async function handleFileUpload(e) {

    const file =
      e.target.files?.[0];

    if (!file)
      return;

    let content = "";

    if (
      file.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          "http://127.0.0.1:8000/extract-pdf",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      content = data.text;

    } else {

      content =
        await file.text();
    }

    setAttachedFile(file);
    setAttachedContent(content);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  }

  function removeAttachment() {

    setAttachedFile(null);
    setAttachedContent("");
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
      <aside className="sidebar">

        <button
          className="new-chat-btn"
          onClick={createNewChat}
        >
          + New Chat
        </button>

        {conversations.map((c) => (
          <div
            key={c.id}
            className={`conversation-item ${
              c.id === activeConversationId
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveConversationId(c.id)
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div className="conversation-title">
                {c.title}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "4px",
                }}
              >
                <button
                  style={{
                    padding: "2px 6px",
                    margin: 0,
                    fontSize: "12px",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    renameConversation(c.id);
                  }}
                >
                  ✏️
                </button>

                <button
                  style={{
                    padding: "2px 6px",
                    margin: 0,
                    fontSize: "12px",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(c.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </aside>

      <div className="main-panel">

        <header className="topbar">
          <h2>Reza GPT</h2>

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

        <div
          className="chat-window"
          ref={chatWindowRef}
          onScroll={handleChatScroll}
        >
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

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "10px",
            alignItems: "center",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            onChange={handleFileUpload}
          />

          {attachedFile && (
            <>
              <span>
                📎 {attachedFile.name}
              </span>

              <button
                onClick={removeAttachment}
              >
                ✖
              </button>
            </>
          )}
        </div>

        <textarea
          ref={textareaRef}
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
    </div>
  );
}

export default App;
