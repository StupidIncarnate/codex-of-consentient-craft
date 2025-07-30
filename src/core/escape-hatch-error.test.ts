import { EscapeHatchError } from './escape-hatch-error';

describe('EscapeHatchError', () => {
  const mockEscapeData = {
    reason: 'task_too_complex' as const,
    analysis: 'Task requires breaking down into smaller pieces',
    recommendation: 'Split the task into 3 subtasks',
    retro: 'Complex integrations need decomposition',
  };

  it('extends Error', () => {
    const error = new EscapeHatchError(mockEscapeData);
    expect(error).toBeInstanceOf(Error);
  });

  it('stores escape data', () => {
    const error = new EscapeHatchError(mockEscapeData);
    expect(error.escape).toStrictEqual(mockEscapeData);
  });

  it('sets error name to "EscapeHatchError"', () => {
    const error = new EscapeHatchError(mockEscapeData);
    expect(error.name).toBe('EscapeHatchError');
  });

  it('uses escape reason as error message', () => {
    const error = new EscapeHatchError(mockEscapeData);
    expect(error.message).toBe('task_too_complex');
  });
});
