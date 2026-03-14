'use client';

import { useEffect, useState } from 'react';
import { Stack, Text } from '@mantine/core';
import { Player } from '@/types/game';

interface GameOverOverlayProps {
  players: Player[];
}

export function GameOverOverlay({ players }: GameOverOverlayProps) {
  const [revealedGroups, setRevealedGroups] = useState(0);

  // Sort players by score (lowest to highest)
  const sortedPlayers = [...players].sort((a, b) => a.score - b.score);
  const playerGroups = sortedPlayers.reduce<Array<{ score: number; players: Player[] }>>((groups, player) => {
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.score === player.score) {
      lastGroup.players.push(player);
      return groups;
    }

    groups.push({
      score: player.score,
      players: [player],
    });

    return groups;
  }, []);

  useEffect(() => {
    if (revealedGroups < playerGroups.length) {
      const timer = setTimeout(() => {
        setRevealedGroups(prev => prev + 1);
      }, 1000); // Reveal one score group per second

      return () => clearTimeout(timer);
    }
  }, [revealedGroups, playerGroups.length]);

  // Generate sparkle particles
  const sparkleCount = 60;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(180deg, #060b2e 0%, #0e14b8 50%, #060b2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        overflow: 'hidden',
      }}
    >
      {/* Gold sparkle rain */}
      {Array.from({ length: sparkleCount }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: -20,
            left: `${Math.random() * 100}%`,
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, #d4a843 0%, rgba(212, 168, 67, 0) 70%)`,
            boxShadow: '0 0 6px #d4a843',
            animation: `fall ${3 + Math.random() * 4}s linear infinite`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: 0.6 + Math.random() * 0.4,
          }}
        />
      ))}

      <Stack gap="xl" align="center" style={{ zIndex: 1, maxWidth: 800 }}>
        <Text
          size="80px"
          fw={900}
          ta="center"
          style={{
            color: '#d4a843',
            textShadow: '3px 3px 8px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 168, 67, 0.3)',
            letterSpacing: '0.05em',
          }}
        >
          Game Over!
        </Text>

        <Stack gap="md" style={{ width: '100%', marginTop: '2rem' }}>
          {playerGroups.map((group, index) => {
            const isWinner = index === playerGroups.length - 1;
            const isRevealed = index < revealedGroups;
            const playerNames = group.players.map(player => player.name).join(' & ');
            const winnerLabel = group.players.length > 1 ? 'WINNER(S)' : 'WINNER';

            return (
              <div
                key={`${group.score}-${playerNames}`}
                style={{
                  opacity: isRevealed ? 1 : 0,
                  transform: isRevealed ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'all 0.5s ease-out',
                  transitionDelay: `${index * 0.1}s`,
                }}
              >
                {isWinner ? (
                  <div
                    style={{
                      padding: '2rem',
                      background: 'linear-gradient(135deg, #d4a843 0%, #b8942e 50%, #d4a843 100%)',
                      borderRadius: 8,
                      textAlign: 'center',
                      border: '3px solid #f0d080',
                      boxShadow: '0 0 40px rgba(212, 168, 67, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Stack gap="xs" align="center">
                      <Text
                        size="50px"
                        fw={900}
                        style={{
                          color: '#060b2e',
                          textShadow: '1px 1px 2px rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        {playerNames}
                      </Text>
                      <Text
                        size="40px"
                        fw={700}
                        style={{ color: '#060b2e' }}
                      >
                        ${group.score.toLocaleString()}
                      </Text>
                      <Text
                        size="30px"
                        fw={900}
                        style={{
                          color: '#060b2e',
                          letterSpacing: '0.15em',
                        }}
                      >
                        {winnerLabel}
                      </Text>
                    </Stack>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '1rem',
                      background: 'linear-gradient(180deg, #0e14b8 0%, #0a0f8a 100%)',
                      borderRadius: 4,
                      textAlign: 'center',
                      border: '2px solid #3a3a8a',
                      boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <Text
                      size="30px"
                      fw={700}
                      style={{
                        color: '#ffffff',
                        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.6)',
                      }}
                    >
                      {playerNames} — ${group.score.toLocaleString()}
                    </Text>
                  </div>
                )}
              </div>
            );
          })}
        </Stack>
      </Stack>

      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh);
          }
        }
      `}</style>
    </div>
  );
}
