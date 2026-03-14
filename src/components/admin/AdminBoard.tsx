import { Stack, Title, Group, Card, Text, Button } from '@mantine/core';
import { QuestionCategory, BoardCell } from '@/types/game';

interface AdminBoardProps {
  categories: QuestionCategory[];
  board: BoardCell[][];
  onSelectClue: (col: number, row: number) => void;
  onNewGame?: () => void;
}

export function AdminBoard({ categories, board, onSelectClue, onNewGame }: AdminBoardProps) {
  return (
    <Stack gap="md" style={{ padding: '2rem' }}>
      <Title order={2} ta="center">Game Board (Host View)</Title>
      
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '0.5rem', minWidth: 'min-content' }}>
          {board.map((column, colIndex) => (
            <div key={colIndex} style={{ flex: '1 1 0', minWidth: 150 }}>
              <Card
                padding="md"
                withBorder
                style={{ marginBottom: '0.5rem', textAlign: 'center', backgroundColor: '#1971c2' }}
              >
                <Text fw={700} c="white" size="sm">
                  {categories[colIndex]?.name || ''}
                </Text>
              </Card>
              
              <Stack gap="xs">
                {column.map((cell, rowIndex) => (
                  <Card
                    key={rowIndex}
                    padding="md"
                    withBorder
                    shadow="sm"
                    style={{
                      cursor: cell.revealed ? 'not-allowed' : 'pointer',
                      backgroundColor: cell.revealed ? '#f1f3f5' : '#fff',
                      opacity: cell.revealed ? 0.5 : 1,
                      textAlign: 'center',
                    }}
                    onClick={() => {
                      if (!cell.revealed) {
                        onSelectClue(colIndex, rowIndex);
                      }
                    }}
                  >
                    <Text
                      fw={700}
                      size="xl"
                      c={cell.revealed ? 'dimmed' : 'blue'}
                      span={!cell.revealed && cell.isDouble}
                    >
                      {cell.revealed ? (
                        '—'
                      ) : (
                        <>
                          {`$${cell.value}`}
                          {cell.isDouble && (
                            <Text component="span" c="red" inherit>
                              {' '}
                              (D)
                            </Text>
                          )}
                        </>
                      )}
                    </Text>
                  </Card>
                ))}
              </Stack>
            </div>
          ))}
        </div>
      </div>

      {onNewGame && (
        <Button
          color="red"
          size="xl"
          fullWidth
          style={{ marginTop: '1rem', fontSize: '1.5rem', padding: '1.25rem' }}
          onClick={onNewGame}
        >
          New Game
        </Button>
      )}
    </Stack>
  );
}
