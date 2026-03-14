'use client';

import { useEffect, useRef, useState } from 'react';
import { Text } from '@mantine/core';
import { BoardCell } from '@/types/game';

interface QuestionDisplayProps {
  cell: BoardCell | null;
  isDouble: boolean;
  answerRevealed: boolean;
}

export function QuestionDisplay({ cell, isDouble, answerRevealed }: QuestionDisplayProps) {
  const [showDouble, setShowDouble] = useState(isDouble);
  const [answerVisible, setAnswerVisible] = useState(false);
  const revealAnswerAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isDouble) {
      setShowDouble(true);
      
      // Play Daily Double sound
      try {
        const audio = new Audio('/sounds/daily-double.mp3');
        audio.play().catch(() => {
          console.log('Sound not available yet');
        });
      } catch (error) {
        console.log('Sound not loaded');
      }

      // Hide after 5 seconds
      const timer = setTimeout(() => {
        setShowDouble(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isDouble]);

  // Trigger answer animation when answerRevealed changes to true
  useEffect(() => {
    if (answerRevealed) {
      if (typeof Audio !== 'undefined') {
        if (!revealAnswerAudioRef.current) {
          revealAnswerAudioRef.current = new Audio('/sounds/reveal-answer.mp3');
        }

        revealAnswerAudioRef.current.currentTime = 0;
        void revealAnswerAudioRef.current.play().catch(() => {});
      }

      // Small delay to let the DOM update, then trigger animation
      const timer = setTimeout(() => {
        setAnswerVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setAnswerVisible(false);
    }
  }, [answerRevealed]);

  if (!cell) return null;

  // Daily Double splash screen
  if (showDouble && isDouble) {
    return (
      <div style={overlayStyle}>
        <div
          style={{
            animation: 'ddPulse 1s ease-in-out infinite',
          }}
        >
          <Text
            style={{
              fontSize: 'clamp(4rem, 12vw, 10rem)',
              fontWeight: 900,
              color: '#d4a843',
              textShadow: '0 0 30px rgba(212, 168, 67, 0.6), 0 0 60px rgba(212, 168, 67, 0.4), 3px 3px 6px rgba(0, 0, 0, 0.8)',
              textAlign: 'center',
              lineHeight: 1.1,
              letterSpacing: '0.05em',
            }}
          >
            DOUBLE!
          </Text>
        </div>
        <style>{keyframes}</style>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      {/* Category value badge */}
      <div style={{
        position: 'absolute',
        top: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        animation: 'fadeSlideDown 0.5s ease-out',
      }}>
        <Text
          style={{
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            fontWeight: 900,
            color: '#d4a843',
            textShadow: '2px 2px 6px rgba(0, 0, 0, 0.7)',
          }}
        >
          ${cell.value}
        </Text>
      </div>

      {/* Question text - as big as possible */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        width: '100%',
        maxWidth: '90vw',
        padding: '6rem 3rem 3rem',
        animation: 'fadeSlideUp 0.6s ease-out',
        gap: '3rem',
      }}>
        <Text
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.3,
            textShadow: '3px 3px 8px rgba(0, 0, 0, 0.7)',
            textTransform: 'uppercase',
          }}
        >
          {cell.question}
        </Text>

        {/* Answer reveal */}
        {answerRevealed && (
          <div
            style={{
              width: '100%',
              maxWidth: '80vw',
              padding: 'clamp(1.5rem, 3vw, 3rem)',
              background: 'linear-gradient(180deg, #0e14b8 0%, #0a0f8a 100%)',
              borderRadius: '0.5rem',
              border: '3px solid #d4a843',
              boxShadow: '0 0 40px rgba(14, 20, 184, 0.5), 0 0 80px rgba(14, 20, 184, 0.2), inset 0 0 20px rgba(0, 0, 0, 0.3)',
              opacity: answerVisible ? 1 : 0,
              transform: answerVisible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(30px)',
              transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <Text
              style={{
                fontSize: 'clamp(2rem, 5vw, 4.5rem)',
                fontWeight: 800,
                color: '#ffffff',
                textAlign: 'center',
                lineHeight: 1.3,
                textShadow: '3px 3px 6px rgba(0, 0, 0, 0.5)',
              }}
            >
              {cell.answer}
            </Text>
          </div>
        )}
      </div>

      <style>{keyframes}</style>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(180deg, #060b2e 0%, #0e14b8 50%, #060b2e 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '2rem',
};

const keyframes = `
  @keyframes ddPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  @keyframes fadeSlideUp {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes fadeSlideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;
