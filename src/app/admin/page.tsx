'use client';

import { useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { Button, Container, Loader, Stack, Text } from '@mantine/core';
import { gameMachine } from '@/machines/gameMachine';
import { PlayerSetup } from '@/components/admin/PlayerSetup';
import { CategorySelection } from '@/components/admin/CategorySelection';
import { AdminBoard } from '@/components/admin/AdminBoard';
import { QuestionOverlay } from '@/components/admin/QuestionOverlay';
import { SerializedGameState } from '@/types/game';

// Flatten XState nested state values to dot-notation strings
// e.g. { showQuestion: 'checkDouble' } -> 'showQuestion.checkDouble'
function flattenStateValue(value: string | Record<string, unknown>): string {
  if (typeof value === 'string') return value;
  const entries = Object.entries(value);
  if (entries.length === 1) {
    const [key, val] = entries[0];
    if (typeof val === 'string') return `${key}.${val}`;
    if (typeof val === 'object' && val !== null) {
      return `${key}.${flattenStateValue(val as Record<string, unknown>)}`;
    }
  }
  return JSON.stringify(value);
}

export default function AdminPage() {
  const [state, send, actor] = useMachine(gameMachine);

  // Load questions on mount
  useEffect(() => {
    fetch('/api/game/questions')
      .then(res => res.json())
      .then(questions => {
        actor.send({
          type: 'START',
        });
        
        // Update context with questions
        actor.getSnapshot().context.allQuestions = questions;
      })
      .catch(err => console.error('Failed to load questions:', err));
  }, [actor]);

  // Sync state to server whenever it changes
  useEffect(() => {
    const serialized: SerializedGameState = {
      state: flattenStateValue(state.value as string | Record<string, unknown>),
      context: state.context,
    };

    fetch('/api/game/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serialized),
    }).catch(err => console.error('Failed to sync state:', err));
  }, [state]);

  // Auto-complete board animation after delay
  useEffect(() => {
    if (state.value === 'boardAnimation') {
      // Wait for animation to complete (6 categories * 800ms + 5 rows * 600ms + buffer)
      const timer = setTimeout(() => {
        send({ type: 'ANIMATION_COMPLETE' });
      }, 9000); // ~9 seconds total

      return () => clearTimeout(timer);
    }
  }, [state.value, send]);

  // Auto-complete Daily Double animation after delay
  useEffect(() => {
    const stateStr = typeof state.value === 'object' ? JSON.stringify(state.value) : String(state.value);
    if (stateStr.includes('doubleAnimation')) {
      const timer = setTimeout(() => {
        send({ type: 'DOUBLE_ANIM_DONE' });
      }, 5000); // 5 seconds for Daily Double animation

      return () => clearTimeout(timer);
    }
  }, [state.value, send]);

  const currentClue = state.context.currentClue
    ? state.context.board[state.context.currentClue.col]?.[state.context.currentClue.row]
    : null;

  const stateValue = typeof state.value === 'object' 
    ? JSON.stringify(state.value) 
    : String(state.value);

  if (state.value === 'idle') {
    return (
      <Container>
        <Stack align="center" justify="center" style={{ minHeight: '100vh' }}>
          <Loader size="xl" />
          <Text>Loading questions...</Text>
        </Stack>
      </Container>
    );
  }

  if (state.value === 'selectPlayers') {
    return (
      <Container>
        <PlayerSetup
          onConfirm={(players, doubleQuestionCount) => {
            send({ type: 'PLAYERS_CONFIRMED', players, doubleQuestionCount });
          }}
        />
      </Container>
    );
  }

  if (state.value === 'selectCategories') {
    return (
      <Container size="xl">
        <CategorySelection
          categories={state.context.allQuestions}
          onConfirm={(categoryIds) => {
            send({ type: 'CATEGORIES_CONFIRMED', categoryIds });
          }}
        />
      </Container>
    );
  }

  if (state.value === 'boardAnimation') {
    return (
      <Container>
        <Stack align="center" justify="center" style={{ minHeight: '100vh' }}>
          <Loader size="xl" />
          <Text size="xl" fw={700}>Board is being revealed on the game screen...</Text>
          <Text size="sm" c="dimmed">
            This will complete automatically when the animation finishes
          </Text>
        </Stack>
      </Container>
    );
  }

  if (state.value === 'showBoard') {
    return (
      <Container size="xl">
        <AdminBoard
          categories={state.context.categories}
          board={state.context.board}
          onSelectClue={(col, row) => {
            send({ type: 'SELECT_CLUE', col, row });
          }}
          onNewGame={() => {
            if (window.confirm('Are you sure you want to start a new game? All progress will be lost.')) {
              send({ type: 'NEW_GAME' });
            }
          }}
        />
      </Container>
    );
  }

  if (stateValue.includes('checkDouble')) {
    return (
      <Container>
        <Stack align="center" justify="center" style={{ minHeight: '100vh' }}>
          <Loader size="xl" />
        </Stack>
      </Container>
    );
  }

  if (stateValue.includes('doubleAnimation')) {
    return (
      <Container>
        <Stack align="center" justify="center" style={{ minHeight: '100vh' }}>
          <Text size="xl" fw={700}>Daily Double animation playing...</Text>
        </Stack>
      </Container>
    );
  }

  if (stateValue.includes('questionRevealed') || stateValue.includes('answerRevealed')) {
    const isDouble = currentClue?.isDouble || false;
    const answerRevealed = stateValue.includes('answerRevealed');

    return (
      <>
        <Container size="xl">
          <AdminBoard
            categories={state.context.categories}
            board={state.context.board}
            onSelectClue={() => {}}
          />
        </Container>
        
        <QuestionOverlay
          opened={true}
          cell={currentClue}
          players={state.context.players}
          onRevealAnswer={() => {
            send({ type: 'REVEAL_ANSWER' });
          }}
          onSubmitResults={(data) => {
            send({ type: 'SUBMIT_RESULTS', ...data });
          }}
          answerRevealed={answerRevealed}
          isDouble={isDouble}
        />
      </>
    );
  }

  if (state.value === 'gameOver') {
    return (
      <Container>
        <Stack align="center" justify="center" style={{ minHeight: '100vh' }}>
          <Text size="xl" fw={700}>Game Over!</Text>
          <Text>Check the game screen for final results</Text>
          <Button
            color="red"
            size="xl"
            style={{ marginTop: '2rem', fontSize: '1.5rem', padding: '1.25rem' }}
            onClick={() => send({ type: 'NEW_GAME' })}
          >
            New Game
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container>
      <Stack align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Text>Unknown state: {JSON.stringify(state.value)}</Text>
      </Stack>
    </Container>
  );
}
