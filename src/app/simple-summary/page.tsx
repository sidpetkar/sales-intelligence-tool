"use client";

import { useState, FormEvent, useRef } from "react";
import { ArrowUp, Mic, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";

interface SummaryResponse {
  success: boolean;
  message: string;
  query: string;
  userEmail: string;
  approach: string;
  cacheStatus: {
    hasCache: boolean;
    expiresAt: string | null;
    timeRemaining: number;
  };
  summary: string;
  msg: unknown;
}

export default function SimpleSummaryPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [spokenSummary, setSpokenSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const textToSpeech = async (text: string): Promise<Buffer> => {
    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "tts-1-hd",
          voice: "alloy",
          input: text,
          response_format: "mp3",
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS API error: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return buffer;
    } catch (error) {
      console.error("OpenAI TTS API error:", error);
      throw new Error("Failed to convert text to speech");
    }
  };

  const playAudio = async (text: string) => {
    try {
      setIsAudioPlaying(true);
      const audioBuffer = await textToSpeech(text);

      // Convert buffer to blob and create URL
      const blob = new Blob([audioBuffer], { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);

      // Auto-play the audio
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch((error) => {
          console.error("Auto-play failed:", error);
          setIsAudioPlaying(false);
        });
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsAudioPlaying(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAudioPlaying(false);
  };

  const convertToSpokenStyle = async (summary: string): Promise<string> => {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are a smart sales assistant speaking directly to a busy sales rep who is on the way to a client meeting. Your job is to turn raw sales data, meeting notes, or summaries into a short, natural-sounding spoken message. Use everyday language, stay under 200 words, and speak in the first person like you're giving them a quick heads-up. Be clear, confident, and helpful — like a teammate who's got their back. Avoid sounding robotic or too formal.",
              },
              {
                role: "user",
                content: `Here's the sales update I need summarized into a natural, spoken-style audio script for a busy sales rep: ${summary}`,
              },
            ],
            max_tokens: 300,
            temperature: 0.7,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return (
        data.choices[0]?.message?.content || "Unable to generate spoken summary"
      );
    } catch (error) {
      console.error("Error converting to spoken style:", error);
      return "Unable to generate spoken summary due to an error";
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setSummary(null);
    setSpokenSummary(null);
    stopAudio(); // Stop any currently playing audio

    try {
      const response = await fetch(
        "https://sales-mcp-be.azurewebsites.net/api/SIT/search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: query,
            maxResults: 10,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SummaryResponse = await response.json();
      setSummary(data);
console.log("data L165",data)
      // Generate spoken summary
      if (data.summary) {
        const spoken = await convertToSpokenStyle(data.summary);
        setSpokenSummary(spoken);

        // Auto-play the spoken summary
        await playAudio(spoken);
      }
    } catch (err) {
      console.error("Error fetching summary:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#161616] flex flex-col">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsAudioPlaying(false)}
        onError={() => setIsAudioPlaying(false)}
      />

      {/* Header */}
      <header className="w-full bg-white dark:bg-[#1E1E1E] shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Simple Summary Tool
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Enter your query to get an AI-powered summary with audio
          </p>
          <Link
            href="/"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
          >
            ← Back to Main Chat
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="query"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Query
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your query (e.g., 'My last email', 'Show me recent leads')"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-[#292929] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                isLoading || !query.trim()
                  ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Getting Summary...
                </>
              ) : (
                <>
                  <ArrowUp className="w-4 h-4" />
                  Get Summary
                </>
              )}
            </button>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm">
                Error: {error}
              </p>
            </div>
          )}

          {/* Summary Display */}
          {summary && (
            <div className="mt-8 space-y-6">
              {/* Spoken Summary */}
              {spokenSummary && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Mic className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                        Quick Sales Update
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAudioPlaying ? (
                        <button
                          onClick={stopAudio}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <VolumeX className="w-4 h-4" />
                          Stop
                        </button>
                      ) : (
                        <button
                          onClick={() => playAudio(spokenSummary)}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        >
                          <Volume2 className="w-4 h-4" />
                          Play
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
                    {spokenSummary}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
