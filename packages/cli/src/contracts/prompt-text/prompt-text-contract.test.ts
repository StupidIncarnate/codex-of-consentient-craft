import { promptTextContract } from './prompt-text-contract';
import { PromptTextStub } from './prompt-text.stub';

describe('promptTextContract', () => {
  it('VALID: {value: "You are an AI..."} => parses successfully', () => {
    const prompt = PromptTextStub({ value: 'You are an AI assistant' });

    expect(prompt).toBe('You are an AI assistant');
  });

  it('VALID: {default} => uses default prompt text', () => {
    const prompt = PromptTextStub();

    expect(prompt).toBe('You are an AI assistant.');
  });

  it('VALID: {value: multiline prompt} => parses multiline text', () => {
    const multilinePrompt = `# Agent Prompt

You are a helpful assistant.

## Instructions
- Be helpful
- Be concise`;

    const prompt = PromptTextStub({ value: multilinePrompt });

    expect(prompt).toBe(multilinePrompt);
  });

  it('INVALID_PROMPT: {value: ""} => throws validation error', () => {
    expect(() => {
      return promptTextContract.parse('');
    }).toThrow(/String must contain at least 1 character/u);
  });
});
