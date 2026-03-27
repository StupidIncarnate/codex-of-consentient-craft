import { stripWardPipeCommandTransformer } from './strip-ward-pipe-command-transformer';

describe('stripWardPipeCommandTransformer', () => {
  it('VALID: {command: "npm run ward | grep error"} => returns "npm run ward"', () => {
    const result = stripWardPipeCommandTransformer({ command: 'npm run ward | grep error' });

    expect(result).toBe('npm run ward');
  });

  it('VALID: {command: "npm run ward -- --only unit | tail -80"} => strips pipe and tail', () => {
    const result = stripWardPipeCommandTransformer({
      command: 'npm run ward -- --only unit | tail -80',
    });

    expect(result).toBe('npm run ward -- --only unit');
  });

  it('VALID: {command with 2>&1 redirect before pipe} => strips redirect and pipe', () => {
    const result = stripWardPipeCommandTransformer({
      command:
        'npm run ward -- --only unit -- packages/server/src/transformers/dev-log-event-format/dev-log-event-format-transformer.test.ts 2>&1 | tail -80',
    });

    expect(result).toBe(
      'npm run ward -- --only unit -- packages/server/src/transformers/dev-log-event-format/dev-log-event-format-transformer.test.ts 2>&1',
    );
  });

  it('VALID: {command: "npm run ward -- --only lint | head -20"} => strips pipe and head', () => {
    const result = stripWardPipeCommandTransformer({
      command: 'npm run ward -- --only lint | head -20',
    });

    expect(result).toBe('npm run ward -- --only lint');
  });

  it('EDGE: {command without pipe} => returns command unchanged', () => {
    const result = stripWardPipeCommandTransformer({
      command: 'npm run ward -- --only unit',
    });

    expect(result).toBe('npm run ward -- --only unit');
  });

  it('VALID: {command with multiple pipes} => strips from first pipe onward', () => {
    const result = stripWardPipeCommandTransformer({
      command: 'npm run ward | grep error | head -5',
    });

    expect(result).toBe('npm run ward');
  });
});
