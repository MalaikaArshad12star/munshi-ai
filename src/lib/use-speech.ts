"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Language } from "@/lib/types";

// Minimal structural types for the Web Speech API (not fully in lib.dom).
interface RecResultAlt {
  transcript?: string;
}
interface RecEvent {
  results?: ArrayLike<ArrayLike<RecResultAlt>>;
}
interface SpeechRec {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
}
type RecCtor = new () => SpeechRec;

function getRecognitionCtor(): RecCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecCtor;
    webkitSpeechRecognition?: RecCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Browser-native speech (no paid APIs). Graceful fallbacks everywhere.
export function voiceLocale(lang: Language): string {
  if (lang === "ur") return "ur-PK";
  if (lang === "roman") return "ur-PK"; // best practical match for Roman Urdu
  return "en-PK";
}

export function useSpeech(lang: Language) {
  const recognitionSupported = getRecognitionCtor() !== null;
  const synthesisSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);

  useEffect(() => () => recRef.current?.abort?.(), []);

  const startListening = useCallback(
    (onResult: (text: string) => void, onEnd?: () => void): boolean => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) return false;
      const rec = new Ctor();
      recRef.current = rec;
      rec.lang = voiceLocale(lang);
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        const text = e.results?.[0]?.[0]?.transcript ?? "";
        if (text) onResult(text);
      };
      rec.onend = () => {
        setListening(false);
        onEnd?.();
      };
      rec.onerror = () => setListening(false);
      try {
        rec.start();
        setListening(true);
        return true;
      } catch {
        setListening(false);
        return false;
      }
    },
    [lang],
  );

  const stopListening = useCallback(() => recRef.current?.stop?.(), []);

  const speak = useCallback(
    (text: string): boolean => {
      if (!synthesisSupported) return false;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = voiceLocale(lang);
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utter);
      return true;
    },
    [lang, synthesisSupported],
  );

  const stopSpeaking = useCallback(() => {
    if (synthesisSupported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [synthesisSupported]);

  return { recognitionSupported, synthesisSupported, listening, speaking, startListening, stopListening, speak, stopSpeaking };
}
