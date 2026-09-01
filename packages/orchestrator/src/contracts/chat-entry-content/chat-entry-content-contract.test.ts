import { chatEntryContentContract } from './chat-entry-content-contract';
import { ChatEntryContentStub } from './chat-entry-content.stub';

describe('chatEntryContentContract', () => {
  it('VALID: {value: "You are an AI..."} => parses successfully', () => {
    const content = ChatEntryContentStub({ value: 'You are an AI assistant' });

    expect(content).toBe('You are an AI assistant');
  });

  it('VALID: {default} => uses default content text', () => {
    const content = ChatEntryContentStub();

    expect(content).toBe('You are an AI assistant.');
  });

  it('VALID: {value: multiline text} => parses multiline text', () => {
    const multilineContent = `# Agent Prompt

You are a helpful assistant.

## Instructions
- Be helpful
- Be concise`;

    const content = ChatEntryContentStub({ value: multilineContent });

    expect(content).toBe(multilineContent);
  });

  it('VALID: {value: ""} => parses empty string', () => {
    const content = ChatEntryContentStub({ value: '' });

    expect(content).toBe('');
  });

  it('INVALID: {value: 123} => throws validation error', () => {
    expect(() => {
      return chatEntryContentContract.parse(123 as never);
    }).toThrow(/Expected string/u);
  });
});
