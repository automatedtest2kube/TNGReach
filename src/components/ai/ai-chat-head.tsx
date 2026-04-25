"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { useAccessibility } from "@/context/accessibility-context";

/** Pixels: movement past this = drag (reposition / drop zone); below = open command center. */
const DRAG_THRESHOLD_PX = 20;

function releaseCapture(el: Element | null, pointerId: number) {
  if (!el) return;
  try {
    if (el.hasPointerCapture?.(pointerId)) {
      el.releasePointerCapture(pointerId);
    }
  } catch {
    /* no-op */
  }
}

interface AIChatHeadProps {
  onOpen: () => void;
  visible: boolean;
}

export function AIChatHead({ onOpen, visible }: AIChatHeadProps) {
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartClient = useRef({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);
  const dragCommittedRef = useRef(false);
  const positionRef = useRef(position);
  const lastOpenAt = useRef(0);
  const blockClickOpenRef = useRef(false);
  const { isElderlyMode } = useAccessibility();

  positionRef.current = position;

  const bubbleSize = isElderlyMode ? 72 : 64;

  const safeOpen = useCallback(() => {
    const t = Date.now();
    if (t - lastOpenAt.current < 400) return;
    lastOpenAt.current = t;
    // Defer so the synthetic "click" after touch cannot hit the new backdrop the same frame.
    window.setTimeout(() => onOpen(), 0);
  }, [onOpen]);

  // Initialize position on mount
  useEffect(() => {
    if (position.x === -1 && typeof window !== "undefined") {
      setPosition({
        x: window.innerWidth - bubbleSize - 16,
        y: window.innerHeight - 180,
      });
    }
  }, [position.x, bubbleSize]);

  // Reset hidden state when visibility changes
  useEffect(() => {
    if (visible) {
      setIsHidden(false);
    }
  }, [visible]);

  const endPress = useCallback(
    (e: React.PointerEvent<HTMLDivElement> | { currentTarget: HTMLDivElement; pointerId: number }) => {
      const el = e.currentTarget;
      const id = e.pointerId;
      if (activePointerId.current !== id) return;
      activePointerId.current = null;
      releaseCapture(el, id);

      setIsDragging(false);

      if (!dragCommittedRef.current) {
        safeOpen();
        return;
      }

      blockClickOpenRef.current = true;
      dragCommittedRef.current = false;

      const { x: endX, y: endY } = positionRef.current;
      const removeZoneY = window.innerHeight - 80;
      if (endY + bubbleSize > removeZoneY) {
        setIsHidden(true);
        return;
      }

      const screenWidth = window.innerWidth;
      const centerX = endX + bubbleSize / 2;

      setPosition((prev) => ({
        ...prev,
        x: centerX < screenWidth / 2 ? 16 : screenWidth - bubbleSize - 16,
      }));
    },
    [bubbleSize, safeOpen],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);

      activePointerId.current = e.pointerId;
      dragCommittedRef.current = false;

      const { clientX, clientY } = e;
      dragStartClient.current = { x: clientX, y: clientY };
      dragStartPos.current = {
        x: clientX - position.x,
        y: clientY - position.y,
      };
    },
    [position],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerId.current !== e.pointerId) return;

      const { clientX, clientY } = e;

      const dx = clientX - dragStartClient.current.x;
      const dy = clientY - dragStartClient.current.y;
      if (!dragCommittedRef.current) {
        if (Math.hypot(dx, dy) <= DRAG_THRESHOLD_PX) return;
        dragCommittedRef.current = true;
        setIsDragging(true);
      }

      const newX = Math.min(
        Math.max(0, clientX - dragStartPos.current.x),
        window.innerWidth - bubbleSize,
      );
      const newY = Math.min(
        Math.max(60, clientY - dragStartPos.current.y),
        window.innerHeight - bubbleSize - 100,
      );

      setPosition({ x: newX, y: newY });
    },
    [bubbleSize],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      endPress(e);
    },
    [endPress],
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      endPress(e);
    },
    [endPress],
  );

  const handleLostPointerCapture = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    activePointerId.current = null;
    setIsDragging(false);
    const wasDrag = dragCommittedRef.current;
    dragCommittedRef.current = false;
    if (wasDrag) {
      blockClickOpenRef.current = true;
    } else {
      safeOpen();
    }
  }, [safeOpen]);

  /** Fallback if pointerup is dropped but the browser still synthesizes a click. */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (blockClickOpenRef.current) {
        blockClickOpenRef.current = false;
        return;
      }
      safeOpen();
    },
    [safeOpen],
  );

  if (!visible || position.x === -1 || isHidden) return null;

  return (
    <>
      {isDragging && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 transition-all duration-300"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center animate-pulse"
            style={{
              background: "rgba(248, 81, 73, 0.2)",
              border: "2px dashed #F85149",
            }}
          >
            <X className="w-5 h-5 text-[#F85149]" />
          </div>
          <span className="text-xs text-[#F85149] font-medium">Drop to hide</span>
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            safeOpen();
          }
        }}
        className={`fixed z-[60] select-none [touch-action:none] ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          left: position.x,
          top: position.y,
          width: bubbleSize,
          height: bubbleSize,
          WebkitTapHighlightColor: "transparent",
          transition: isDragging
            ? "none"
            : "left 0.3s ease-out, top 0.1s ease-out, transform 0.2s ease",
        }}
        aria-label="Open AI assistant"
      >
        <Mascot
          pose="happy"
          mood="idle"
          followPointer={false}
          className={`pointer-events-none relative transition-transform duration-200 [&>div[aria-hidden]]:hidden [filter:drop-shadow(0_4px_14px_rgba(60,40,120,0.18))] ${
            isDragging ? "scale-105" : "hover:scale-105"
          }`}
          size={bubbleSize}
        />

        <div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white pointer-events-none"
          style={{
            background: "linear-gradient(135deg, #F85149 0%, #FF6B6B 100%)",
            boxShadow: "0 2px 8px rgba(248, 81, 73, 0.5)",
          }}
          aria-hidden
        >
          1
        </div>

        {/* Full-area capture: inner <img> / 3D layers must not be the pointer target (body vs edge mismatch on mobile). */}
        <div
          aria-hidden
          className="absolute inset-0 z-[25]"
          style={{ touchAction: "none" }}
        />
      </div>
    </>
  );
}
