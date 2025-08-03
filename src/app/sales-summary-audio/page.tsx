"use client";

import { useState, FormEvent, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowUp, Mic, Volume2, VolumeX, Sun, Moon } from "lucide-react";

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
  const { theme, toggleTheme } = useTheme();
  const audioRef = useRef<HTMLAudioElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);



  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

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
        // Try to read the error response body for more details
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If we can't parse the error response, use the default message
        }
        throw new Error(errorMessage);
      }

      const data: SummaryResponse = await response.json();
      setSummary(data);
      console.log("data L165", data);

      // Generate spoken summary
      if (data.summary) {
        const spoken = await convertToSpokenStyle(data.summary);
        setSpokenSummary(spoken);

        // Auto-play the spoken summary
        await playAudio(spoken);
      }
    } catch (err) {
      console.error("Error fetching summary:", err);
      
      // Check for specific errors and provide user-friendly messages
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      
      if (errorMessage.includes("credit balance is too low") || errorMessage.includes("Anthropic API")) {
        setError("Your credit balance is too low to access the AI model. Please add more credits to your account to continue using the service.");
      } else if (errorMessage.includes("Search failed") || errorMessage.includes("HTTP error")) {
        setError("We're experiencing technical difficulties with our AI service. Please try again in a few moments.");
      } else {
        setError("Something went wrong while processing your request. Please try again or contact support if the issue persists.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${
        theme === "light" ? "bg-gray-50" : "bg-[#161616]"
      } flex flex-col`}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsAudioPlaying(false)}
        onError={() => setIsAudioPlaying(false)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full flex flex-col h-full relative">
        <div className="flex-grow flex flex-col items-center justify-center px-4 py-8">
          {/* Theme Toggle - Top Right */}
          <div className="absolute top-4 right-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${
                theme === "light" ? "hover:bg-gray-200" : "hover:bg-gray-700"
              }`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5 sm:w-6 sm:w-6 text-gray-700" />
              ) : (
                <Sun className="w-5 h-5 sm:w-6 sm:w-6 text-gray-300" />
              )}
            </button>
          </div>

          {/* Logo and Title Section */}
          <div className="text-center mb-16">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <img
                src="/assets/logo.svg"
                alt="Sales Intelligence Tool Logo"
                className="w-16 h-16"
              />
            </div>

            {/* Title */}
            <h1
              className={`text-3xl font-normal mb-4 ${
                theme === "light" ? "text-gray-900" : "text-gray-100"
              }`}
            >
              Welcome to Sales Intelligence
            </h1>

            {/* Subtitle */}
            <p
              className={`text-lg max-w-md mx-auto ${
                theme === "light" ? "text-gray-900" : "text-gray-200"
              }`}
            >
              Your intelligent sales assistant ready to help you close more
              deals
            </p>
          </div>

          {/* Input Section */}
          <div className="w-full max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Main Input Box */}
              <div
                className={`p-3 flex flex-col gap-2 ${
                  theme === "light" ? "bg-gray-100" : "bg-[#1E1E1E]"
                } shadow-sm border ${
                  theme === "light" ? "border-gray-200" : "border-[#2F2F2E]"
                }`}
                style={{ borderRadius: "32px" }}
              >
                <div className="flex items-start gap-2 p-2">
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      adjustTextareaHeight();
                    }}
                    placeholder="Ask me anything about your sales pipeline, leads, or need help with emails..."
                    disabled={isLoading}
                    rows={1}
                    className={`flex-grow bg-transparent focus:outline-none ${
                      theme === "light" ? "text-gray-900" : "text-gray-100"
                    } text-base ${
                      theme === "light"
                        ? "placeholder-gray-500"
                        : "placeholder-gray-400"
                    } resize-none overflow-hidden pr-2 min-h-[24px] max-h-32`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (e.currentTarget.form) {
                          e.currentTarget.form.requestSubmit();
                        }
                      }
                    }}
                    onInput={adjustTextareaHeight}
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-2">
                    {/* Suggested prompts */}
                    {/* <button
                      type="button"
                      onClick={() => setQuery("My last email")}
                      className={`px-3 py-1 text-xs rounded-full ${
                        theme === "light"
                          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      } transition-colors`}
                    >
                      My last email
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuery("Show me recent leads")}
                      className={`px-3 py-1 text-xs rounded-full ${
                        theme === "light"
                          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      } transition-colors`}
                    >
                      Recent leads
                    </button> */}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      query.trim() && !isLoading
                        ? theme === "light"
                          ? "bg-neutral-400 text-white hover:bg-neutral-500"
                          : "bg-white text-black hover:bg-gray-200"
                        : theme === "light"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gray-600 text-gray-500 cursor-not-allowed"
                    }`}
                    title="Send message"
                    aria-label="Send message"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <ArrowUp className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Error Display as Response */}
            {error && (
              <div className="mt-8 space-y-6">
                <div className={`${
                  theme === "light"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-blue-900/20 border-blue-800"
                } border rounded-lg p-6`}>
                  <div className="flex items-center gap-2 mb-4">
                    <svg className={`w-5 h-5 ${
                      theme === "light" ? "text-blue-600" : "text-blue-400"
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className={`text-lg font-semibold ${
                      theme === "light" ? "text-blue-800" : "text-blue-200"
                    }`}>
                      System Message
                    </h3>
                  </div>
                  <p className={`${
                    theme === "light" ? "text-blue-700" : "text-blue-300"
                  } leading-relaxed`}>
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Summary Display */}
            {summary && (
              <div className="mt-8 space-y-6">
                {/* Spoken Summary */}
                {spokenSummary && (
                  <div
                    className={`${
                      theme === "light"
                        ? "bg-blue-50 border-blue-200"
                        : "bg-blue-900/20 border-blue-800"
                    } border rounded-lg p-6`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Mic
                          className={`w-5 h-5 ${
                            theme === "light"
                              ? "text-blue-600"
                              : "text-blue-400"
                          }`}
                        />
                        <h3
                          className={`text-lg font-semibold ${
                            theme === "light"
                              ? "text-blue-800"
                              : "text-blue-200"
                          }`}
                        >
                          Quick Sales Update
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAudioPlaying ? (
                          <button
                            onClick={stopAudio}
                            className={`flex items-center gap-1 px-3 py-1 text-sm ${
                              theme === "light"
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "bg-red-900/30 text-red-300 hover:bg-red-900/50"
                            } rounded-md transition-colors`}
                          >
                            <VolumeX className="w-4 h-4" />
                            Stop
                          </button>
                        ) : (
                          <button
                            onClick={() => playAudio(spokenSummary)}
                            className={`flex items-center gap-1 px-3 py-1 text-sm ${
                              theme === "light"
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-green-900/30 text-green-300 hover:bg-green-900/50"
                            } rounded-md transition-colors`}
                          >
                            <Volume2 className="w-4 h-4" />
                            Play
                          </button>
                        )}
                      </div>
                    </div>
                    <p
                      className={`leading-relaxed ${
                        theme === "light" ? "text-blue-700" : "text-blue-300"
                      }`}
                    >
                      {spokenSummary}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
