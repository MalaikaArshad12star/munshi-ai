"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Send, Sparkles, Trash2, Volume2, VolumeX } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { buildIntelligence } from "@/lib/intelligence";
import { classifyIntent } from "@/lib/intent";
import { composeAnswer, suggestedQuestions, type MunshiAnswer } from "@/lib/answers";
import { useSpeech } from "@/lib/use-speech";
import { AnswerCard } from "@/components/ask/answer-card";
import { MunshiLogo } from "@/components/layout/logo";
import { cn } from "@/lib/cn";

interface Msg {
  id: number;
  role: "user" | "munshi";
  text?: string;
  answer?: MunshiAnswer;
}

let nextId = 1;

export default function AskMunshiPage() {
  const { data, settings, mounted } = useApp();
  const simple = settings.mode === "simple";
  const lang = settings.language;

  const intel = useMemo(() => (data ? buildIntelligence(data) : null), [data]);
  const speech = useSpeech(lang);

  const [messages, setMessages] = useState<Msg[]>(() =>
    intel
      ? [{ id: nextId++, role: "munshi", answer: composeAnswer(intel, "greeting", lang) }]
      : [],
  );
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  if (!mounted || !data || !intel) return null;

  const suggestions = suggestedQuestions(intel, lang);

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || thinking) return;
    setInput("");
    setMessages((m) => [...m, { id: nextId++, role: "user", text }]);
    setThinking(true);
    window.setTimeout(() => {
      const intent = classifyIntent(text);
      const answer = composeAnswer(intel, intent, lang);
      setMessages((m) => [...m, { id: nextId++, role: "munshi", answer }]);
      setThinking(false);
    }, 550);
  };

  const clear = () => {
    setMessages([{ id: nextId++, role: "munshi", answer: composeAnswer(intel, "greeting", lang) }]);
    speech.stopSpeaking();
  };

  const onMic = () => {
    if (!speech.recognitionSupported) return;
    if (speech.listening) speech.stopListening();
    else speech.startListening((text) => setInput((v) => (v ? `${v} ${text}` : text)));
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-3xl flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-t-2xl border border-line bg-panel px-4 py-3">
        <MunshiLogo className="h-9 w-9" />
        <div className="flex-1">
          <p className="text-sm font-bold text-fg">Ask Munshi Anything</p>
          <p className="text-[11px] text-faint">Your AI business munshi — answers from your real data</p>
        </div>
        <button
          type="button"
          onClick={clear}
          className="grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-panel3 hover:text-fg"
          aria-label="Clear conversation"
          title="Clear conversation"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto border-x border-line bg-ink/40 p-4">
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-to-br from-brand to-brand-deep px-4 py-2.5 text-sm text-white shadow-card">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex items-start gap-2.5">
              <MunshiLogo className="mt-1 h-7 w-7 shrink-0" />
              <div className="max-w-[88%] flex-1 rounded-2xl rounded-bl-sm border border-line bg-panel px-4 py-3 shadow-card">
                {m.answer && <AnswerCard answer={m.answer} simple={simple} />}
                {!simple && m.answer?.quick && (
                  <button
                    type="button"
                    onClick={() => (speech.speaking ? speech.stopSpeaking() : speech.speak(m.answer!.quick))}
                    className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-faint hover:text-fg"
                  >
                    {speech.speaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    {speech.speaking ? "Stop" : "Listen"}
                  </button>
                )}
              </div>
            </div>
          ),
        )}

        {thinking && (
          <div className="flex items-start gap-2.5">
            <MunshiLogo className="mt-1 h-7 w-7 shrink-0" />
            <div className="flex items-center gap-1.5 rounded-2xl border border-line bg-panel px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-brand-strong" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-brand-strong [animation-delay:120ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-brand-strong [animation-delay:240ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="flex gap-2 overflow-x-auto border-x border-line bg-panel/60 px-3 py-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => send(s)}
            className="shrink-0 rounded-full border border-line bg-panel2 px-3 py-1.5 text-[11px] font-semibold text-muted hover:border-brand/40 hover:text-fg"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 rounded-b-2xl border border-line bg-panel p-3">
        <button
          type="button"
          onClick={onMic}
          disabled={!speech.recognitionSupported}
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors",
            speech.listening ? "bg-down/20 text-down" : "bg-panel3 text-muted hover:text-fg",
            !speech.recognitionSupported && "cursor-not-allowed opacity-40",
          )}
          aria-label="Voice input"
          title={speech.recognitionSupported ? "Voice input" : "Voice input not supported in this browser"}
        >
          {speech.recognitionSupported ? <Mic className="h-4.5 w-4.5" /> : <MicOff className="h-4.5 w-4.5" />}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={lang === "ur" ? "اپنا سوال لکھیں…" : lang === "roman" ? "Apna sawal likhein…" : "Ask about sales, profit, udhaar…"}
          className="h-10 flex-1 rounded-xl border border-line bg-panel2 px-3 text-sm text-fg placeholder:text-faint focus:border-brand focus:outline-none"
        />
        <button
          type="button"
          onClick={() => send()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-deep text-white shadow-glow hover:brightness-110"
          aria-label="Send"
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </div>
      {!speech.recognitionSupported && (
        <p className="mt-1 text-center text-[10px] text-faint">
          Voice input is not supported in this browser — typing works great. <Sparkles className="inline h-3 w-3" />
        </p>
      )}
    </div>
  );
}
