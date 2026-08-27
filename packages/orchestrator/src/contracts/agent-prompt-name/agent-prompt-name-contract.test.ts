import { agentPromptClassificationStatics } from '../../statics/agent-prompt-classification/agent-prompt-classification-statics';

import { agentPromptNameContract } from './agent-prompt-name-contract';
import { AgentPromptNameStub } from './agent-prompt-name.stub';

describe('agentPromptNameContract', () => {
  describe('valid names', () => {
    // Derived from the statics the enum is BUILT from, never a hand-copied list — a name added
    // there without a case here would otherwise go untested the day it lands.
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
  });

  describe('invalid names', () => {
    // THE GENERIC TRIO IS GONE, AND THAT IS WHAT THESE THREE PIN. Every minion prompt is now one
    // file carrying its parent's subject matter, so a bare `planner-minion` names nothing. A stale
    // MCP server or a prompt that still spells one of these would be refused here rather than
    // served an unparameterized template — which is the failure the old `$DISCIPLINE` design
    // could produce and this one cannot.
    it.each(['planner-minion', 'worker-minion', 'reviewer-minion'])(
      'INVALID: {value: "%s"} => throws validation error (a minion is named for its parent now)',
      (value) => {
        expect(() => {
          agentPromptNameContract.parse(value);
        }).toThrow(/Invalid enum value/u);
      },
    );

    // Every earlier shape of this system, kept so a stale server serving one is a hard failure
    // rather than a silent miss: the per-parent minion families the generic trio replaced, and the
    // standards-review roles the round's own reviewer absorbed.
    it.each([
      'pathseeker-surface',
      'lawbringer',
      'lawbringer-minion',
      'blightwarden',
      'blightwarden-group-minion',
      'blightwarden-crosscut-minion',
      'blightwarden-deadcode-minion',
      'blightscout',
      'codeweaver-piece-minion',
      'flowrider-authoring-minion',
      'flowrider-coverage-minion',
      'siegemaster-walker-minion',
      'siegemaster-test-audit-minion',
    ])('INVALID: {value: "%s"} => throws validation error (removed name)', (value) => {
      expect(() => {
        agentPromptNameContract.parse(value);
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: "unknown-agent"} => throws validation error', () => {
      expect(() => {
        agentPromptNameContract.parse('unknown-agent');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        agentPromptNameContract.parse('');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
