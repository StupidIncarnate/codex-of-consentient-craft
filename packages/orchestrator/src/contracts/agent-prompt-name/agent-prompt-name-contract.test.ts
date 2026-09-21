import { agentPromptClassificationStatics } from '../../statics/agent-prompt-classification/agent-prompt-classification-statics';

import { agentPromptNameContract } from './agent-prompt-name-contract';
import { AgentPromptNameStub } from './agent-prompt-name.stub';

describe('agentPromptNameContract', () => {
  describe('valid names', () => {
    // Derived from the statics roster rather than a hand-copied list — a name added there stays
    // covered without this file changing.
    it.each(agentPromptClassificationStatics.promptNames)(
      'VALID: {value: "%s"} => parses successfully',
      (value) => {
        expect(agentPromptNameContract.parse(AgentPromptNameStub({ value }))).toBe(value);
      },
    );

    it('VALID: {default stub} => parses with default value', () => {
      expect(agentPromptNameContract.parse(AgentPromptNameStub())).toBe(
        'chaoswhisperer-gap-minion',
      );
    });

    // THE SET IS NO LONGER CLOSED. Prompts are config swapped in and out, so a quest that ran under
    // a prompt name nobody declares still has to LOAD — only `agentNameToPromptTransformer` refuses
    // an unknown name, and only at DISPATCH.
    it('VALID: {value: "a-prompt-nobody-declared"} => parses successfully', () => {
      expect(agentPromptNameContract.parse('a-prompt-nobody-declared')).toBe(
        'a-prompt-nobody-declared',
      );
    });
  });

  describe('invalid names', () => {
    it('EMPTY: {value: ""} => throws validation error', () => {
      expect(() => {
        agentPromptNameContract.parse('');
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {value: 123} => throws validation error', () => {
      expect(() => {
        agentPromptNameContract.parse(123 as never);
      }).toThrow(/Expected string/u);
    });
  });
});
