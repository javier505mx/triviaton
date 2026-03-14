export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface Question {
  question: string;
  answer: string;
  value: number;
}

export interface QuestionCategory {
  id: string;
  name: string;
  types: string[];
  questions: Question[];
}

export interface BoardCell {
  question: string;
  answer: string;
  value: number;
  revealed: boolean;
  isDouble: boolean;
}

export const DEFAULT_DOUBLE_QUESTION_COUNT = 2;
export const MAX_DOUBLE_QUESTION_COUNT = 30;

export interface GameContext {
  players: Player[];
  doubleQuestionCount: number;
  categories: QuestionCategory[];
  board: BoardCell[][];
  currentClue: { col: number; row: number } | null;
  allQuestions: QuestionCategory[];
  selectedCategoryIds: string[];
}

export type GameState = 
  | { value: 'idle'; context: GameContext }
  | { value: 'selectPlayers'; context: GameContext }
  | { value: 'selectCategories'; context: GameContext }
  | { value: 'boardAnimation'; context: GameContext }
  | { value: 'showBoard'; context: GameContext }
  | { value: 'showQuestion'; context: GameContext }
  | { value: 'showQuestion.checkDouble'; context: GameContext }
  | { value: 'showQuestion.doubleAnimation'; context: GameContext }
  | { value: 'showQuestion.questionRevealed'; context: GameContext }
  | { value: 'showQuestion.answerRevealed'; context: GameContext }
  | { value: 'showQuestion.scoreUpdate'; context: GameContext }
  | { value: 'gameOver'; context: GameContext };

export interface StartEvent {
  type: 'START';
}

export interface PlayersConfirmedEvent {
  type: 'PLAYERS_CONFIRMED';
  players: Player[];
  doubleQuestionCount: number;
}

export interface CategoriesConfirmedEvent {
  type: 'CATEGORIES_CONFIRMED';
  categoryIds: string[];
}

export interface AnimationCompleteEvent {
  type: 'ANIMATION_COMPLETE';
}

export interface SelectClueEvent {
  type: 'SELECT_CLUE';
  col: number;
  row: number;
}

export interface DoubleAnimDoneEvent {
  type: 'DOUBLE_ANIM_DONE';
}

export interface RevealAnswerEvent {
  type: 'REVEAL_ANSWER';
}

export interface SubmitResultsEvent {
  type: 'SUBMIT_RESULTS';
  correct?: string | null;
  incorrect?: string[];
  // For daily double
  result?: 'correct' | 'incorrect';
  playerId?: string;
}

export interface NewGameEvent {
  type: 'NEW_GAME';
}

export type GameEvent =
  | StartEvent
  | PlayersConfirmedEvent
  | CategoriesConfirmedEvent
  | AnimationCompleteEvent
  | SelectClueEvent
  | DoubleAnimDoneEvent
  | RevealAnswerEvent
  | SubmitResultsEvent
  | NewGameEvent;

export interface SerializedGameState {
  state: string;
  context: GameContext;
}
