"use client";

import { useState, FormEvent, useRef, ChangeEvent, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import {
  Paperclip,
  Mic,
  Square,
  X,
  Send,
  ArrowUp,
  History,
  Plus,
  Trash2,
  LogIn,
  LogOut,
  PlusCircle,
  MessageCirclePlus,
  Sun,
  Moon,
  Youtube,
} from "lucide-react";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import Lottie from "lottie-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useMockData } from "@/contexts/MockDataContext";
import HomePage from "@/components/HomePage";

// import { useTheme } from "../contexts/ThemeContext";
// import { useMockData } from "../contexts/MockDataContext";

// import HomePage from "../components/HomePage";

interface SearchData {
  id?: string;
  subject?: string;
  sender?: string;
  senderEmail?: string;
  messageTimestamp?: string;
  messageText?: string;
  preview?: {
    body: string;
  };
  [key: string]: unknown; // Allow additional properties
}

async function searchMockData(query: string): Promise<SearchData[]> {
  try {
    const response = await fetch("/mock_data.json");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    const lowerCaseQuery = query.toLowerCase();
    const queryKeywords = lowerCaseQuery.split(/\s+/).filter(Boolean);

    // Combine all data sources
    const allData = [
      ...(data.gmail || []),
      ...(data.outlook || []),
      ...(data.calendar || []),
      ...(data.xero || []),
      ...(data.quickbooks || []),
    ];

    if (queryKeywords.length === 0) {
      return [];
    }

    // Filter based on query keywords
    const filteredData = allData.filter((item) => {
      const stringifiedItem = JSON.stringify(item).toLowerCase();
      // If the query is long, it's likely natural language.
      // The LLM is supposed to extract keywords, but if it doesn't,
      // we'll be more lenient with the search.
      if (queryKeywords.length > 2) {
        // Check if any keyword matches. This is more lenient.
        return queryKeywords.some((keyword) =>
          stringifiedItem.includes(keyword)
        );
      }
      // For shorter queries, expect all keywords to be present.
      return queryKeywords.every((keyword) =>
        stringifiedItem.includes(keyword)
      );
    });

    return filteredData;
  } catch (error) {
    console.error("Failed to fetch or parse mock data:", error);
    return [];
  }
}

async function searchRealData(query: string): Promise<SearchData[]> {
  const url = "https://sales-mcp-be.azurewebsites.net/api/SIT/search";
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    query: query,
    maxResults: 10,
  });

  const requestOptions: RequestInit = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  try {
    console.log(`[DEBUG] Making request to: ${url}`);
    console.log(`[DEBUG] Request body:`, raw);
    const response = await fetch(url, requestOptions);

    console.log(`[DEBUG] Response status: ${response.status}`);
    console.log(`[DEBUG] Response headers:`, response.headers);

    if (!response.ok) {
      let errorMessage = `Network response was not ok: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.text();
        console.error("Backend error response:", errorBody);
        
        // Try to parse as JSON to get structured error
        const errorData = JSON.parse(errorBody);
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

    const responseText = await response.text();
    console.log(`[DEBUG] Raw response:`, responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      return [];
    }

    console.log(`[DEBUG] Parsed response:`, data);

    // Extract the messages array from the nested response structure
    if (data && data.result && data.result.data && data.result.data.messages) {
      return Array.isArray(data.result.data.messages)
        ? data.result.data.messages
        : [];
    }

    // Fallback: if the response is already an array (for backward compatibility)
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch from real backend:", error);
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      console.error(
        "This is likely a CORS issue. Check if the backend has CORS enabled for your frontend domain."
      );
    }
    return [];
  }
}

interface EmailData {
  id: string;
  subject: string;
  sender: string;
  senderEmail: string;
  messageTimestamp: string;
  messageText: string;
  preview?: {
    body: string;
  };
}

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  audioUrl?: string;
  fileType?: string;
  fileName?: string;
  imageBase64Preview?: string;
  imageBase64?: string;
  imageMimeType?: string;
  imageUrl?: string;
  isLoading?: boolean;
  thinking?: string;
  emails?: EmailData[];
  summary?: string | null;
  spokenSummary?: string | null;
}

interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date | null;
  updatedAt: Date | null;
}

// Loading Animation Component
const LoadingAnimation: React.FC = () => {
  const [animationData, setAnimationData] = useState<unknown>(null);

  useEffect(() => {
    // Dynamically import the JSON file
    fetch("/three-dot.json")
      .then((response) => response.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Failed to load animation:", err));
  }, []);

  if (!animationData) {
    return (
      <div className="flex items-center justify-center w-16 h-10">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-2 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-16 h-10">
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

// Add OpenAI integration
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";

async function extractQueryWithLLM(prompt: string): Promise<string> {
  console.log("[DEBUG] extractQueryWithLLM called with prompt:", prompt);
  if (!OPENAI_API_KEY) {
    console.warn("[DEBUG] No OpenAI API key found");
    return prompt;
  }
  const systemPrompt = `You are an expert sales assistant. Given a natural language query from a sales representative, extract the most relevant Gmail search keywords or phrases that would help a sales rep find important sales-related emails (e.g., leads, follow-ups, opportunities, pipeline, meetings, deals, prospects, etc). Only return the keywords or phrase, not any explanation. If the query is already suitable for Gmail search, return it as is. Always focus on sales context.`;
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 32,
        temperature: 0.2,
      }),
    });
    const data = await response.json();
    console.log("[DEBUG] OpenAI API response:", data);
    return data.choices?.[0]?.message?.content?.trim() || prompt;
  } catch (err) {
    console.error("[DEBUG] Error in extractQueryWithLLM:", err);
    return prompt;
  }
}

// Summarize data using OpenAI
async function summarizeDataWithLLM(
  query: string,
  data: SearchData[]
): Promise<string> {
  console.log("[DEBUG] summarizeDataWithLLM called with:", {
    query,
    dataLength: data.length,
    hasApiKey: !!OPENAI_API_KEY,
  });

  if (!OPENAI_API_KEY) {
    console.warn("[DEBUG] No OpenAI API key found, skipping summarization");
    return "";
  }

  if (!data || data.length === 0) {
    console.warn("[DEBUG] No data provided to summarize");
    return "No data provided to summarize.";
  }

  const systemPrompt = `You are an expert sales assistant AI. Your goal is to provide concise, actionable, and insightful summaries to a busy sales representative based on the data provided. The data can include emails, calendar events, and financial records from systems like Xero or QuickBooks.

When you receive a user's query and the relevant data, follow these principles:

1.  **Synthesize, Don't Just List:** Do not just list the data. Analyze and synthesize it. Connect the dots between different pieces of information if possible.
2.  **Sales-First Mindset:** Always interpret the data from a sales perspective. What does this mean for the sales rep? Focus on:
    *   **Opportunities:** Highlight potential deals, upsells, or new leads.
    *   **Risks:** Point out potential issues, like overdue invoices, unanswered emails, or unhappy clients.
    *   **Action Items:** Clearly state what the sales rep should do next.
    *   **Key Information:** Extract the most critical details like contact names, key dates, amounts, and commitments.
3.  **Contextual Summaries:** Tailor your response based on the type of query:
    *   **For Email Queries ("last email from X", "summary of thread with Y"):** Summarize the key points of the conversation, identify any unanswered questions, and suggest the next step.
    *   **For Calendar/Meeting Queries ("prep me for my meeting", "what's on my calendar"):** Provide a briefing for the meeting. Include who is attending, the purpose of the meeting, a summary of recent email conversations with the attendees, and any outstanding invoices or issues.
    *   **For Invoice/Payment Queries ("unpaid invoices for X", "payment history of Y"):** Give a clear financial summary. State the total amount due, list any overdue invoices with their due dates, and summarize recent payment history.
4.  **Clear & Concise Formatting:** Use markdown (like lists, bolding, and headings) to make your summary easy to scan. Start with a direct answer to the user's question, then provide supporting details.

**Example Persona:**
*   **User:** "Prep me for my meeting with BuildCorp tomorrow."
*   **You (with relevant data):**
    "**Meeting Prep: BuildCorp Tomorrow**

    You have a one-hour call with Mark Allen from BuildCorp tomorrow at 10:00 AM to discuss the Springfield Mall roofing proposal.

    *   **Attendees:** Mark Allen (BuildCorp), You
    *   **Latest Communication:** You last emailed Mark 3 days ago with the revised quote. He has not yet replied.
    *   **Action Item:** You should follow up on the revised quote during the call.
    *   **Financials:** BuildCorp has an outstanding invoice for $2,500 which is now 15 days overdue. This might be a point of leverage or a topic to address.

    Good luck with the meeting!"

Your response should be professional, direct, and incredibly helpful.`;

  const userContent = `User Query: "${query}"\n\nJSON Data:\n${JSON.stringify(
    data,
    null,
    2
  )}`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];

  try {
    console.log("[DEBUG] Making OpenAI API request...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    console.log("[DEBUG] OpenAI API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[DEBUG] OpenAI API error response:", errorText);
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json();
    console.log("[DEBUG] OpenAI API response data:", responseData);

    const summary = responseData.choices?.[0]?.message?.content?.trim() || "";
    console.log("[DEBUG] Generated summary:", summary);

    return summary;
  } catch (err) {
    console.error("[DEBUG] Error in summarizeDataWithLLM:", err);

    // If there's no API key, return empty string instead of error message
    if (!OPENAI_API_KEY) {
      return "";
    }

    // Return a more helpful error message based on the error type
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      return "Unable to generate summary due to network connectivity issues.";
    }

    return `Unable to generate summary: ${
      err instanceof Error ? err.message : "Unknown error"
    }`;
  }
}

// Convert AI summary to natural spoken style for sales reps
async function convertToSpokenStyle(summary: string): Promise<string> {
  console.log("[DEBUG] convertToSpokenStyle called with summary:", summary);

  if (!OPENAI_API_KEY) {
    console.warn("[DEBUG] No OpenAI API key found for spoken style conversion");
    return summary;
  }

  if (!summary || summary.trim() === "") {
    return "";
  }

  const systemPrompt = `You are a smart sales assistant speaking directly to a busy sales rep who is on the way to a client meeting. Your job is to turn raw sales data, meeting notes, or summaries into a short, natural-sounding spoken message. Use everyday language, stay under 200 words, and speak in the first person like you're giving them a quick heads-up. Be clear, confident, and helpful — like a teammate who's got their back. Avoid sounding robotic or too formal.`;

  const userContent = `Here's the sales update I need summarized into a natural, spoken-style audio script for a busy sales rep: ${summary}`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];

  try {
    console.log(
      "[DEBUG] Making OpenAI API request for spoken style conversion..."
    );
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    console.log(
      "[DEBUG] OpenAI API response status for spoken style:",
      response.status
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[DEBUG] OpenAI API error response for spoken style:",
        errorText
      );
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json();
    console.log(
      "[DEBUG] OpenAI API response data for spoken style:",
      responseData
    );

    const spokenSummary =
      responseData.choices?.[0]?.message?.content?.trim() || summary;
    console.log("[DEBUG] Generated spoken summary:", spokenSummary);

    return spokenSummary;
  } catch (err) {
    console.error("[DEBUG] Error in convertToSpokenStyle:", err);
    return summary; // Fallback to original summary
  }
}

export default function ChatPage() {
  const { theme, toggleTheme } = useTheme();
  const { useMockData: isMockEnabled, setUseMockData } = useMockData();

  const [inputValue, setInputValue] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [selectedModel, setSelectedModel] = useState<string>("gpt-4o-mini");
  const [isModelDropdownOpen, setIsModelDropdownOpen] =
    useState<boolean>(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatThread[]>([]);

  const [useLLM, setUseLLM] = useState(false);
  const [isHomePage, setIsHomePage] = useState(true);

  // Mock model options
  const modelOptions = [
    { value: "gpt-4o-mini", label: "GPT-4o mini" },
    { value: "claude-3-haiku", label: "Claude 3 Haiku" },
    { value: "gemini-pro", label: "Gemini Pro" },
    { value: "llama-3", label: "Llama 3" },
  ];

  const currentModelLabel =
    modelOptions.find((option) => option.value === selectedModel)?.label ||
    selectedModel;

  // Mock chat functionality
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() && !selectedFile && !audioBlob) return;

    setError(null);
    const currentInput = inputValue.trim();

    // Switch to chat mode when user sends first message
    if (isHomePage) {
      setIsHomePage(false);
    }

    // Create user message
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: currentInput,
    };

    // Add loading message
    const loadingMessage: Message = {
      id: `${Date.now()}-ai`,
      role: "ai",
      content: "",
      isLoading: true,
    };
    setMessages((prev) => [...prev, userMessage, loadingMessage]);

    // Clear inputs
    setInputValue("");
    setSelectedFile(null);
    setAudioBlob(null);
    setAudioUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setIsLoading(true);

    try {
      console.log(
        `[DEBUG] Submitting query. Mock data enabled: ${isMockEnabled}`
      );
      let queryToSend = currentInput;
      if (isMockEnabled) {
        queryToSend = await extractQueryWithLLM(currentInput);
        console.log("[DEBUG] Query after LLM extraction:", queryToSend);
      }
      // Real backend call
      const response = isMockEnabled
        ? await searchMockData(queryToSend)
        : await searchRealData(queryToSend);

      let aiContent = "";
      let responseData: any[] = [];
      let summary: string | null = null;

      if (response.length === 0) {
        aiContent = "No emails found for your query.";
      } else {
        aiContent = `Found ${response.length} data point${
          response.length !== 1 ? "s" : ""
        } matching your search.`;
        responseData = response; // Assume backend returns a versatile list

        // Summarize the data
        if (responseData.length > 0) {
          summary = await summarizeDataWithLLM(currentInput, responseData);

          // Convert to spoken style if summary exists
          let spokenSummary: string | null = null;
          if (summary) {
            spokenSummary = await convertToSpokenStyle(summary);
          }

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === loadingMessage.id
                ? {
                    ...loadingMessage,
                    isLoading: false,
                    content: aiContent,
                    emails: responseData, // Store the full response data
                    summary: summary,
                    spokenSummary: spokenSummary,
                  }
                : msg
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === loadingMessage.id
                ? {
                    ...loadingMessage,
                    isLoading: false,
                    content: aiContent,
                    emails: responseData, // Store the full response data
                    summary: summary,
                    spokenSummary: null,
                  }
                : msg
            )
          );
        }
      }
    } catch (err: any) {
      console.error("[DEBUG] Error in handleSubmit:", err);
      
      // Check for specific errors and provide user-friendly messages
      const errorMessage = err.message || "An error occurred while fetching the response.";
      
      if (errorMessage.includes("credit balance is too low") || errorMessage.includes("Anthropic API")) {
        setError("Your credit balance is too low to access the AI model. Please add more credits to your account to continue using the service.");
      } else if (errorMessage.includes("Search failed") || errorMessage.includes("HTTP error") || errorMessage.includes("Network response was not ok")) {
        setError("We're experiencing technical difficulties with our AI service. Please try again in a few moments.");
      } else {
        setError("Something went wrong while processing your request. Please try again or contact support if the issue persists.");
      }
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? {
                ...loadingMessage,
                isLoading: false,
                content: `Error: ${err.message || "Something went wrong."}`,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const isAudio = file.type.startsWith("audio/");
      const isImage = file.type.startsWith("image/");

      if (!isAudio && !isImage) {
        setError(
          `Unsupported file type: ${file.type}. Please upload an audio or image file.`
        );
        return;
      }

      setSelectedFile(file);
      setAudioUrl(null);

      console.log(`File selected: ${file.name} (${file.type})`);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setInputValue("");
    setSelectedFile(null);
    setAudioUrl(null);
    setError(null);
    setIsHomePage(true);
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
    setIsHomePage(false);
    // Auto-submit the prompt
    setTimeout(() => {
      handleHomePageSubmit(prompt);
    }, 100);
  };

  const handleHomePageSubmit = async (input: string) => {
    setIsHomePage(false);

    if (!input.trim()) return;

    setError(null);

    // Create user message
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: input,
    };

    // Add loading message
    const loadingMessage: Message = {
      id: `${Date.now()}-ai`,
      role: "ai",
      content: "",
      isLoading: true,
    };
    setMessages((prev) => [...prev, userMessage, loadingMessage]);

    // Clear inputs
    setInputValue("");
    setSelectedFile(null);
    setAudioBlob(null);
    setAudioUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setIsLoading(true);

    try {
      console.log(
        `[DEBUG] Submitting query from homepage. Mock data enabled: ${isMockEnabled}`
      );
      let queryToSend = input;
      if (isMockEnabled) {
        queryToSend = await extractQueryWithLLM(input);
        console.log("[DEBUG] Query after LLM extraction:", queryToSend);
      }
      // Real backend call
      const response = isMockEnabled
        ? await searchMockData(queryToSend)
        : await searchRealData(queryToSend);

      let aiContent = "";
      let responseData: any[] = [];
      let summary: string | null = null;

      if (response.length === 0) {
        aiContent = "No emails found for your query.";
      } else {
        aiContent = `Found ${response.length} data point${
          response.length !== 1 ? "s" : ""
        } matching your search.`;
        responseData = response; // Assume backend returns a versatile list

        // Summarize the data
        if (responseData.length > 0) {
          summary = await summarizeDataWithLLM(input, responseData);

          // Convert to spoken style if summary exists
          let spokenSummary: string | null = null;
          if (summary) {
            spokenSummary = await convertToSpokenStyle(summary);
          }

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === loadingMessage.id
                ? {
                    ...loadingMessage,
                    isLoading: false,
                    content: aiContent,
                    emails: responseData, // Store the full response data
                    summary: summary,
                    spokenSummary: spokenSummary,
                  }
                : msg
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === loadingMessage.id
                ? {
                    ...loadingMessage,
                    isLoading: false,
                    content: aiContent,
                    emails: responseData, // Store the full response data
                    summary: summary,
                    spokenSummary: null,
                  }
                : msg
            )
          );
        }
      }
    } catch (err: any) {
      console.error("[DEBUG] Error in handleHomePageSubmit:", err);
      
      // Check for specific errors and provide user-friendly messages
      const errorMessage = err.message || "An error occurred while fetching the response.";
      
      if (errorMessage.includes("credit balance is too low") || errorMessage.includes("Anthropic API")) {
        setError("Your credit balance is too low to access the AI model. Please add more credits to your account to continue using the service.");
      } else if (errorMessage.includes("Search failed") || errorMessage.includes("HTTP error") || errorMessage.includes("Network response was not ok")) {
        setError("We're experiencing technical difficulties with our AI service. Please try again in a few moments.");
      } else {
        setError("Something went wrong while processing your request. Please try again or contact support if the issue persists.");
      }
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? {
                ...loadingMessage,
                isLoading: false,
                content: `Error: ${err.message || "Something went wrong."}`,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHistory = () => {
    setIsHistoryModalOpen(!isHistoryModalOpen);
  };

  // Effect to adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      const ta = textareaRef.current;
      ta.style.height = "auto";

      requestAnimationFrame(() => {
        if (!textareaRef.current) return;

        const computedStyle = getComputedStyle(ta);
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
        let lineHeight = parseFloat(computedStyle.lineHeight);

        if (isNaN(lineHeight) || lineHeight <= 0) {
          const fontSize = parseFloat(computedStyle.fontSize);
          lineHeight = !isNaN(fontSize) && fontSize > 0 ? fontSize * 1.5 : 24;
        }
        lineHeight = Math.max(1, lineHeight);

        const oneLinePixelHeightWithPadding =
          lineHeight + paddingTop + paddingBottom;
        const fourLinesPixelHeightWithPadding =
          lineHeight * 4 + paddingTop + paddingBottom;
        const currentScrollHeight = ta.scrollHeight;

        if (ta.value === "") {
          ta.style.height = `${oneLinePixelHeightWithPadding}px`;
        } else {
          let targetPixelHeight = currentScrollHeight;
          targetPixelHeight = Math.min(
            targetPixelHeight,
            fourLinesPixelHeightWithPadding
          );
          targetPixelHeight = Math.max(
            targetPixelHeight,
            oneLinePixelHeightWithPadding
          );
          ta.style.height = `${targetPixelHeight}px`;
        }
      });
    }
  }, [inputValue]);

  return (
    <div className="w-full bg-gray-50 dark:bg-[#161616] fixed inset-0 flex flex-col">
      {/* Header */}
      <header className="w-full bg-gray-50 dark:bg-[#161616] pt-3 pb-3 sm:pt-4 sm:pb-4 z-10 flex-shrink-0 border-b border-gray-200 dark:border-transparent">
        <div className="w-full flex items-center justify-between px-4">
          <div className="w-1/3 flex justify-start items-center gap-1 sm:gap-2">
            <button
              onClick={handleNewChat}
              className="p-2 rounded-full icon-button"
              title="New Chat"
              aria-label="New Chat"
            >
              <MessageCirclePlus
                className="w-5 h-5 sm:w-6 sm:w-6 text-gray-700 dark:text-[#C8C8C8]"
                style={{ transform: "scaleX(-1)" }}
              />
            </button>
            <button
              onClick={toggleHistory}
              className="p-2 rounded-full icon-button"
              title="Chat History"
              aria-label="Chat History"
            >
              <History className="w-5 h-5 sm:w-6 sm:w-6 text-gray-700 dark:text-[#C8C8C8]" />
            </button>
          </div>

          <div className="flex-grow text-center">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-[#F9FAFB]">
              Sales Intelligence Tool
            </h1>
            <a
              href="/simple-summary"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
            >
              Simple Summary Tool
            </a>
          </div>

          <div className="w-1/3 flex justify-end items-center gap-1 sm:gap-2">
            <label className="flex items-center gap-1 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={isMockEnabled}
                onChange={(e) => setUseMockData(e.target.checked)}
              />
              Use Mock Data
            </label>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full icon-button"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5 sm:w-6 sm:w-6 text-gray-700 dark:text-[#C8C8C8]" />
              ) : (
                <Sun className="w-5 h-5 sm:w-6 sm:w-6 text-gray-700 dark:text-[#C8C8C8]" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`${
          isHomePage ? "w-full" : "max-w-3xl mx-auto w-full"
        } flex flex-col h-full relative`}
      >
        {/* Main content */}
        <main
          ref={chatContainerRef}
          className={`relative flex-grow overflow-y-auto min-h-0 chat-container dark:bg-[#161616] ${
            !isHomePage ? "pb-4" : ""
          }`}
          style={{ overflowX: "hidden", overscrollBehaviorY: "contain" }}
        >
          {isHomePage && messages.length === 0 ? (
            <HomePage
              onPromptClick={handlePromptClick}
              onSubmit={handleHomePageSubmit}
              inputValue={inputValue}
              setInputValue={setInputValue}
              isLoading={isLoading}
            />
          ) : (
            <>
              <div className="sticky top-0 left-0 right-0 h-16 bg-gradient-to-b from-gray-50 dark:from-[#161616] to-transparent pointer-events-none z-5"></div>

              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`${
                        msg.role === "user"
                          ? "max-w-[80%] px-3 py-2 sm:px-4 sm:py-2 dark:bg-[#292929] text-gray-800 dark:text-[#F9FAFB] user-bubble"
                          : "w-full bg-transparent dark:bg-transparent text-gray-800 dark:text-[#F9FAFB]"
                      } `}
                      style={
                        msg.role === "user"
                          ? {
                              borderTopLeftRadius: "24px",
                              borderTopRightRadius: "24px",
                              borderBottomLeftRadius: "24px",
                              borderBottomRightRadius: "8px",
                              backgroundColor: "var(--bubble-user)",
                            }
                          : undefined
                      }
                    >
                      {msg.role === "ai" ? (
                        <>
                          {msg.isLoading ? (
                            <LoadingAnimation />
                          ) : (
                            <div className="w-full">
                              {msg.content && (
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[
                                    rehypeRaw,
                                    rehypeSanitize,
                                    rehypeHighlight,
                                  ]}
                                  components={{
                                    p: ({ node, ...props }) => (
                                      <p
                                        className="my-3 text-gray-800 dark:text-[#F9FAFB] overflow-wrap-break-word"
                                        {...props}
                                      />
                                    ),
                                    code: (props: any) => {
                                      const { className, children, ...rest } =
                                        props;
                                      const isInline =
                                        "inline" in props
                                          ? props.inline
                                          : false;
                                      if (isInline) {
                                        return (
                                          <code
                                            className="px-1 py-0.5 bg-gray-200 dark:bg-[#1E1E1E] text-pink-600 dark:text-pink-400 rounded text-sm font-mono overflow-wrap-break-word"
                                            {...rest}
                                          >
                                            {children}
                                          </code>
                                        );
                                      }
                                      return (
                                        <code
                                          className={`${className} overflow-wrap-break-word`}
                                          {...rest}
                                        >
                                          {children}
                                        </code>
                                      );
                                    },
                                  }}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              )}
                              {/* Show spoken summary if present */}
                              {msg.spokenSummary && (
                                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                                      Quick Sales Update
                                    </h4>
                                  </div>
                                  <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                                    {msg.spokenSummary}
                                  </p>
                                </div>
                              )}

                              {/* Show detailed summary if present */}
                              {msg.summary && (
                                <div className="mt-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                      Detailed Analysis
                                    </h4>
                                  </div>
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[
                                      rehypeRaw,
                                      rehypeSanitize,
                                      rehypeHighlight,
                                    ]}
                                    components={{
                                      p: ({ node, ...props }) => (
                                        <p
                                          className="my-3 text-gray-800 dark:text-[#F9FAFB] overflow-wrap-break-word"
                                          {...props}
                                        />
                                      ),
                                      code: (props: any) => {
                                        const { className, children, ...rest } =
                                          props;
                                        const isInline =
                                          "inline" in props
                                            ? props.inline
                                            : false;
                                        if (isInline) {
                                          return (
                                            <code
                                              className="px-1 py-0.5 bg-gray-200 dark:bg-[#1E1E1E] text-pink-600 dark:text-pink-400 rounded text-sm font-mono overflow-wrap-break-word"
                                              {...rest}
                                            >
                                              {children}
                                            </code>
                                          );
                                        }
                                        return (
                                          <code
                                            className={`${className} overflow-wrap-break-word`}
                                            {...rest}
                                          >
                                            {children}
                                          </code>
                                        );
                                      },
                                    }}
                                  >
                                    {msg.summary}
                                  </ReactMarkdown>
                                </div>
                              )}
                              {/* Hide cards if summary is present */}
                              {msg.emails &&
                                msg.emails.length > 0 &&
                                !msg.summary && (
                                  <div className="mt-4 space-y-4">
                                    {/* Cards are removed as per user request for summarized response */}
                                  </div>
                                )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full dark:text-[#F9FAFB]">
                          {msg.content}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} style={{ height: "1px" }} />
              </div>
            </>
          )}
        </main>

        {error && (
          <div className="p-4 bg-gray-50 dark:bg-[#161616] border-t border-gray-200 dark:border-transparent">
            <div className="max-w-4xl mx-auto">
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
          </div>
        )}

        {/* Footer - Hidden on homepage */}
        {!isHomePage && (
          <footer className="p-3 bg-gray-50 dark:bg-[#161616] flex-shrink-0 border-t border-gray-200 dark:border-transparent sticky bottom-0">
            <form onSubmit={handleSubmit} className="flex flex-col gap-0">
              <div
                className={`
                p-3 
                flex flex-col gap-2 
                bg-gray-100 dark:bg-[#1E1E1E]
                shadow-sm 
                border border-gray-200 dark:border-[#2F2F2E]
              `}
                style={{ borderRadius: "32px" }}
              >
                <div className="flex items-start gap-2">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask me anything about your sales pipeline, leads, or need help with emails..."
                    disabled={isLoading}
                    className="flex-grow bg-transparent focus:outline-none text-gray-900 dark:text-[#F9FAFB] text-base placeholder-gray-500 dark:placeholder-[#A6A6A6] resize-none overflow-y-auto pr-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (e.currentTarget.form) {
                          e.currentTarget.form.requestSubmit();
                        }
                      }
                    }}
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-2">
                    <div className="relative" ref={modelDropdownRef}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setIsModelDropdownOpen(!isModelDropdownOpen);
                        }}
                        disabled={isLoading}
                        className={`flex items-center justify-between border text-xs cursor-pointer py-1.5 pl-2 pr-1.5 model-dropdown-toggle bg-gray-100 hover:bg-gray-200 dark:bg-[#1E1E1E] dark:hover:bg-gray-700 border-gray-300 dark:border-[#2F2F2E] text-gray-700 dark:text-[#C8C8C8]`}
                        style={{ borderRadius: "12px", width: "140px" }}
                        title={"Select AI Model"}
                      >
                        <span className="truncate">{currentModelLabel}</span>
                        <svg
                          className={`ml-1 h-3 w-3 transform transition-transform ${
                            isModelDropdownOpen ? "rotate-180" : ""
                          }`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      {isModelDropdownOpen && (
                        <div
                          className="absolute left-0 bottom-full mb-1 w-full border shadow-sm z-20 overflow-hidden model-dropdown visible bg-white dark:bg-[#1E1E1E]"
                          style={{ borderRadius: "12px" }}
                        >
                          <div className="max-h-56 overflow-y-auto py-1">
                            {modelOptions.map((option) => (
                              <button
                                key={option.value}
                                className={`w-full text-left px-3 py-2 text-xs focus:outline-none transition-colors model-dropdown-item ${
                                  selectedModel === option.value
                                    ? "bg-gray-100 dark:bg-gray-700"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-600"
                                } text-gray-900 dark:text-white`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedModel(option.value);
                                  setIsModelDropdownOpen(false);
                                  setError(null);
                                }}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,audio/*"
                      style={{ display: "none" }}
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="p-2 text-gray-600 dark:text-[#C8C8C8] hover:text-gray-800 dark:hover:text-white transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-[#292929]"
                      title="Attach file"
                      aria-label="Attach file"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>

                    <button
                      type="submit"
                      disabled={
                        isLoading ||
                        (!inputValue.trim() && !selectedFile && !audioBlob)
                      }
                      className={`p-2 rounded-full transition-all duration-200 send-button ${
                        (inputValue.trim() || selectedFile || audioBlob) &&
                        !isLoading
                          ? "bg-neutral-800 dark:bg-white text-white dark:text-black hover:bg-neutral-900 dark:hover:bg-gray-200"
                          : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      }`}
                      title="Send message"
                      aria-label="Send message"
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </footer>
        )}
      </div>

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsHistoryModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-[#F9FAFB]">
                Chat History
              </h2>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="text-center text-gray-500 dark:text-[#A6A6A6] py-8">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No chat history available.</p>
              <p className="text-sm mt-1">
                Start a conversation to see your chats here.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
