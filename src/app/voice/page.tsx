"use client";

import { useMemo, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { buildIntelligence } from "@/lib/intelligence";
import { classifyIntent } from "@/lib/intent";
import { composeAnswer, type MunshiAnswer } from "@/lib/answers";
import { useSpeech } from "@/lib/use-speech";
import { AnswerCard } from "@/components/ask/answer-card";
import { Button, Input } from "@/components/ui/kit";
import { cn } from "@/lib/cn";

export default function VoicePage() {
  const { data, settings, mounted } = useApp();
  const simple = settings.mode === "simple";
  const lang = settings.language;

  const intel = useMemo(() => (data ? buildIntelligence(data) : null), [data]);
  const speech = useSpeech(lang);

  const [answer, setAnswer] = useState<MunshiAnswer | null>(null);
  const [transcript, setTranscript] = useState("");
  const [typed, setTyped] = useState("");

  if (!mounted || !data || !intel) return null;

  const ask = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setTranscript(t);
    const intent = classifyIntent(t);
    const a = composeAnswer(intel, intent, lang);
    setAnswer(a);
  };

  const onMic = () => {
    if (!speech.recognitionSupported) return;
    if (speech.listening) {
      speech.stopListening();
    } else {
      setAnswer(null);
      speech.startListening((text) => ask(text));
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">Voice Munshi</h1>
        <p className="mt-1 text-sm text-muted">Bol kar business chalao — talk to your munshi.</p>
      </div>

      {/* Mic orb */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-panel p-8 shadow-card">
        <button
          type="button"
          onClick={onMic}
          disabled={!speech.recognitionSupported}
          className={cn(
            "relative grid h-24 w-24 place-items-center rounded-full transition-all",
            speech.listening
              ? "bg-gradient-to-br from-down to-red-700 shadow-glow"
              : "bg-gradient-to-br from-brand to-brand-deep shadow-glow hover:scale-105",
            !speech.recognitionSupported && "cursor-not-allowed opacity-40",
          )}
          aria-label={speech.listening ? "Stop listening" : "Start listening"}
        >
          {speech.listening && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-down/40" />
              <span className="absolute -inset-2 animate-pulse rounded-full border-2 border-down/40" />
            </>
          )}
          {speech.recognitionSupported ? <Mic className="relative h-9 w-9 text-white" /> : <MicOff className="h-9 w-9 text-white" />}
        </button>
        <p className="text-sm font-semibold text-fg">
          {speech.listening ? "Listening… speak now" : "Tap the mic and ask"}
        </p>
        {transcript && (
          <p className="max-w-full truncate rounded-full bg-panel2 px-4 py-1.5 text-xs text-muted">“{transcript}”</p>
        )}
        {!speech.recognitionSupported && (
          <p className="max-w-sm text-center text-xs leading-relaxed text-faint">
            Voice recognition is not available in this browser. You can still type a question below — Munshi will answer and can read it aloud.
          </p>
        )}
      </div>

      {/* Typed fallback */}
      <div className="flex gap-2">
        <Input value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask(typed)} placeholder="Or type a question…" />
        <Button onClick={() => ask(typed)}>Ask</Button>
      </div>

      {/* Answer */}
      {answer && (
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-faint">Munshi says</p>
            {speech.synthesisSupported && (
              <Button size="sm" variant="secondary" onClick={() => (speech.speaking ? speech.stopSpeaking() : speech.speak(answer.quick))}>
                {speech.speaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                {speech.speaking ? "Stop" : "Play voice"}
              </Button>
            )}
          </div>
          {speech.speaking && (
            <div className="mb-3 flex items-center gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="w-1 animate-pulse rounded-full bg-brand-strong" style={{ height: `${8 + (i % 3) * 6}px`, animationDelay: `${i * 90}ms` }} />
              ))}
              <span className="ml-2 text-[11px] font-semibold text-brand-strong">Speaking…</span>
            </div>
          )}
          <AnswerCard answer={answer} simple={simple} />
        </div>
      )}
    </div>
  );
}
