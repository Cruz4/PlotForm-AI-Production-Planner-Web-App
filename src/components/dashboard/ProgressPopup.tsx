// src/components/dashboard/ProgressPopup.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

export interface ProgressPopupInfo {
  x: number;
  y: number;
  change: number;
  newTotal: number;
  type: 'change' | 'recalculation';
}

interface ProgressPopupProps {
  popupInfo: ProgressPopupInfo | null;
  onAnimationEnd: () => void;
}

export function ProgressPopup({ popupInfo, onAnimationEnd }: ProgressPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (popupInfo) {
      setPosition({ x: popupInfo.x, y: popupInfo.y });
      setIsVisible(true);

      const handleMouseMove = (e: MouseEvent) => {
        setPosition({ x: e.clientX, y: e.clientY });
      };
      
      document.addEventListener('mousemove', handleMouseMove);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onAnimationEnd, 500); // Allow fade-out to complete
      }, 3500); // Visible duration

      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [popupInfo, onAnimationEnd]);

  if (!popupInfo) {
    return null;
  }

  const { change, newTotal, type } = popupInfo;
  const isPositive = change >= 0;

  let content;
  if (type === 'change') {
    content = (
      <>
        {isPositive ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
        <span>{isPositive ? '+' : ''}{change}% = {newTotal}%</span>
      </>
    );
  } else {
    content = <span>~ {newTotal}%</span>;
  }
  
  const textColorClass = type === 'change' 
    ? (isPositive ? 'text-green-300' : 'text-red-300') 
    : 'text-blue-300';

  return (
    <div
      ref={popupRef}
      className={cn(
        "fixed top-0 left-0 z-50 pointer-events-none transition-opacity duration-500",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      <div className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-lg -translate-x-1/2 -translate-y-[calc(100%+10px)]",
        "bg-black/20 backdrop-blur-sm border border-white/10",
        textColorClass,
        "animate-progress-popup"
      )}>
        {content}
      </div>
    </div>
  );
}
