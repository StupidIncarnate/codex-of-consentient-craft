import { wardPipeBlockedMessageTransformer } from './ward-pipe-blocked-message-transformer';

describe('wardPipeBlockedMessageTransformer', () => {
  it('VALID: {command: "npm run ward | grep error"} => returns message with command and alternatives', () => {
    const result = wardPipeBlockedMessageTransformer({
      command: 'npm run ward | grep error',
    });

    expect(result).toBe(
      `Blocked: piping ward output loses valuable information.\n` +
        `You ran: \`npm run ward | grep error\`\n\n` +
        `Ward already provides structured output with summaries and the \`detail\` subcommand for full errors.\n\n` +
        `Instead, try:\n` +
        `  npm run ward -- --only lint                           # Scope to specific check type\n` +
        `  npm run ward -- --only unit -- path/to/file.test.ts   # Scope to specific file\n` +
        `  npm run ward -- --only unit --onlyTests "test name"   # Scope to specific test name\n` +
        `  npm run ward -- detail <runId> <filePath>             # Get full error details for a file`,
    );
  });

  it('VALID: {command: "npm run ward -- --only lint | head -20"} => includes the piped command in message', () => {
    const result = wardPipeBlockedMessageTransformer({
      command: 'npm run ward -- --only lint | head -20',
    });

    expect(result).toBe(
      `Blocked: piping ward output loses valuable information.\n` +
        `You ran: \`npm run ward -- --only lint | head -20\`\n\n` +
        `Ward already provides structured output with summaries and the \`detail\` subcommand for full errors.\n\n` +
        `Instead, try:\n` +
        `  npm run ward -- --only lint                           # Scope to specific check type\n` +
        `  npm run ward -- --only unit -- path/to/file.test.ts   # Scope to specific file\n` +
        `  npm run ward -- --only unit --onlyTests "test name"   # Scope to specific test name\n` +
        `  npm run ward -- detail <runId> <filePath>             # Get full error details for a file`,
    );
  });
});
