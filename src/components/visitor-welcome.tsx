"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";

interface VisitorData {
  visitorName: string;
  checkInTime: string;
  visitCategory: string;
  teamMembers: string[];
  companyName: string;
}

const WelcomePage = () => {
  const [greeting, setGreeting] = useState("");
  const [mode, setMode] = useState<"auto" | "manual">("manual");
  const [visitor, setVisitor] = useState<VisitorData | null>(null);
  const [visitorList, setVisitorList] = useState<VisitorData[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorData | null>(
    null
  );
  const [error, setError] = useState("");
  const prevVisitorRef = useRef<VisitorData | null>(null);
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  const updateTimeAndGreeting = () => {
    const now = new Date();

    const gmt7Time = new Date(now.getTime() + 7 * 60 * 60 * 1000);

    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    };

    setCurrentDate(gmt7Time.toLocaleString("en-US", dateOptions));
    setCurrentTime(gmt7Time.toLocaleString("en-US", timeOptions));

    const hour = gmt7Time.getUTCHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  };

  useEffect(() => {
    updateTimeAndGreeting();
    const timer = setInterval(updateTimeAndGreeting, 1000);
    return () => clearInterval(timer);
  }, []);

  const speakVisitorInfo = useCallback((visitor: VisitorData | null) => {
    if (!visitor) return;
    window.speechSynthesis.cancel();
    if (
      !prevVisitorRef.current ||
      visitor.visitorName !== prevVisitorRef.current.visitorName
    ) {
      window.speechSynthesis.cancel();
      const speechText = `Selamat datang di ALVA Plant, ${visitor.visitorName}.`;
      const utterance = new SpeechSynthesisUtterance(speechText);
      const voices = window.speechSynthesis.getVoices();
      const indonesianVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("id") &&
          voice.name.toLowerCase().includes("female")
      );
      if (indonesianVoice) {
        utterance.voice = indonesianVoice;
      }
      utterance.lang = "id-ID";
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
      prevVisitorRef.current = visitor;
    }
  }, []);

  const fetchVisitorList = useCallback(async () => {
    try {
      const response = await fetch("/api/visits/list-welcome");
      const data = await response.json();
      setVisitorList(data.data || []);
      setError("");
    } catch (err) {
      setError("Failed to fetch visitor list");
      console.error("Error fetching visitors:", err);
    }
  }, []);

  useEffect(() => {
    if (mode === "auto") {
      const eventSource = new EventSource("/api/visits/welcome");
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setVisitor(data);
          speakVisitorInfo(data);
          setError("");
        } catch (err) {
          setError("Failed to parse visitor data");
          console.error("Error parsing visitor data:", err);
        }
      };
      eventSource.onerror = (err) => {
        setError("Failed to connect to visitor stream");
        console.error("SSE error:", err);
        eventSource.close();
      };
      return () => {
        eventSource.close();
      };
    } else {
      fetchVisitorList();
    }
  }, [mode, fetchVisitorList, speakVisitorInfo]);

  useEffect(() => {
    if (mode === "manual" && visitorList.length > 0) {
      const firstVisitor = visitorList[0];
      setSelectedVisitor(firstVisitor);
      speakVisitorInfo(firstVisitor);
    }
  }, [visitorList, mode, speakVisitorInfo]);

  const handleModeToggle = () => {
    setMode((prevMode) => (prevMode === "auto" ? "manual" : "auto"));
  };

  const handleVisitorSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVisitorName = event.target.value;
    const visitor =
      visitorList.find((v) => v.visitorName === selectedVisitorName) || null;
    speakVisitorInfo(visitor);
    setSelectedVisitor(visitor);
  };

  const displayVisitor = mode === "auto" ? visitor : selectedVisitor;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-50 dark:bg-gray-900 w-full ">
      <div className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8 sm:p-16 space-y-6 sm:space-y-8">
        <div className="flex justify-between items-center mt-6">
          <div className="w-1/2">
            {mode === "manual" && visitorList.length > 0 && (
              <select
                className="p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                value={selectedVisitor?.visitorName || ""}
                onChange={handleVisitorSelect}>
                {visitorList.map((visitor) => (
                  <option key={visitor.visitorName} value={visitor.visitorName}>
                    {visitor.visitorName}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center space-x-4 w-1/2 justify-end">
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              {mode === "manual" ? "Manual Mode" : "Automatic Mode"}
            </span>
            <label className="inline-flex relative items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={mode === "auto"}
                onChange={handleModeToggle}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-xl sm:text-2xl font-medium">
          {greeting}, Welcome to ALVA!
        </p>
        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white break-words">
          {displayVisitor?.visitorName || "No Visitor"}
        </h1>

        {displayVisitor?.teamMembers &&
          displayVisitor.teamMembers.length > 0 && (
            <div className="mt-4">
              <p className="text-gray-700 dark:text-gray-200 text-lg sm:text-xl font-medium mb-2">
                Team Members:
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-2">
                {displayVisitor.teamMembers.map((member, index) => (
                  <span
                    key={index}
                    className="px-4 sm:px-6 py-1 sm:py-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-full text-base sm:text-lg">
                    {member}
                  </span>
                ))}
              </div>
            </div>
          )}

        {displayVisitor?.companyName && (
          <p className="mt-4 text-lg sm:text-2xl text-gray-900 dark:text-gray-300">
            {displayVisitor.companyName}
          </p>
        )}

        <div className="pt-8 sm:pt-12 border-t border-gray-200 dark:border-gray-700 mt-8 sm:mt-12">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-28">
            <div className="space-y-2 sm:space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-xl sm:text-2xl">
                Current Date
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg sm:text-xl">
                {currentDate}
              </p>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-xl sm:text-2xl">
                Current Time
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg sm:text-xl">
                {currentTime}
              </p>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-xl sm:text-2xl">
                Visit Category
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg sm:text-xl">
                {displayVisitor?.visitCategory || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 sm:p-4 text-sm text-red-700 bg-red-100 rounded-xl max-w-4xl w-full">
          {error}
        </div>
      )}
    </div>
  );
};

export default WelcomePage;
