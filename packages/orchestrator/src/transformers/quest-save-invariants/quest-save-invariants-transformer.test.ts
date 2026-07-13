import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowStub,
  QuestContractEntryStub,
  QuestContractPropertyStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { questSaveInvariantsTransformer } from './quest-save-invariants-transformer';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const QUEST_STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

describe('questSaveInvariantsTransformer', () => {
  it('VALID: {default empty quest} => returns empty array', () => {
    const quest = QuestStub();

    const failures = questSaveInvariantsTransformer({ quest });

    expect(failures).toStrictEqual([]);
  });

  it('INVALID: {two flows share id} => returns only the failed Flow ID Uniqueness check', () => {
    const quest = QuestStub({
      flows: [FlowStub({ id: 'login-flow' as never }), FlowStub({ id: 'login-flow' as never })],
    });

    const failures = questSaveInvariantsTransformer({ quest });

    expect(failures).toStrictEqual([
      {
        name: 'Flow ID Uniqueness',
        passed: false,
        details: 'Duplicate flow ids: login-flow',
      },
    ]);
  });

  it('INVALID: {two flows share id AND a contract uses a raw primitive} => returns both failed invariants in check order', () => {
    const rawProperty = QuestContractPropertyStub({ name: 'password' as never });
    const node = FlowNodeStub({ id: 'anchor-node' as never });
    const edge = FlowEdgeStub({
      id: 'self' as never,
      from: 'anchor-node' as never,
      to: 'anchor-node' as never,
    });
    const contract = QuestContractEntryStub({
      name: 'Creds' as never,
      nodeId: 'anchor-node' as never,
    });
    const quest = QuestStub({
      flows: [
        FlowStub({ id: 'contract-flow' as never, nodes: [node], edges: [edge] }),
        FlowStub({ id: 'login-flow' as never }),
        FlowStub({ id: 'login-flow' as never }),
      ],
      contracts: [contract],
    });
    // Bypass Zod's parse-time ban on raw 'string' to test the post-parse guard path.
    Object.assign(rawProperty, { type: 'string' });
    Object.assign(contract, { properties: [rawProperty] });
    Object.assign(quest.contracts[0] as object, { properties: [rawProperty] });

    const failures = questSaveInvariantsTransformer({ quest });

    expect(failures).toStrictEqual([
      {
        name: 'Flow ID Uniqueness',
        passed: false,
        details: 'Duplicate flow ids: login-flow',
      },
      {
        name: 'No Raw Primitives in Contracts',
        passed: false,
        details:
          "Raw primitive contract properties: contract 'Creds' property 'password' uses raw primitive 'string'",
      },
    ]);
  });

  it('VALID: {quest without violations, status params provided} => returns empty array', () => {
    const quest = QuestStub();

    const failures = questSaveInvariantsTransformer({
      quest,
      currentStatus: 'approved',
      nextStatus: 'in_progress',
    });

    expect(failures).toStrictEqual([]);
  });

  it.each(QUEST_STATUSES)(
    'VALID: {currentStatus and nextStatus both %s, quest with an invariant violation} => still returns the same invariants failure (status params are unused)',
    (status) => {
      const quest = QuestStub({
        flows: [FlowStub({ id: 'login-flow' as never }), FlowStub({ id: 'login-flow' as never })],
      });

      const failures = questSaveInvariantsTransformer({
        quest,
        currentStatus: status,
        nextStatus: status,
      });

      expect(failures).toStrictEqual([
        {
          name: 'Flow ID Uniqueness',
          passed: false,
          details: 'Duplicate flow ids: login-flow',
        },
      ]);
    },
  );
});
