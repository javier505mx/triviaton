import { useState } from 'react';
import { Button, TextInput, NumberInput, Stack, Title } from '@mantine/core';
import { Player, DEFAULT_DOUBLE_QUESTION_COUNT, MAX_DOUBLE_QUESTION_COUNT } from '@/types/game';

interface PlayerSetupProps {
  onConfirm: (players: Player[], doubleQuestionCount: number) => void;
}

function normalizeCount(value: number | string, min: number, max: number, fallback: number): number {
  const parsed = typeof value === 'number' ? value : parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;

  return Math.min(max, Math.max(min, parsed));
}

export function PlayerSetup({ onConfirm }: PlayerSetupProps) {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [doubleQuestionCount, setDoubleQuestionCount] = useState(DEFAULT_DOUBLE_QUESTION_COUNT);

  const handleCountChange = (value: number | string) => {
    const count = normalizeCount(value, 2, 8, 2);
    setPlayerCount(count);
    setPlayerNames(prev => {
      const newNames = [...prev];
      while (newNames.length < count) {
        newNames.push('');
      }
      return newNames.slice(0, count);
    });
  };

  const handleNameChange = (index: number, name: string) => {
    setPlayerNames(prev => {
      const newNames = [...prev];
      newNames[index] = name;
      return newNames;
    });
  };

  const handleSubmit = () => {
    const players: Player[] = playerNames.map((name, index) => ({
      id: `player-${index + 1}`,
      name: name || `Player ${index + 1}`,
      score: 0,
    }));
    onConfirm(players, doubleQuestionCount);
  };

  const isValid = playerNames.every(name => name.trim().length > 0);

  return (
    <Stack gap="md" style={{ maxWidth: 500, margin: '0 auto', padding: '2rem' }}>
      <Title order={2}>Setup Players</Title>
      
      <NumberInput
        label="Number of Players"
        value={playerCount}
        onChange={handleCountChange}
        min={2}
        max={8}
        required
      />

      <NumberInput
        label="Number of DOUBLE Questions"
        value={doubleQuestionCount}
        onChange={(value) => setDoubleQuestionCount(normalizeCount(value, 0, MAX_DOUBLE_QUESTION_COUNT, DEFAULT_DOUBLE_QUESTION_COUNT))}
        min={0}
        max={MAX_DOUBLE_QUESTION_COUNT}
        required
      />

      {playerNames.map((name, index) => (
        <TextInput
          key={index}
          label={`Player ${index + 1} Name`}
          value={name}
          onChange={(e) => handleNameChange(index, e.currentTarget.value)}
          placeholder={`Enter name for Player ${index + 1}`}
          required
        />
      ))}

      <Button onClick={handleSubmit} disabled={!isValid} size="lg">
        Confirm Players
      </Button>
    </Stack>
  );
}
