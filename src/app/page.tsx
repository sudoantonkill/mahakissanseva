"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, ImagePlus, Leaf, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  image?: string;
}

const SUGGESTIONS = [
  { emoji: "🌾", text: "Best sugarcane varieties for Kolhapur district?" },
  { emoji: "🐛", text: "How to identify & control Early Shoot Borer?" },
  { emoji: "💧", text: "Ideal drip irrigation schedule for Suru planting?" },
  { emoji: "🍂", text: "My sugarcane leaves are turning yellow — why?" },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const scroll = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scroll(); }, [messages, isLoading, scroll]);

  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = "auto";
      taRef.current.style.height = `${Math.min(taRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const r = new FileReader();
      r.onloadend = () => setImagePreview(r.result as string);
      r.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const send = async (text: string, img?: string | null) => {
    if ((!text.trim() && !img) || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      image: img || undefined,
    };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          image: img || null,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setMessages((p) => [
        ...p,
        { id: (Date.now() + 1).toString(), role: "bot", content: data.reply },
      ]);
    } catch {
      setMessages((p) => [
        ...p,
        { id: (Date.now() + 1).toString(), role: "bot", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input, imagePreview);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as unknown as React.FormEvent);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <>
      {/* ===== Animated Background ===== */}
      <div className="background-effects">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
        <div className="dot-grid" />
        {/* Floating leaves */}
        <span className="particle">🍃</span>
        <span className="particle">🌿</span>
        <span className="particle">🍂</span>
        <span className="particle">🌱</span>
        <span className="particle">🍃</span>
        <span className="particle">🌿</span>
        <span className="particle">🍂</span>
        <span className="particle">🌱</span>
        <span className="particle">🍃</span>
        <span className="particle">🌿</span>
      </div>

      <div className="app-container">
        {/* ===== Header ===== */}
        <header className="header">
          <div className="header-logo">
            <Leaf size={22} color="white" strokeWidth={2.5} />
          </div>
          <div className="header-info">
            <h1 className="header-title">MahaKissanSeva</h1>
            <p className="header-subtitle">AI Sugarcane Expert • Maharashtra</p>
          </div>
          <div className="header-badge">
            <span className="pulse-dot" />
            Online
          </div>
        </header>

        {/* ===== Content ===== */}
        {!hasMessages ? (
          <div className="welcome-screen">
            <div className="welcome-emoji">🌾</div>
            <h2 className="welcome-title">
              Your <span className="welcome-title-accent">Sugarcane Expert</span> is Ready
            </h2>
            <p className="welcome-desc">
              Ask anything about sugarcane farming in Maharashtra — diseases, pests,
              irrigation, soil, subsidies — or upload a photo for instant diagnosis.
            </p>
            <div className="suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="suggestion-card"
                  onClick={() => send(s.text)}
                  type="button"
                >
                  <span className="suggestion-emoji">{s.emoji}</span>
                  <span className="suggestion-label">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-container">
            {messages.map((m) => (
              <div key={m.id} className={`message-row ${m.role}`}>
                <div className={`avatar ${m.role === "bot" ? "bot-av" : "user-av"}`}>
                  {m.role === "bot" ? (
                    <Leaf size={16} color="white" strokeWidth={2.5} />
                  ) : (
                    "👤"
                  )}
                </div>
                <div className={`bubble ${m.role === "bot" ? "bot-bubble" : "user-bubble"}`}>
                  {m.image && (
                    <img src={m.image} alt="Upload" className="bubble-image" />
                  )}
                  {m.role === "bot" ? (
                    <div className="md">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span>{m.content}</span>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-row bot">
                <div className="avatar bot-av">
                  <Leaf size={16} color="white" strokeWidth={2.5} />
                </div>
                <div className="bubble bot-bubble typing-dots">
                  <span className="t-dot" />
                  <span className="t-dot" />
                  <span className="t-dot" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}

        {/* ===== Input ===== */}
        <div className="input-section">
          <form onSubmit={onSubmit} className="chat-input-wrap">
            {imagePreview && (
              <div className="img-preview">
                <img src={imagePreview} alt="Preview" />
                <button type="button" className="img-preview-x" onClick={clearImage}>
                  <X size={10} />
                </button>
              </div>
            )}

            <div className="attach-btn">
              <ImagePlus size={20} />
              <input
                type="file"
                accept="image/*"
                onChange={onImage}
                ref={fileRef}
                title="Upload an image"
              />
            </div>

            <textarea
              ref={taRef}
              className="chat-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask about sugarcane farming..."
              rows={1}
            />

            <button
              type="submit"
              className="send-btn"
              disabled={(!input.trim() && !imageFile) || isLoading}
            >
              <Send size={18} />
            </button>
          </form>
          <p className="powered-by">MahaKissanSeva • Powered by Gemini AI & Pinecone RAG</p>
        </div>
      </div>
    </>
  );
}
