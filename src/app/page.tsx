"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUp,
  Mic,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Pause,
  Play,
} from "lucide-react";

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
  toolsUsed?: string[];
  msg: unknown;
}

export default function SimpleSummaryPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [formattedSummary, setFormattedSummary] = useState<string>("");
  const [spokenSummary, setSpokenSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [hasStoredAudio, setHasStoredAudio] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const audioRef = useRef<HTMLAudioElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cleanup audio URLs when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
      }
    };
  }, [currentAudioUrl]);

  // Update progress bar
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setAudioProgress((audio.currentTime / audio.duration) * 100);
    };

    const updateDuration = () => {
      setAudioDuration(audio.duration);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", () => {
      setIsAudioPlaying(false);
      setIsAudioPaused(false);
      setAudioProgress(0);
    });

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", () => {
        setIsAudioPlaying(false);
        setIsAudioPaused(false);
        setAudioProgress(0);
      });
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

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
      setIsAudioPaused(false);

      // If we have stored audio for this text, use it
      if (hasStoredAudio && currentAudioUrl) {
        if (audioRef.current) {
          audioRef.current.src = currentAudioUrl;
          audioRef.current.play().catch((error) => {
            console.error("Auto-play failed:", error);
            setIsAudioPlaying(false);
            setIsAudioPaused(false);
          });
        }
        return;
      }

      // Clean up previous audio URL
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
      }

      const audioBuffer = await textToSpeech(text);

      // Convert buffer to blob and create URL
      const blob = new Blob([audioBuffer], { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);
      setCurrentAudioUrl(url);
      setHasStoredAudio(true);

      // Play the audio
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch((error) => {
          console.error("Auto-play failed:", error);
          setIsAudioPlaying(false);
          setIsAudioPaused(false);
        });
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsAudioPlaying(false);
      setIsAudioPaused(false);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current && isAudioPlaying && !isAudioPaused) {
      audioRef.current.pause();
      setIsAudioPaused(true);
    }
  };

  const resumeAudio = () => {
    if (audioRef.current && isAudioPaused) {
      audioRef.current.play().catch((error) => {
        console.error("Resume failed:", error);
        setIsAudioPlaying(false);
        setIsAudioPaused(false);
      });
      setIsAudioPaused(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAudioPlaying(false);
    setIsAudioPaused(false);
    setAudioProgress(0);
  };

  const clearStoredAudio = () => {
    if (currentAudioUrl) {
      URL.revokeObjectURL(currentAudioUrl);
      setCurrentAudioUrl(null);
    }
    setHasStoredAudio(false);
    stopAudio();
  };

  const seekAudio = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioDuration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * audioDuration;

    audioRef.current.currentTime = newTime;
    setAudioProgress(percentage * 100);
  };

  const formatSummaryWithAI = async (summary: string): Promise<string> => {
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
                  "You are a professional sales content formatter. Format sales data, emails, and summaries into clean, simple numbered lists. For email conversations, structure as: '## Email Exchange' then number each email as '1. From [Sender] (Date & Time):' followed by the email content as simple paragraphs with line breaks. Keep the original email format with salutations, body content, closings, and signatures. For meetings, use '## Meeting Details' with simple numbered points. Do not use bullet points for email content - keep the natural email flow. Preserve all original content exactly as provided, including emojis and formatting.",
              },
              {
                role: "user",
                content: `Please format this sales summary with proper structure, headings, and bullet points while keeping all original content intact: ${summary}`,
              },
            ],
            max_tokens: 1500,
            temperature: 0.2,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || summary;
    } catch (error) {
      console.error("Error formatting summary:", error);
      return summary; // Return original if AI formatting fails
    }
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
    clearStoredAudio(); // Stop any currently playing audio and clear stored audio

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
      console.log("data L165", data);

      // Format summary with AI and generate spoken summary
      if (data.summary) {
        // Format the summary with AI
        const formatted = await formatSummaryWithAI(data.summary);
        setFormattedSummary(formatted);

        // Generate spoken summary
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
      <main className="flex-1  mx-auto w-full flex flex-col h-full relative">
        <div className="flex-grow flex flex-col items-center justify-center px-6 py-8">
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
                <Moon className="w-5 h-5  sm:w-6 text-gray-700" />
              ) : (
                <Sun className="w-5 h-5  sm:w-6 text-gray-300" />
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
                className="w-16 h-16 sm:w-20 sm:h-20"
              />
            </div>

            {/* Title */}
            <h1
              className={`text-2xl sm:text-3xl lg:text-4xl font-normal mb-4 ${
                theme === "light" ? "text-gray-900" : "text-gray-100"
              }`}
            >
              Welcome to Sales Intelligence
            </h1>

            {/* Subtitle */}
            <p
              className={`text-base sm:text-lg lg:text-xl max-w-md sm:max-w-lg lg:max-w-xl mx-auto ${
                theme === "light" ? "text-gray-900" : "text-gray-200"
              }`}
            >
              Your intelligent sales assistant ready to help you close more
              deals
            </p>
          </div>

          {/* Input Section */}
          <div className="w-full max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Main Input Box */}
              <div
                className={`p-3 sm:p-4 flex flex-col gap-2 ${
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

            {/* Error Display */}
            {error && (
              <div
                className={`mt-6 p-4 ${
                  theme === "light"
                    ? "bg-red-50 border-red-200"
                    : "bg-red-900/20 border-red-800"
                } border rounded-lg`}
              >
                <p
                  className={`text-sm ${
                    theme === "light" ? "text-red-700" : "text-red-300"
                  }`}
                >
                  Error: {error}
                </p>
              </div>
            )}

            {/* Summary Display */}
            {summary && (
              <div className="mt-8 space-y-6 w-full max-w-5xl">
                {/* Detailed Summary */}
                <div
                  className={`${
                    theme === "light"
                      ? "bg-white border-gray-200 shadow-sm"
                      : "bg-[#1E1E1E] border-[#2F2F2E]"
                  } border rounded-xl p-4 sm:p-6 lg:p-8`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        theme === "light"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-blue-900/30 text-blue-400"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-semibold ${
                          theme === "light" ? "text-gray-900" : "text-gray-100"
                        }`}
                      >
                        Sales Intelligence Summary
                      </h3>
                      <p
                        className={`text-sm ${
                          theme === "light" ? "text-gray-600" : "text-gray-400"
                        }`}
                      >
                        {summary.query}
                      </p>
                    </div>
                  </div>

                  {/* Summary Content */}
                  <div
                    className={`prose prose-sm max-w-none ${
                      theme === "light"
                        ? "prose-gray"
                        : "prose-invert prose-gray-300"
                    }`}
                  >
                    <div
                      className={`space-y-6 leading-relaxed ${
                        theme === "light" ? "text-gray-700" : "text-gray-300"
                      }`}
                    >
                      {formattedSummary ? (
                        <div
                          className={`prose prose-sm max-w-none ${
                            theme === "light"
                              ? "prose-gray"
                              : "prose-invert prose-gray-300"
                          }`}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h3: ({ children }) => (
                                <h3 className="text-xl font-bold mb-6 mt-8 text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600 pb-2">
                                  {children}
                                </h3>
                              ),
                              h4: ({ children }) => (
                                <h4 className="text-lg font-semibold mb-4 mt-6 text-gray-800 dark:text-gray-200">
                                  {children}
                                </h4>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-none space-y-4 mb-6">
                                  {children}
                                </ul>
                              ),
                              li: ({ children }) => (
                                <li className="mb-4 text-gray-700 dark:text-gray-300">
                                  {children}
                                </li>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-none space-y-4 mb-6">
                                  {children}
                                </ol>
                              ),
                              p: ({ children }) => (
                                <p className="mb-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {children}
                                </p>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-gray-900 dark:text-gray-100">
                                  {children}
                                </strong>
                              ),
                            }}
                          >
                            {formattedSummary}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        summary.summary
                          .split("\n\n")
                          .map((paragraph, index) => {
                            const trimmedParagraph = paragraph.trim();
                            if (!trimmedParagraph) return null;

                            // Check if this looks like a heading (short text, ends with colon, or all caps)
                            const isHeading =
                              trimmedParagraph.length < 100 &&
                              (trimmedParagraph.endsWith(":") ||
                                trimmedParagraph.split(" ").length <= 5 ||
                                trimmedParagraph ===
                                  trimmedParagraph.toUpperCase());

                            return (
                              <div key={index} className="relative">
                                {isHeading ? (
                                  <h4
                                    className={`text-lg font-semibold mb-3 ${
                                      theme === "light"
                                        ? "text-gray-900"
                                        : "text-gray-100"
                                    }`}
                                  >
                                    {trimmedParagraph}
                                  </h4>
                                ) : (
                                  <div
                                    className={`p-4 rounded-lg ${
                                      theme === "light"
                                        ? "bg-gray-50 border-l-4 border-blue-200"
                                        : "bg-gray-800/50 border-l-4 border-blue-600"
                                    }`}
                                  >
                                    <p className="text-base leading-7">
                                      {trimmedParagraph}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  {/* Tools Used */}
                  {summary.toolsUsed && summary.toolsUsed.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${
                            theme === "light"
                              ? "text-gray-700"
                              : "text-gray-300"
                          }`}
                        >
                          Data Sources:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {summary.toolsUsed.map((tool, index) => (
                            <span
                              key={index}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                theme === "light"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-blue-900/30 text-blue-300"
                              }`}
                            >
                              {tool.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Audio Summary */}
                {spokenSummary && (
                  <div
                    className={`${
                      theme === "light"
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                        : "bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-800"
                    } border rounded-xl p-4 sm:p-6 lg:p-8`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            theme === "light"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-blue-900/30 text-blue-400"
                          }`}
                        >
                          <Mic className="w-5 h-5" />
                        </div>
                        <div>
                          <h3
                            className={`text-lg font-semibold ${
                              theme === "light"
                                ? "text-blue-800"
                                : "text-blue-200"
                            }`}
                          >
                            Quick Audio Summary
                          </h3>
                          <p
                            className={`text-sm ${
                              theme === "light"
                                ? "text-blue-600"
                                : "text-blue-300"
                            }`}
                          >
                            Perfect for on-the-go listening
                          </p>
                        </div>
                      </div>

                      {/* Audio Controls */}
                      <div className="flex items-center gap-2">
                        {isAudioPlaying && !isAudioPaused ? (
                          <button
                            onClick={pauseAudio}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                              theme === "light"
                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 shadow-sm"
                                : "bg-yellow-900/30 text-yellow-300 hover:bg-yellow-900/50"
                            }`}
                          >
                            <Pause className="w-4 h-4" />
                            Pause
                          </button>
                        ) : isAudioPaused ? (
                          <button
                            onClick={resumeAudio}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                              theme === "light"
                                ? "bg-green-100 text-green-700 hover:bg-green-200 shadow-sm"
                                : "bg-green-900/30 text-green-300 hover:bg-green-900/50"
                            }`}
                          >
                            <Play className="w-4 h-4" />
                            Resume
                          </button>
                        ) : (
                          <button
                            onClick={() => playAudio(spokenSummary)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                              theme === "light"
                                ? "bg-green-100 text-green-700 hover:bg-green-200 shadow-sm"
                                : "bg-green-900/30 text-green-300 hover:bg-green-900/50"
                            }`}
                          >
                            <Volume2 className="w-4 h-4" />
                            Play Audio
                          </button>
                        )}

                        {(isAudioPlaying || isAudioPaused) && (
                          <button
                            onClick={stopAudio}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                              theme === "light"
                                ? "bg-red-100 text-red-700 hover:bg-red-200 shadow-sm"
                                : "bg-red-900/30 text-red-300 hover:bg-red-900/50"
                            }`}
                          >
                            <VolumeX className="w-4 h-4" />
                            Stop
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Audio Content */}
                    <div
                      className={`p-4 rounded-lg ${
                        theme === "light"
                          ? "bg-white/50 border border-blue-100"
                          : "bg-black/20 border border-blue-800/30"
                      }`}
                    >
                      <p
                        className={`leading-relaxed italic ${
                          theme === "light" ? "text-blue-700" : "text-blue-300"
                        }`}
                      >
                        &ldquo;{spokenSummary}&rdquo;
                      </p>
                    </div>

                    {/* Audio Progress Bar */}
                    {(isAudioPlaying || isAudioPaused) && (
                      <div className="mt-4">
                        <div
                          className={`w-full h-3 rounded-full cursor-pointer ${
                            theme === "light" ? "bg-gray-200" : "bg-gray-700"
                          } overflow-hidden`}
                          onClick={seekAudio}
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-100 ${
                              theme === "light"
                                ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                                : "bg-gradient-to-r from-blue-400 to-indigo-400"
                            }`}
                            style={{ width: `${audioProgress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-2">
                          <span
                            className={`font-medium ${
                              theme === "light"
                                ? "text-gray-600"
                                : "text-gray-400"
                            }`}
                          >
                            {audioRef.current
                              ? Math.floor(audioRef.current.currentTime || 0)
                              : 0}
                            s
                          </span>
                          <span
                            className={`font-medium ${
                              theme === "light"
                                ? "text-gray-600"
                                : "text-gray-400"
                            }`}
                          >
                            {Math.floor(audioDuration || 0)}s
                          </span>
                        </div>
                      </div>
                    )}
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
