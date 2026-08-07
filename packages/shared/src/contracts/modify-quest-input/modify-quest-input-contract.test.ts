import { QuestNoteStub } from '../quest-note/quest-note.stub';
import { SignoffStub } from '../signoff/signoff.stub';
import { modifyQuestInputContract } from './modify-quest-input-contract';
import { ModifyQuestInputStub } from './modify-quest-input.stub';

describe('modifyQuestInputContract', () => {
  it('VALID: {questId only} => parses successfully', () => {
    const result = ModifyQuestInputStub({ questId: 'add-auth' });

    expect(result).toStrictEqual({ questId: 'add-auth' });
  });

  it('VALID: {questId with title} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      title: 'Updated Title',
    });

    expect(result).toStrictEqual({ questId: 'add-auth', title: 'Updated Title' });
  });

  it('INVALID: {questId: ""} => throws validation error', () => {
    expect(() => {
      return modifyQuestInputContract.parse({ questId: '' });
    }).toThrow(/too_small/u);
  });

  it('INVALID: {unknown key} => throws Unrecognized key error', () => {
    expect(() => {
      return modifyQuestInputContract.parse({
        questId: 'add-auth',
        unknownField: 'should fail',
      } as never);
    }).toThrow(/Unrecognized key/u);
  });

  it('VALID: {pausedAtStatus} => parses with pausedAtStatus field (orchestrator-only, stripped at MCP layer)', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      pausedAtStatus: 'in_progress',
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      pausedAtStatus: 'in_progress',
    });
  });

  it('VALID: {pausedAtStatus: null} => parses with null (clear marker for resume)', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      pausedAtStatus: null,
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      pausedAtStatus: null,
    });
  });

  it('VALID: {planningNotes with blightReports upsert} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      planningNotes: {
        blightReports: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
            minion: 'security',
            status: 'active',
            findings: [],
            createdAt: '2024-01-15T10:00:00.000Z',
            reviewedOn: [],
          },
        ],
      },
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      planningNotes: {
        blightReports: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
            minion: 'security',
            status: 'active',
            findings: [],
            createdAt: '2024-01-15T10:00:00.000Z',
            reviewedOn: [],
          },
        ],
      },
    });
  });

  it('VALID: {planningNotes with a qaLedger disposition} => survives parsing instead of being stripped', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      planningNotes: {
        qaLedger: [
          {
            itemId: 'login-flow:observable:check-redirect',
            disposition: 'walked',
            evidence: 'the browser landed on /dashboard',
            brokenWouldShow: 'would have stayed on /login',
            observedBy: 'walker slice 1',
            rippleSites: [],
            workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
            createdAt: '2024-01-15T10:00:00.000Z',
          },
        ],
      },
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      planningNotes: {
        qaLedger: [
          {
            itemId: 'login-flow:observable:check-redirect',
            disposition: 'walked',
            evidence: 'the browser landed on /dashboard',
            brokenWouldShow: 'would have stayed on /login',
            observedBy: 'walker slice 1',
            rippleSites: [],
            workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
            createdAt: '2024-01-15T10:00:00.000Z',
          },
        ],
      },
    });
  });

  it('VALID: {planningNotes with a blightLedger disposition} => survives parsing instead of being stripped', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      planningNotes: {
        blightLedger: [
          {
            itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
            disposition: 'reviewed',
            evidence: 'handleSubmit rethrows with the request url attached',
            observedBy: 'blightwarden',
            rippleSites: [],
            workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
            createdAt: '2024-01-15T10:00:00.000Z',
          },
        ],
      },
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      planningNotes: {
        blightLedger: [
          {
            itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
            disposition: 'reviewed',
            evidence: 'handleSubmit rethrows with the request url attached',
            observedBy: 'blightwarden',
            rippleSites: [],
            workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
            createdAt: '2024-01-15T10:00:00.000Z',
          },
        ],
      },
    });
  });

  it('VALID: {planningNotes with blightReports delete marker} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      planningNotes: {
        blightReports: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', _delete: true }],
      },
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      planningNotes: {
        blightReports: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', _delete: true }],
      },
    });
  });

  it('VALID: {operations full shape} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      operations: [
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          text: 'core: config load+validate adapter',
          status: 'pending',
        },
      ],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      operations: [
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          text: 'core: config load+validate adapter',
          status: 'pending',
          locked: false,
          flowIds: [],
        },
      ],
    });
  });

  it('VALID: {operations partial-patch shape: id + status only} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      operations: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', status: 'complete' }],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      operations: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', status: 'complete' }],
    });
  });

  it('VALID: {operations delete marker} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      operations: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', _delete: true }],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      operations: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', _delete: true }],
    });
  });

  it('VALID: {contracts partial-patch shape: id + status flip} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      contracts: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', status: 'existing' }],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      contracts: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', status: 'existing' }],
    });
  });

  it('VALID: {contracts full shape} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      contracts: [
        {
          id: 'login-credentials',
          name: 'LoginCredentials',
          kind: 'data',
          status: 'new',
          source: 'src/contracts/login-credentials/login-credentials-contract.ts',
          nodeId: 'start',
          properties: [],
        },
      ],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      contracts: [
        {
          id: 'login-credentials',
          name: 'LoginCredentials',
          kind: 'data',
          status: 'new',
          source: 'src/contracts/login-credentials/login-credentials-contract.ts',
          nodeId: 'start',
          properties: [],
        },
      ],
    });
  });

  it('VALID: {contracts delete marker} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      contracts: [{ id: 'login-credentials', _delete: true }],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      contracts: [{ id: 'login-credentials', _delete: true }],
    });
  });

  it('VALID: {designDecisions partial-patch shape: id + rationale only} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      designDecisions: [
        { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', rationale: 'Sharpened wording' },
      ],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      designDecisions: [
        { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', rationale: 'Sharpened wording' },
      ],
    });
  });

  it('VALID: {designDecisions full shape} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      designDecisions: [
        {
          id: 'use-jwt-auth',
          title: 'Use JWT for auth',
          rationale: 'Stateless tokens avoid a server-side session store',
          relatedNodeIds: ['start'],
        },
      ],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      designDecisions: [
        {
          id: 'use-jwt-auth',
          title: 'Use JWT for auth',
          rationale: 'Stateless tokens avoid a server-side session store',
          relatedNodeIds: ['start'],
        },
      ],
    });
  });

  it('VALID: {designDecisions delete marker} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      designDecisions: [{ id: 'use-jwt-auth', _delete: true }],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      designDecisions: [{ id: 'use-jwt-auth', _delete: true }],
    });
  });

  it('VALID: {planningNotes.blightReports partial-patch: id + status only} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      planningNotes: {
        blightReports: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', status: 'blocking-carry' }],
      },
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      planningNotes: {
        blightReports: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', status: 'blocking-carry' }],
      },
    });
  });

  it('VALID: {packagesAffected} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      packagesAffected: ['orchestrator', 'web', 'shared'],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      packagesAffected: ['orchestrator', 'web', 'shared'],
    });
  });

  it('VALID: {toolingRequirements full shape} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      toolingRequirements: [
        {
          id: 'pg-driver',
          name: 'PostgreSQL Driver',
          packageName: 'pg',
          reason: 'DB verification',
          requiredByObservables: ['login-redirects-to-dashboard'],
        },
      ],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      toolingRequirements: [
        {
          id: 'pg-driver',
          name: 'PostgreSQL Driver',
          packageName: 'pg',
          reason: 'DB verification',
          requiredByObservables: ['login-redirects-to-dashboard'],
        },
      ],
    });
  });

  it('VALID: {toolingRequirements partial-patch shape: id + reason only} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      toolingRequirements: [{ id: 'pg-driver', reason: 'Updated reason' }],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      toolingRequirements: [{ id: 'pg-driver', reason: 'Updated reason' }],
    });
  });

  it('VALID: {toolingRequirements delete marker} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      toolingRequirements: [{ id: 'pg-driver', _delete: true }],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      toolingRequirements: [{ id: 'pg-driver', _delete: true }],
    });
  });

  it('VALID: {flows delete marker} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      flows: [{ id: 'login-flow', _delete: true }],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      flows: [{ id: 'login-flow', _delete: true }],
    });
  });

  // Nested-union coverage unique to this composed contract: deletableFlowContract wraps
  // flowContract's own nodes/edges/observables in their own delete-marker unions
  // (deletableNodeContract, deletableEdgeContract, deletableObservableContract) — flowContract's
  // own test file proves the base shape, but only THIS contract's partial-patch-with-nested-array
  // branches prove a node, an edge, and an observable can each be independently deleted inside a
  // flow patch without restating the whole flow.
  it('VALID: {flows partial-patch with a deleted node, a deleted edge, and a nested deleted observable} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      flows: [
        {
          id: 'login-flow',
          nodes: [
            { id: 'start', _delete: true },
            { id: 'end', observables: [{ id: 'login-redirects-to-dashboard', _delete: true }] },
          ],
          edges: [{ id: 'start-to-end', _delete: true }],
        },
      ],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      flows: [
        {
          id: 'login-flow',
          nodes: [
            { id: 'start', _delete: true },
            { id: 'end', observables: [{ id: 'login-redirects-to-dashboard', _delete: true }] },
          ],
          edges: [{ id: 'start-to-end', _delete: true }],
        },
      ],
    });
  });

  // The persisted flow contracts declare the two sign-offs `.optional()`, which can only say "leave
  // this alone" by omission. The input side widens them to `.nullish()` so a reset can send the
  // explicit `null` clear marker that questItemDeepMergeTransformer turns into key removal.
  it('VALID: {flows patch clearing an observable siegemasterSignoff to null} => keeps null in the parsed output as the clear marker', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      flows: [
        {
          id: 'login-flow',
          nodes: [
            {
              id: 'end',
              observables: [{ id: 'login-redirects-to-dashboard', siegemasterSignoff: null }],
            },
          ],
        },
      ],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      flows: [
        {
          id: 'login-flow',
          nodes: [
            {
              id: 'end',
              observables: [{ id: 'login-redirects-to-dashboard', siegemasterSignoff: null }],
            },
          ],
        },
      ],
    });
  });

  it('VALID: {flows patch with a full flowriderSignoff on an observable} => parses the whole sign-off through', () => {
    const signoff = SignoffStub();

    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      flows: [
        {
          id: 'login-flow',
          nodes: [
            {
              id: 'end',
              observables: [{ id: 'login-redirects-to-dashboard', flowriderSignoff: signoff }],
            },
          ],
        },
      ],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      flows: [
        {
          id: 'login-flow',
          nodes: [
            {
              id: 'end',
              observables: [
                {
                  id: 'login-redirects-to-dashboard',
                  flowriderSignoff: {
                    verdict: 'confirmed',
                    evidence:
                      'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
                    workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                    at: '2026-01-01T00:00:00.000Z',
                  },
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it('VALID: {flows patch clearing an offMapSignoffs siegemasterSignoff to null} => keeps null in the parsed output as the clear marker', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      flows: [
        {
          id: 'login-flow',
          offMapSignoffs: [{ id: 'concurrency', siegemasterSignoff: null }],
        },
      ],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      flows: [
        {
          id: 'login-flow',
          offMapSignoffs: [{ id: 'concurrency', siegemasterSignoff: null }],
        },
      ],
    });
  });

  it('VALID: {planningNotes with a questNote} => survives parsing instead of being stripped', () => {
    const note = QuestNoteStub();

    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      planningNotes: { questNotes: [note] },
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      planningNotes: {
        questNotes: [
          {
            id: 'open-question-comment-anchor-scope',
            kind: 'open-question',
            role: 'siegemaster',
            workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            flowId: 'view-persisted-comments',
            unitId: 'view-persisted-comments:observable:check-badge-count-text',
            summary: 'Should a stale anchor notify per box or once per batch?',
            detail:
              'The batch send drops boxes whose node id no longer exists in the flow. Asked the operator; no answer landed before the walk ended.',
            at: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    });
  });

  // signoffContract carries its rule in a superRefine, and this contract reaches it through both
  // .extend() and .nullish(). Either wrapper silently dropping the effect would let an
  // `unconfirmable` verdict land with no routable question behind it.
  it('INVALID: {observable flowriderSignoff: unconfirmable verdict with no question} => throws the superRefine error', () => {
    expect(() => {
      return modifyQuestInputContract.parse({
        questId: 'add-auth',
        flows: [
          {
            id: 'login-flow',
            nodes: [
              {
                id: 'end',
                observables: [
                  {
                    id: 'login-redirects-to-dashboard',
                    flowriderSignoff: {
                      verdict: 'unconfirmable',
                      evidence: 'no browser bridge was reachable from this session',
                      workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                      at: '2026-01-01T00:00:00.000Z',
                    },
                  },
                ],
              },
            ],
          },
        ],
      });
    }).toThrow(/question is required when verdict is unconfirmable/u);
  });

  it('VALID: {workItems entry with only id} => parses successfully (every other field optional for upsert)', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      workItems: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      workItems: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }],
    });
  });

  it('VALID: {wardResults entry} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      wardResults: [
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          createdAt: '2024-01-15T10:00:00.000Z',
          exitCode: 0,
        },
      ],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      wardResults: [
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          createdAt: '2024-01-15T10:00:00.000Z',
          exitCode: 0,
        },
      ],
    });
  });

  it('VALID: {designPort} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      designPort: 5173,
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      designPort: 5173,
    });
  });

  it('VALID: {status} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      status: 'in_progress',
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      status: 'in_progress',
    });
  });

  it('VALID: {comments full shape} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      comments: [
        {
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          nodeId: 'start',
          text: 'This assertion looks wrong',
          createdAt: '2024-01-15T10:00:00.000Z',
        },
      ],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      comments: [
        {
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          nodeId: 'start',
          text: 'This assertion looks wrong',
          createdAt: '2024-01-15T10:00:00.000Z',
        },
      ],
    });
  });

  it('VALID: {comments partial patch} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      comments: [{ id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479', text: 'Updated wording' }],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      comments: [{ id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479', text: 'Updated wording' }],
    });
  });

  it('VALID: {comments delete marker} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      comments: [{ id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479', _delete: true }],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      comments: [{ id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479', _delete: true }],
    });
  });

  it('VALID: {comments with observableId} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      comments: [
        {
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          nodeId: 'start',
          observableId: 'login-redirects-to-dashboard',
          text: 'This assertion looks wrong',
          createdAt: '2024-01-15T10:00:00.000Z',
        },
      ],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      comments: [
        {
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          nodeId: 'start',
          observableId: 'login-redirects-to-dashboard',
          text: 'This assertion looks wrong',
          createdAt: '2024-01-15T10:00:00.000Z',
        },
      ],
    });
  });

  it('INVALID: {comments entry missing id and required full fields} => throws validation error', () => {
    expect(() => {
      return modifyQuestInputContract.parse({
        questId: 'add-auth',
        comments: [{ text: 'orphaned comment' } as never],
      });
    }).toThrow(/Invalid input/u);
  });

  it('INVALID: {operations partial-patch missing id} => throws validation error', () => {
    expect(() => {
      return modifyQuestInputContract.parse({
        questId: 'add-auth',
        operations: [{ status: 'complete' } as never],
      });
    }).toThrow(/Required|Invalid/u);
  });

  it('INVALID: {operations item with partial status} => throws validation error', () => {
    expect(() => {
      return modifyQuestInputContract.parse({
        questId: 'add-auth',
        operations: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            role: 'codeweaver',
            text: 'core: config load+validate adapter',
            status: 'partial',
          } as never,
        ],
      });
    }).toThrow(/Invalid/u);
  });

  it('INVALID: {steps key} => throws Unrecognized key error (removed field)', () => {
    expect(() => {
      return modifyQuestInputContract.parse({
        questId: 'add-auth',
        steps: [{ id: 'web-update-widget' }],
      } as never);
    }).toThrow(/Unrecognized key/u);
  });
});
