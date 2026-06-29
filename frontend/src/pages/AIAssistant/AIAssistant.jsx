import {
  Bot,
  Copy,
  Lightbulb,
  Mic,
  PlusCircle,
  Send,
  Share2,
  ThumbsDown,
  ThumbsUp,
  TrendingDown,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../services/api";

const initialMessages = [
  {
    id: 1,
    role: "user",
    content:
      "Hey, I noticed a significant drop in our performance this month. Can you analyze why our revenue changed compared to last month?",
  },
  {
    id: 2,
    role: "assistant",
    content:
      "Saya bisa membantu analisis perubahan revenue, top products, top countries, dan customer bernilai tinggi berdasarkan data BI yang tersedia.",
    topic: "root_cause",
  },
];

const suggestedQuestions = [
  "Produk apa yang menghasilkan revenue tertinggi?",
  "Negara mana yang berkontribusi paling besar?",
  "Customer mana yang paling bernilai?",
  "Kenapa revenue berubah bulan ini?",
];

function ChatBubble({ message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] rounded-2xl rounded-tr-none bg-[#4f46e5] p-4 text-sm leading-6 text-white shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#233144] text-[#c3c0ff]">
        <Bot size={18} />
      </div>
      <div className="max-w-[86%] space-y-4">
        <div className="rounded-2xl rounded-tl-none border border-[#c7c4d8] bg-[#e6eeff] p-4 text-sm leading-6 text-[#0d1c2e]">
          <div className="whitespace-pre-line">{message.content}</div>
        </div>
        {message.topic === "root_cause" && <AnalysisCard cards={message.cards} />}
        <div className="flex gap-2">
          {[ThumbsUp, ThumbsDown, Copy, Share2].map((Icon) => (
            <button
              className="rounded p-2 text-[#464555] transition hover:bg-[#dce9ff] hover:text-[#3525cd]"
              key={Icon.name}
              type="button"
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalysisCard({ cards }) {
  const kpi = cards?.kpi;
  const topProduct = cards?.top_product;
  const topCountry = cards?.top_country;

  return (
    <div className="overflow-hidden rounded-xl border border-[#c7c4d8] bg-white/85 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between border-b border-[#c7c4d8] bg-[#3525cd]/5 px-5 py-4">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-[#3525cd]">
          <TrendingDown size={20} />
          Business Analysis
        </h3>
        <span className="rounded-full bg-[#3525cd]/10 px-3 py-1 text-xs font-bold text-[#3525cd]">
          {kpi?.latest_growth ?? 0}% Growth
        </span>
      </div>
      <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#464555]">
            Key Metrics
          </p>
          <div className="rounded-lg border border-[#c7c4d8]/50 bg-white p-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#464555]">Total Revenue</span>
              <span className="font-bold text-[#0d1c2e]">
                ${Number(kpi?.total_revenue || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-[#c7c4d8]/50 bg-white p-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#464555]">Orders</span>
              <span className="font-bold text-[#0d1c2e]">
                {Number(kpi?.total_orders || 0).toLocaleString("en-US")}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#464555]">
            Focus Areas
          </p>
          <div className="rounded-lg border border-[#c7c4d8]/50 bg-white p-3 text-sm">
            <p className="font-semibold text-[#0d1c2e]">{topProduct?.Description || "N/A"}</p>
            <p className="text-[#464555]">Top revenue product</p>
          </div>
          <div className="rounded-lg border border-[#c7c4d8]/50 bg-white p-3 text-sm">
            <p className="font-semibold text-[#0d1c2e]">{topCountry?.Country || "N/A"}</p>
            <p className="text-[#464555]">Top revenue country</p>
          </div>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="rounded-xl border border-[#3525cd]/20 bg-[#e2dfff] p-4">
          <div className="mb-3 flex items-center gap-2 font-bold text-[#0f0069]">
            <Lightbulb size={18} />
            Strategic Recommendations
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg bg-white/50 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#3525cd] text-white">1</div>
              <span className="text-sm text-[#0d1c2e]">Review top market dependency</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/50 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#3525cd] text-white">2</div>
              <span className="text-sm text-[#0d1c2e]">Protect top product availability</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIAssistant() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const nextIdRef = useRef(3);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(messageText = input) {
    const trimmed = messageText.trim();
    if (!trimmed || loading) return;

    const userMessage = {
      id: nextIdRef.current,
      role: "user",
      content: trimmed,
    };
    nextIdRef.current += 1;

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-8).map((message) => ({
        role: message.role,
        content: message.content,
      }));

      const response = await api.post("/api/assistant/chat", {
        message: trimmed,
        history,
      });

      setMessages((current) => [
        ...current,
        {
          id: nextIdRef.current,
          role: "assistant",
          content: response.data.answer,
          topic: response.data.topic,
          cards: response.data.cards,
        },
      ]);
      nextIdRef.current += 1;
    } catch (error) {
      console.error(error);
      setMessages((current) => [
        ...current,
        {
          id: nextIdRef.current,
          role: "assistant",
          content:
            "Maaf, saya belum bisa mengambil data dari server. Pastikan FastAPI berjalan di port 8000.",
          topic: "error",
        },
      ]);
      nextIdRef.current += 1;
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border border-[#c7c4d8] bg-white shadow-sm">
        <section className="flex-1 space-y-6 overflow-y-auto bg-[#f8f9ff] px-5 py-6 lg:px-8">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          {loading && (
            <div className="flex items-center gap-3 text-sm font-medium text-[#464555]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#233144] text-[#c3c0ff]">
                <Bot size={16} />
              </div>
              Analyzing business data...
            </div>
          )}
          <div ref={chatEndRef} />
        </section>

        <footer className="border-t border-[#c7c4d8] bg-white p-5">
          <div className="mx-auto mb-4 flex max-w-4xl flex-wrap gap-2">
            {suggestedQuestions.map((question) => (
              <button
                className="rounded-full border border-[#c7c4d8] bg-white px-4 py-2 text-sm text-[#464555] transition hover:border-[#3525cd] hover:bg-[#3525cd]/5 hover:text-[#3525cd]"
                key={question}
                onClick={() => sendMessage(question)}
                type="button"
              >
                {question}
              </button>
            ))}
          </div>
          <div className="mx-auto max-w-4xl">
            <div className="flex items-end rounded-2xl border border-[#777587] bg-white p-2 shadow-xl transition focus-within:shadow-[#3525cd]/10">
              <button className="p-3 text-[#464555] transition hover:text-[#3525cd]" type="button">
                <PlusCircle size={22} />
              </button>
              <textarea
                className="max-h-32 flex-1 resize-none border-none bg-transparent px-2 py-3 text-sm text-[#0d1c2e] outline-none"
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your business data..."
                rows={1}
                value={input}
              />
              <div className="flex items-center gap-1 pb-1 pr-1">
                <button className="p-3 text-[#464555] transition hover:text-[#3525cd]" type="button">
                  <Mic size={20} />
                </button>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4f46e5] text-white transition hover:opacity-90 active:scale-95 disabled:opacity-50"
                  disabled={loading || !input.trim()}
                  onClick={() => sendMessage()}
                  type="button"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-[#777587]">
              AI-generated results can be inaccurate. Verify critical business decisions with source data.
            </p>
          </div>
        </footer>
      </div>
      <div className="pointer-events-none fixed right-8 top-20 z-30 hidden w-64 rounded-xl border border-white/60 bg-white/60 p-4 shadow-lg backdrop-blur xl:block">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wide text-[#464555]">Live Context</span>
          <span className="h-2 w-2 rounded-full bg-[#3525cd]" />
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#464555]">Mode</span>
            <span className="font-bold text-[#3525cd]">BI Rules</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#464555]">Sources</span>
            <span className="font-bold">5 APIs</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[#dae2fd]">
            <div className="h-full w-[62%] bg-[#3525cd]" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AIAssistant;
