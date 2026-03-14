import { setup, assign } from 'xstate';
import {
  GameContext,
  GameEvent,
  QuestionCategory,
  BoardCell,
  DEFAULT_DOUBLE_QUESTION_COUNT,
  MAX_DOUBLE_QUESTION_COUNT,
} from '@/types/game';

// Helper function to create board from selected categories
function createBoard(categories: QuestionCategory[]): BoardCell[][] {
  const board: BoardCell[][] = [];
  
  // Create 6 columns (one per category) with 5 rows each
  for (let col = 0; col < 6; col++) {
    const column: BoardCell[] = [];
    const category = categories[col];
    
    if (category && category.questions) {
      // Take first 5 questions from each category
      for (let row = 0; row < 5; row++) {
        const question = category.questions[row];
        if (question) {
          column.push({
            question: question.question,
            answer: question.answer,
            value: question.value,
            revealed: false,
            isDouble: false,
          });
        }
      }
    }
    
    board.push(column);
  }
  
  return board;
}

// Helper function to randomly assign configured DOUBLE clues
function assignDailyDoubles(board: BoardCell[][], doubleQuestionCount: number): BoardCell[][] {
  const newBoard = board.map(column =>
    column.map(cell => ({
      ...cell,
      isDouble: false,
    }))
  );
  
  // Get all unrevealed cell positions
  const positions: { col: number; row: number }[] = [];
  for (let col = 0; col < newBoard.length; col++) {
    for (let row = 0; row < newBoard[col].length; row++) {
      positions.push({ col, row });
    }
  }
  
  const normalizedDoubleQuestionCount = Math.min(
    positions.length,
    Math.max(0, Math.min(MAX_DOUBLE_QUESTION_COUNT, doubleQuestionCount))
  );

  // Randomly select the configured positions for DOUBLE clues
  const shuffled = positions.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, normalizedDoubleQuestionCount);
  
  selected.forEach(({ col, row }) => {
    if (newBoard[col] && newBoard[col][row]) {
      newBoard[col][row].isDouble = true;
    }
  });
  
  return newBoard;
}

// Helper function to check if board is complete
function isBoardComplete(board: BoardCell[][]): boolean {
  for (const column of board) {
    for (const cell of column) {
      if (!cell.revealed) {
        return false;
      }
    }
  }
  return true;
}

