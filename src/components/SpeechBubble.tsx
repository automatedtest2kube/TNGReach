import { useEffect, useState } from "react";

interface Props {
  text: string;
  className?: string;
}

export function SpeechBubble({ text, className = "" }: Props) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [text]);

  return (
    <div
      key={text}
      className={`animate-bubble-in relative max-w-xs rounded-3xl rounded-bl-md bg-bubble px-5 py-3.5 text-bubble-foreground shadow-[0_10px_30px_-12px_rgba(99,72,200,0.4)] ring-1 ring-brand-purple/10 ${className}`}
    >
      <p className="text-[15px] font-medium leading-snug">
        {shown}
        <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-brand-purple/60 align-middle" />
      </p>
      <span className="absolute -bottom-1.5 left-6 h-3 w-3 rotate-45 bg-bubble ring-1 ring-brand-purple/10" />
    </div>
  );
}
