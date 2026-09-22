import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { observableAutomatabilityStatics } from '../observable-automatability/observable-automatability-statics';

import { flowriderWorkerStatics } from './flowrider-worker-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides, so a needle
// matches whichever way the template happens to wrap it.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = flowriderWorkerStatics.prompt.template;

describe('flowriderWorkerStatics', () => {
  it('VALID: served template => measures below the byte ceiling', () => {
    // The budget ceiling is 50,000 bytes
    const totalLength = Buffer.byteLength(TEMPLATE, 'utf8');

    expect(totalLength).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  // THE SHARED BLOCK, WHOLE, EXACTLY ONCE. Restating it is text served twice against the same
  // budget; missing it is a rule every observable-authoring and walking prompt agreed on that this
  // prompt silently drops.
  it('VALID: served template => takes the observable-automatability block whole, exactly once', () => {
    expect(TEMPLATE.split(observableAutomatabilityStatics.markdown).length - 1).toBe(1);
  });

  // THE ROLE-SPECIFIC SENTENCE, IN THE WORKER'S OWN TERMS. The shared block explains the flag once,
  // for every host; this prompt still owes its own reader the moment inside ITS OWN script where the
  // flag applies — right beside the mark it exists to replace, at step 10 where this session actually
  // marks a unit.
  it('VALID: served template => tells the worker to flag verifyByHuman instead of cant-meet when nothing at any layer could ever settle a unit', () => {
    expect(
      hasIn({
        needle:
          "**Where a unit resists proving at every layer you can reach, and nothing at any layer — not a later\npass, not a later spec file, nothing but a person's own judgment once the quest is done — could ever\nsettle it either, flag it instead of marking `cant-meet`.** Set `verifyByHuman: true` on its\nobservable through `modify-quest`, naming its flow, node and observable id and carrying forward what\nit already declares.",
        text: TEMPLATE,
      }),
    ).toBe(true);
  });
});