export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
  },
  guards: {
    isDouble: ({ context }) => {
      if (!context.currentClue) return false;
      const { col, row } = context.currentClue;
      return context.board[col]?.[row]?.isDouble || false;
    },
    cluesRemain: ({ context }) => {
      return !isBoardComplete(context.board);
    },
  },
  actions: {
    setPlayers: assign({
      players: ({ event }) => {
        if (event.type !== 'PLAYERS_CONFIRMED') return [];
        return event.players;
      },
      doubleQuestionCount: ({ context, event }) => {
        if (event.type !== 'PLAYERS_CONFIRMED') return context.doubleQuestionCount;

        return Math.min(
          MAX_DOUBLE_QUESTION_COUNT,
          Math.max(0, event.doubleQuestionCount)
        );
      },
    }),
    setCategories: assign({
      categories: ({ context, event }) => {
        if (event.type !== 'CATEGORIES_CONFIRMED') return context.categories;
        
        const selectedCategories = event.categoryIds
          .map(id => context.allQuestions.find(cat => cat.id === id))
          .filter((cat): cat is QuestionCategory => cat !== undefined);
        
        return selectedCategories;
      },
      selectedCategoryIds: ({ event }) => {
        if (event.type !== 'CATEGORIES_CONFIRMED') return [];
        return event.categoryIds;
      },
      board: ({ context, event }) => {
        if (event.type !== 'CATEGORIES_CONFIRMED') return context.board;
        
        const selectedCategories = event.categoryIds
          .map(id => context.allQuestions.find(cat => cat.id === id))
          .filter((cat): cat is QuestionCategory => cat !== undefined);
        
        const newBoard = createBoard(selectedCategories);
        return assignDailyDoubles(newBoard, context.doubleQuestionCount);
      },
    }),
    setCurrentClue: assign({
      currentClue: ({ event }) => {
        if (event.type !== 'SELECT_CLUE') return null;
        return { col: event.col, row: event.row };
      },
    }),
    updateScoresNormal: assign({
      players: ({ context, event }) => {
        if (event.type !== 'SUBMIT_RESULTS') return context.players;
        if (!context.currentClue) return context.players;
        
        const { col, row } = context.currentClue;
        const cell = context.board[col]?.[row];
        if (!cell) return context.players;
        
        const value = cell.value;
        const correct = event.correct;
        const incorrect = event.incorrect || [];
        
        return context.players.map(player => {
          if (correct && player.id === correct) {
            return { ...player, score: player.score + value };
          }
          if (incorrect.includes(player.id)) {
            return { ...player, score: player.score - value };
          }
          return player;
        });
      },
      board: ({ context }) => {
        if (!context.currentClue) return context.board;
        
        const { col, row } = context.currentClue;
        const newBoard = context.board.map(column => [...column]);
        
        if (newBoard[col] && newBoard[col][row]) {
          newBoard[col][row] = {
            ...newBoard[col][row],
            revealed: true,
          };
        }
        
        return newBoard;
      },
      currentClue: () => null,
    }),
    updateScoresDouble: assign({
      players: ({ context, event }) => {
        if (event.type !== 'SUBMIT_RESULTS') return context.players;
        if (!context.currentClue) return context.players;
        if (!event.playerId || !event.result) return context.players;
        
        const { col, row } = context.currentClue;
        const cell = context.board[col]?.[row];
        if (!cell) return context.players;
        
        const value = cell.value * 2; // Double the value
        
        return context.players.map(player => {
          if (player.id === event.playerId) {
            const delta = event.result === 'correct' ? value : -value;
            return { ...player, score: player.score + delta };
          }
          return player;
        });
      },
      board: ({ context }) => {
        if (!context.currentClue) return context.board;
        
        const { col, row } = context.currentClue;
        const newBoard = context.board.map(column => [...column]);
        
        if (newBoard[col] && newBoard[col][row]) {
          newBoard[col][row] = {
            ...newBoard[col][row],
            revealed: true,
          };
        }
        
        return newBoard;
      },
      currentClue: () => null,
    }),
  },
}).createMachine({
  id: 'game',
  initial: 'idle',
  context: {
    players: [],
    doubleQuestionCount: DEFAULT_DOUBLE_QUESTION_COUNT,
    categories: [],
    board: [],
    currentClue: null,
    allQuestions: [],
    selectedCategoryIds: [],
  },
  states: {
    idle: {
      on: {
        START: {
          target: 'selectPlayers',
        },
      },
    },
    selectPlayers: {
      on: {
        PLAYERS_CONFIRMED: {
          target: 'selectCategories',
          actions: ['setPlayers'],
        },
      },
    },
    selectCategories: {
      on: {
        CATEGORIES_CONFIRMED: {
          target: 'boardAnimation',
          actions: ['setCategories'],
        },
      },
    },
    boardAnimation: {
      on: {
        ANIMATION_COMPLETE: {
          target: 'showBoard',
        },
      },
    },
    showBoard: {
      on: {
        SELECT_CLUE: {
          target: 'showQuestion',
          actions: ['setCurrentClue'],
        },
        NEW_GAME: {
          target: 'selectPlayers',
          actions: [assign({
            players: () => [],
            doubleQuestionCount: () => DEFAULT_DOUBLE_QUESTION_COUNT,
            categories: () => [],
            board: () => [],
            currentClue: () => null,
            selectedCategoryIds: () => [],
          })],
        },
      },
    },
    showQuestion: {
      initial: 'checkDouble',
      states: {
        checkDouble: {
          always: [
            {
              guard: 'isDouble',
              target: 'doubleAnimation',
            },
            {
              target: 'questionRevealed',
            },
          ],
        },
        doubleAnimation: {
          on: {
            DOUBLE_ANIM_DONE: {
              target: 'questionRevealed',
            },
          },
        },
        questionRevealed: {
          on: {
            REVEAL_ANSWER: {
              target: 'answerRevealed',
            },
          },
        },
        answerRevealed: {
          on: {
            SUBMIT_RESULTS: {
              target: 'scoreUpdate',
            },
          },
        },
        scoreUpdate: {
          always: [
            {
              guard: ({ context }) => {
                if (!context.currentClue) return false;
                const { col, row } = context.currentClue;
                return context.board[col]?.[row]?.isDouble || false;
              },
              target: '#game.checkBoard',
              actions: ['updateScoresDouble'],
            },
            {
              target: '#game.checkBoard',
              actions: ['updateScoresNormal'],
            },
          ],
        },
      },
    },
    checkBoard: {
      always: [
        {
          guard: 'cluesRemain',
          target: 'showBoard',
        },
        {
          target: 'gameOver',
        },
      ],
    },
    gameOver: {
      on: {
        NEW_GAME: {
          target: 'selectPlayers',
          actions: [assign({
            players: () => [],
            doubleQuestionCount: () => DEFAULT_DOUBLE_QUESTION_COUNT,
            categories: () => [],
            board: () => [],
            currentClue: () => null,
            selectedCategoryIds: () => [],
          })],
        },
      },
    },
  },
});
