import React, { useState, useEffect } from "react";

export default function TypingText({ lines = [], onComplete }) {
  const [displayText, setDisplayText] = useState("");
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (lineIndex >= lines.length) {
      if (onComplete) onComplete();
      return;
    }

    const interval = setInterval(() => {
      setDisplayText((prev) => prev + lines[lineIndex][charIndex]);
      setCharIndex((prev) => prev + 1);
    }, 50);

    if (charIndex >= lines[lineIndex].length) {
      clearInterval(interval);
      setDisplayText((prev) => prev + "\n");
      setLineIndex((prev) => prev + 1);
      setCharIndex(0);
    }

    return () => clearInterval(interval);
  }, [charIndex, lineIndex, lines, onComplete]);

  return (
    <h2 style={{ whiteSpace: "pre-wrap" }}>
      {displayText}
      <span>|</span>
    </h2>
  );
}
