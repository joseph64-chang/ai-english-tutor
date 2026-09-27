"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { openAIKeyHeaders } from "@/lib/byok";

// 一次最多錄這麼久，時間到自動停止並送去辨識
export const MAX_RECORDING_SECONDS = 60;

type RecorderStatus = "idle" | "recording" | "transcribing";

// 用瀏覽器 MediaRecorder 錄一段話，錄完上傳到 /api/transcribe 轉成文字
export function useVoiceRecorder({
  onText,
  onError,
  getContext,
}: {
  onText: (text: string) => void;
  onError: (message: string) => void;
  getContext?: () => string | undefined; // AI 上一句，幫助辨識
}) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  // 最新的 callback 放 ref，錄音途中父元件重新渲染也不會拿到舊的
  const callbacks = useRef({ onText, onError, getContext });
  useEffect(() => {
    callbacks.current = { onText, onError, getContext };
  });

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop()); // 關掉麥克風指示燈
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const upload = useCallback(async (blob: Blob) => {
    setStatus("transcribing");
    try {
      const form = new FormData();
      form.append("audio", blob, "speech");
      const context = callbacks.current.getContext?.();
      if (context) form.append("context", context);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: openAIKeyHeaders(),
        body: form,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "語音辨識失敗，請再試一次");
      callbacks.current.onText(data.text);
    } catch (err) {
      callbacks.current.onError(
        err instanceof Error ? err.message : "語音辨識失敗，請再試一次",
      );
    } finally {
      setStatus("idle");
    }
  }, []);

  const start = useCallback(async () => {
    if (status !== "idle") return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      callbacks.current.onError("這個瀏覽器不支援錄音，請改用 Chrome、Edge 或 Safari");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const denied = err instanceof DOMException && err.name === "NotAllowedError";
      callbacks.current.onError(
        denied
          ? "沒有麥克風權限，請在瀏覽器網址列旁邊允許使用麥克風"
          : "找不到可以用的麥克風",
      );
      return;
    }

    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType || chunks[0]?.type || "audio/webm";
      cleanup();
      if (cancelledRef.current || chunks.length === 0) {
        setStatus("idle");
        return;
      }
      upload(new Blob(chunks, { type }));
    };

    streamRef.current = stream;
    recorderRef.current = recorder;
    cancelledRef.current = false;
    recorder.start();
    setSeconds(0);
    setStatus("recording");

    const startedAt = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(elapsed);
      if (elapsed >= MAX_RECORDING_SECONDS && recorder.state === "recording") {
        recorder.stop();
      }
    }, 250);
  }, [status, cleanup, upload]);

  // 說完了：停止錄音並送去辨識
  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  // 取消：丟掉這段錄音
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  return { status, seconds, start, stop, cancel };
}
