import { useRef, useState } from 'react';
import { Modal, Stack, Title, Button, Group, Checkbox } from '@mantine/core';
import { Player, BoardCell } from '@/types/game';

interface QuestionOverlayProps {
  opened: boolean;
  cell: BoardCell | null;
  players: Player[];
  onRevealAnswer: () => void;
  onSubmitResults: (data: { correct?: string | null; incorrect?: string[]; result?: 'correct' | 'incorrect'; playerId?: string }) => void;
  answerRevealed: boolean;
  isDouble: boolean;
}

export function QuestionOverlay({
  opened,
  cell,
  players,
  onRevealAnswer,
  onSubmitResults,
  answerRevealed,
  isDouble,
}: QuestionOverlayProps) {
  const [correctPlayer, setCorrectPlayer] = useState<string | null>(null);
  const [incorrectPlayers, setIncorrectPlayers] = useState<string[]>([]);
  const [doubleResult, setDoubleResult] = useState<'correct' | 'incorrect' | null>(null);
  const [doublePlayerId, setDoublePlayerId] = useState<string | null>(null);
  const [noOneAnswered, setNoOneAnswered] = useState(false);
  const wrongAnswerAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleNoOneAnswered = () => {
    setNoOneAnswered(true);
    setCorrectPlayer(null);
    setIncorrectPlayers([]);
    setDoublePlayerId(null);
    setDoubleResult(null);
  };

  const handleSubmit = () => {
    if (noOneAnswered) {
      onSubmitResults({ correct: null, incorrect: [] });
    } else if (isDouble) {
      if (doublePlayerId && doubleResult) {
        onSubmitResults({ result: doubleResult, playerId: doublePlayerId });
      }
    } else {
      onSubmitResults({ correct: correctPlayer, incorrect: incorrectPlayers });
    }
    
    // Reset state
    setCorrectPlayer(null);
    setIncorrectPlayers([]);
    setDoubleResult(null);
    setDoublePlayerId(null);
    setNoOneAnswered(false);
  };

  const toggleIncorrect = (playerId: string) => {
    setIncorrectPlayers(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  const handlePlayWrongAnswerSound = () => {
    if (typeof Audio === 'undefined') {
      return;
    }

    if (!wrongAnswerAudioRef.current) {
      wrongAnswerAudioRef.current = new Audio('/sounds/error.mp3');
    }

    wrongAnswerAudioRef.current.currentTime = 0;
    void wrongAnswerAudioRef.current.play().catch(() => {});
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {}}
      size="xl"
      centered
      withCloseButton={false}
      closeOnClickOutside={false}
    >
      <Stack gap="lg">
        <Title order={1} ta="center" c="green.6">
          ${cell?.value}
        </Title>
        
        <Title order={1} ta="center">
          {cell?.question}
        </Title>
        <div style={{ padding: '1rem', backgroundColor: '#e7f5ff', borderRadius: 8 }}>
          <Stack gap={0}>
            <Title order={1} ta="center">
              Answer:
            </Title>
            <Title order={1} ta="center">
              {cell?.answer}
            </Title>
          </Stack>
        </div>

        {!answerRevealed ? (
          <>
            <Button
              color="yellow"
              size="lg"
              fullWidth
              leftSection={
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              }
              onClick={handlePlayWrongAnswerSound}
            >
              Play wrong answer sound
            </Button>

            <Button onClick={onRevealAnswer} size="lg" fullWidth>
              Reveal Answer
            </Button>
          </>
        ) : (
          <>
            {isDouble ? (
              <>
                <Title order={4}>Daily Double - Select Player and Result</Title>
                <Stack gap="sm">
                  {players.map(player => (
                    <Button
                      key={player.id}
                      variant={doublePlayerId === player.id ? 'filled' : 'outline'}
                      onClick={() => { setDoublePlayerId(player.id); setNoOneAnswered(false); }}
                      disabled={noOneAnswered}
                    >
                      {player.name}
                    </Button>
                  ))}
                </Stack>

                {doublePlayerId && !noOneAnswered && (
                  <Group grow>
                    <Button
                      color="green"
                      variant={doubleResult === 'correct' ? 'filled' : 'outline'}
                      onClick={() => setDoubleResult('correct')}
                    >
                      Correct (+ ${cell?.value ? cell.value * 2 : 0})
                    </Button>
                    <Button
                      color="red"
                      variant={doubleResult === 'incorrect' ? 'filled' : 'outline'}
                      onClick={() => setDoubleResult('incorrect')}
                    >
                      Incorrect (- ${cell?.value ? cell.value * 2 : 0})
                    </Button>
                  </Group>
                )}

                <Button
                  color="gray"
                  variant={noOneAnswered ? 'filled' : 'outline'}
                  onClick={handleNoOneAnswered}
                  size="lg"
                  fullWidth
                >
                  No one answered
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={!noOneAnswered && (!doublePlayerId || !doubleResult)}
                  size="lg"
                  fullWidth
                >
                  Submit Result
                </Button>
              </>
            ) : (
              <>
                <Title order={4} c="green.6">
                  Select Correct Player (optional)
                </Title>
                <Stack gap="sm">
                  {players.map(player => (
                    <Button
                      key={player.id}
                      variant="filled"
                      color="green"
                      onClick={() => { setCorrectPlayer(player.id === correctPlayer ? null : player.id); setNoOneAnswered(false); }}
                      disabled={noOneAnswered}
                      size="lg"
                      fullWidth
                      style={{
                        border: correctPlayer === player.id ? '2px solid var(--mantine-color-green-9)' : '2px solid transparent',
                        opacity: correctPlayer && correctPlayer !== player.id ? 0.85 : 1,
                      }}
                    >
                      {player.name}
                    </Button>
                  ))}
                </Stack>

                <Title order={4} c="red.6">
                  Select Incorrect Players (optional)
                </Title>
                <Stack gap="sm">
                  {players.map(player => (
                    <Checkbox
                      key={player.id}
                      label={player.name}
                      checked={incorrectPlayers.includes(player.id)}
                      onChange={() => { toggleIncorrect(player.id); setNoOneAnswered(false); }}
                      disabled={noOneAnswered || player.id === correctPlayer}
                      size="xl"
                      color="red"
                      styles={{
                        body: { alignItems: 'center' },
                        input: {
                          borderColor: 'var(--mantine-color-red-6)',
                          '&:checked': {
                            backgroundColor: 'var(--mantine-color-red-6)',
                            borderColor: 'var(--mantine-color-red-6)',
                          },
                        },
                        label: {
                          color: 'var(--mantine-color-red-6)',
                          fontSize: '1.05rem',
                          fontWeight: 600,
                        },
                      }}
                    />
                  ))}
                </Stack>

                <Button
                  color="gray"
                  variant={noOneAnswered ? 'filled' : 'outline'}
                  onClick={handleNoOneAnswered}
                  size="lg"
                  fullWidth
                >
                  No one answered
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={!noOneAnswered && !correctPlayer && incorrectPlayers.length === 0}
                  size="lg"
                  fullWidth
                >
                  Submit Results
                </Button>
              </>
            )}
          </>
        )}
      </Stack>
    </Modal>
  );
}
