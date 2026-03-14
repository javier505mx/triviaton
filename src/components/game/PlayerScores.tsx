import { useEffect, useRef, useState } from 'react';
import { Text, Title } from '@mantine/core';
import { Player } from '@/types/game';

interface PlayerScoresProps {
  players: Player[];
}

export function PlayerScores({ players }: PlayerScoresProps) {
  const previousScoresRef = useRef<Map<string, number> | null>(null);
  const animationTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [scoreChanges, setScoreChanges] = useState<Record<string, number>>({});

  useEffect(() => {
    const previousScores = previousScoresRef.current;
    const nextScores = new Map(players.map(player => [player.id, player.score]));

    if (!previousScores) {
      previousScoresRef.current = nextScores;
      return;
    }

    const changedScores = players.reduce<Record<string, number>>((acc, player) => {
      const previousScore = previousScores.get(player.id);

      if (typeof previousScore === 'number' && previousScore !== player.score) {
        acc[player.id] = player.score - previousScore;
      }

      return acc;
    }, {});

    previousScoresRef.current = nextScores;

    if (Object.keys(changedScores).length === 0) {
      return;
    }

    setScoreChanges(prev => ({ ...prev, ...changedScores }));

    Object.keys(changedScores).forEach(playerId => {
      const existingTimeout = animationTimeoutsRef.current[playerId];
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      animationTimeoutsRef.current[playerId] = setTimeout(() => {
        setScoreChanges(prev => {
          if (!(playerId in prev)) return prev;

          const next = { ...prev };
          delete next[playerId];
          return next;
        });

        delete animationTimeoutsRef.current[playerId];
      }, 5000);
    });
  }, [players]);

  useEffect(() => {
    return () => {
      Object.values(animationTimeoutsRef.current).forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
    };
  }, []);

  if (players.length === 0) return null;

  const count = players.length;
  const isCompact = count > 6;

  const nameFontSize = isCompact
    ? 'clamp(0.65rem, 1.4vw, 1rem)'
    : 'clamp(0.8rem, 2vw, 1.4rem)';

  const scoreFontSize = isCompact
    ? 'clamp(1rem, 2.2vw, 1.8rem)'
    : 'clamp(1.5rem, 3.5vw, 2.8rem)';

  const padding = isCompact ? '0.35rem 0.4rem' : '0.6rem 0.75rem';

  return (
    <>
      <div style={{
        display: 'flex',
        gap: '4px',
        width: '100%',
      }}>
        {players.map(player => {
          const scoreDelta = scoreChanges[player.id];
          const isAnimating = typeof scoreDelta === 'number' && scoreDelta !== 0;
          const isPositiveChange = (scoreDelta ?? 0) > 0;

          return (
            <div
              key={player.id}
              style={{
                flex: 1,
                minWidth: 0,
                position: 'relative',
                background: isAnimating
                  ? `linear-gradient(180deg, ${isPositiveChange ? '#1d4ed8' : '#7f1d1d'} 0%, ${isPositiveChange ? '#0a0f8a' : '#450a0a'} 100%)`
                  : 'linear-gradient(180deg, #0e14b8 0%, #0a0f8a 100%)',
                borderBottom: `4px solid ${isAnimating ? (isPositiveChange ? '#f6d365' : '#ff8787') : '#d4a843'}`,
                borderRadius: '4px',
                padding,
                textAlign: 'center',
                boxShadow: isAnimating
                  ? `0 0 0 2px ${isPositiveChange ? 'rgba(246, 211, 101, 0.85)' : 'rgba(255, 135, 135, 0.9)'}, 0 0 30px ${isPositiveChange ? 'rgba(246, 211, 101, 0.55)' : 'rgba(255, 107, 107, 0.45)'}, inset 0 0 20px rgba(255, 255, 255, 0.08)`
                  : '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 0 15px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden',
                animation: isAnimating ? 'scoreHighlight 1s ease-in-out infinite' : undefined,
              }}
            >
              <Title
                order={isCompact ? 3 : 1}
                ta="center"
                style={{
                  color: '#ffffff',
                  lineHeight: 1.2,
                  fontSize: nameFontSize,
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.6)',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {player.name}
              </Title>
              <Text
                fw={900}
                ta="center"
                style={{
                  fontSize: scoreFontSize,
                  fontVariantNumeric: 'tabular-nums',
                  color: player.score >= 0 ? '#d4a843' : '#ff6b6b',
                  lineHeight: 1.2,
                  textShadow: isAnimating
                    ? `0 0 16px ${isPositiveChange ? 'rgba(246, 211, 101, 0.9)' : 'rgba(255, 107, 107, 0.95)'}, 2px 2px 4px rgba(0, 0, 0, 0.75)`
                    : player.score >= 0
                      ? '2px 2px 4px rgba(0, 0, 0, 0.6)'
                      : '0 0 8px rgba(255, 80, 80, 0.4)',
                  transform: isAnimating ? 'scale(1.06)' : 'scale(1)',
                  transition: 'transform 180ms ease-out',
                }}
              >
                ${player.score.toLocaleString()}
              </Text>
              {isAnimating && (
                <Text
                  fw={800}
                  ta="center"
                  style={{
                    marginTop: isCompact ? '0.1rem' : '0.2rem',
                    fontSize: isCompact ? 'clamp(0.65rem, 1.1vw, 0.95rem)' : 'clamp(0.8rem, 1.8vw, 1.25rem)',
                    color: isPositiveChange ? '#f6d365' : '#ff8787',
                    textShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
                    animation: 'scoreDeltaBlink 0.8s ease-in-out infinite',
                  }}
                >
                  {isPositiveChange ? '+' : '-'}${Math.abs(scoreDelta).toLocaleString()}
                </Text>
              )}
            </div>
          );
        })}
      </div>
      <style>{keyframes}</style>
    </>
  );
}

const keyframes = `
  @keyframes scoreHighlight {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.035);
    }
  }

  @keyframes scoreDeltaBlink {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.45;
    }
  }
`;
