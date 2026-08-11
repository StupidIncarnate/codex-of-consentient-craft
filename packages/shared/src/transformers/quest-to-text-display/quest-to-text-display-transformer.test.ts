import { QuestStub } from '../../contracts/quest/quest.stub';
import { DesignDecisionStub } from '../../contracts/design-decision/design-decision.stub';
import { FlowStub } from '../../contracts/flow/flow.stub';
import { FlowNodeStub } from '../../contracts/flow-node/flow-node.stub';
import { FlowObservableStub } from '../../contracts/flow-observable/flow-observable.stub';
import { FlowOffMapSignoffStub } from '../../contracts/flow-off-map-signoff/flow-off-map-signoff.stub';
import { OperationItemStub } from '../../contracts/operation-item/operation-item.stub';
import { QuestContractEntryStub } from '../../contracts/quest-contract-entry/quest-contract-entry.stub';
import { QuestNoteStub } from '../../contracts/quest-note/quest-note.stub';
import { QuestPackageEntryStub } from '../../contracts/quest-package-entry/quest-package-entry.stub';
import { SignoffStub } from '../../contracts/signoff/signoff.stub';
import { ToolingRequirementStub } from '../../contracts/tooling-requirement/tooling-requirement.stub';
import { textDisplaySymbolsStatics } from '../../statics/text-display-symbols/text-display-symbols-statics';
import { questToTextDisplayTransformer } from './quest-to-text-display-transformer';

describe('questToTextDisplayTransformer', () => {
  describe('legend', () => {
    it('VALID: {quest: minimal} => output starts with legend block', () => {
      const quest = QuestStub();

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/^---$/mu);
      expect(result).toMatch(/^KEY:$/mu);
      expect(result).toMatch(/^# Quest: Add Authentication$/mu);
    });
  });

  describe('header', () => {
    it('VALID: {quest: with title and status} => renders title and status', () => {
      const quest = QuestStub({ title: 'Add Auth' as never, status: 'in_progress' });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/^# Quest: Add Auth\nStatus: in_progress$/mu);
    });
  });

  describe('design decisions', () => {
    it('EMPTY: {quest: no decisions} => shows (none)', () => {
      const quest = QuestStub({ designDecisions: [] });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/^## Design Decisions\n\n\(none\)$/mu);
    });

    it('VALID: {quest: with decisions} => renders decisions with rationale', () => {
      const quest = QuestStub({
        designDecisions: [
          DesignDecisionStub({
            id: 'use-jwt' as never,
            title: 'Use JWT' as never,
            rationale: 'Stateless auth' as never,
            relatedNodeIds: ['login-page' as never],
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(
        /^#use-jwt: "Use JWT"\n {2}Rationale: Stateless auth\n {2}Relates to: #login-page$/mu,
      );
    });

    it('VALID: {quest: decision without relatedNodeIds} => omits Relates to line', () => {
      const quest = QuestStub({
        designDecisions: [DesignDecisionStub({ relatedNodeIds: [] })],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(
        /^#use-jwt-auth: "Use JWT for authentication tokens"\n {2}Rationale: JWT allows stateless auth with built-in expiration\n\n## Contracts$/mu,
      );
    });
  });

  describe('contracts', () => {
    it('EMPTY: {quest: no contracts} => shows (none)', () => {
      const quest = QuestStub({ contracts: [] });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/^## Contracts\n\n\(none\)$/mu);
    });

    it('VALID: {quest: with contract entry} => renders contract header and properties', () => {
      const quest = QuestStub({
        contracts: [
          QuestContractEntryStub({
            id: 'login-creds' as never,
            name: 'LoginCredentials' as never,
            kind: 'data',
            status: 'new',
            properties: [
              {
                name: 'email' as never,
                type: 'EmailAddress' as never,
                description: 'User email' as never,
              },
            ],
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(
        /^#login-creds \u2014 LoginCredentials \(data, new\) \[\u2192 packages\/shared\/src\/contracts\/login-credentials\/login-credentials-contract\.ts\]$/mu,
      );
      expect(result).toMatch(/^ {2}email: EmailAddress \u2014 User email$/mu);
    });

    it('VALID: {quest: contract with source} => renders source reference', () => {
      const quest = QuestStub({
        contracts: [
          QuestContractEntryStub({
            source: 'src/contracts/user.ts' as never,
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(
        /^#login-credentials \u2014 LoginCredentials \(data, new\) \[\u2192 src\/contracts\/user\.ts\]$/mu,
      );
    });
  });

  describe('tooling', () => {
    it('EMPTY: {quest: no tooling} => shows (none)', () => {
      const quest = QuestStub({ toolingRequirements: [] });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/^## Tooling\n\n\(none\)$/mu);
    });

    it('VALID: {quest: with tooling requirement} => renders tooling entry', () => {
      const quest = QuestStub({
        toolingRequirements: [
          ToolingRequirementStub({
            id: 'pg-driver' as never,
            name: 'PostgreSQL Driver' as never,
            packageName: 'pg' as never,
            reason: 'DB access' as never,
            requiredByObservables: ['obs-one' as never],
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/^#pg-driver: "PostgreSQL Driver" \(pg\)$/mu);
      expect(result).toMatch(/^ {2}Reason: DB access$/mu);
      expect(result).toMatch(/^ {2}Used by: #obs-one$/mu);
    });
  });

  describe('packages affected', () => {
    it('EMPTY: {quest: no packages declared} => shows (none), because an empty tag list is a real answer a reader has to see', () => {
      const quest = QuestStub({ packagesAffected: [] });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/^## Packages Affected\n\n\(none\)$/mu);
    });

    it('VALID: {an edit entry} => renders the name, what the quest does to it, its kind and its root', () => {
      const quest = QuestStub({
        packagesAffected: [
          QuestPackageEntryStub({
            name: 'ui-app' as never,
            location: './packages/ui-app' as never,
            changeType: 'edit',
            packageType: 'frontend-react',
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/^ui-app — edit, frontend-react \[\.\/packages\/ui-app\]$/mu);
    });

    it("VALID: {a 'new' entry carrying usedBy} => renders its consumers, the only reverse edges a package with no manifest has", () => {
      const quest = QuestStub({
        packagesAffected: [
          QuestPackageEntryStub({
            name: 'groundstomp' as never,
            location: './packages/groundstomp' as never,
            changeType: 'new',
            packageType: 'programmatic-service',
            usedBy: ['ui-app' as never, 'api-service' as never],
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(
        /^groundstomp — new, programmatic-service \[\.\/packages\/groundstomp\]$/mu,
      );
      expect(result).toMatch(/^ {2}Used by: ui-app, api-service$/mu);
    });

    it('EMPTY: {an entry whose usedBy is an empty list} => renders no Used by line at all', () => {
      const quest = QuestStub({
        packagesAffected: [
          QuestPackageEntryStub({
            name: 'core-lib' as never,
            location: './packages/core-lib' as never,
            changeType: 'edit',
            packageType: 'library',
            usedBy: [],
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });
      const usedByLines = result.split('\n').filter((line) => line.startsWith('  Used by: '));

      expect(usedByLines).toStrictEqual([]);
    });
  });

  describe('flows', () => {
    it('VALID: {quest: with simple flow} => renders flow header and graph', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow' as never,
            name: 'Login Flow' as never,
            scope: 'authentication' as never,
            entryPoint: 'login-page' as never,
            exitPoints: ['dashboard' as never],
            nodes: [
              FlowNodeStub({
                id: 'login-page' as never,
                label: 'Login Page' as never,
                type: 'state',
                observables: [
                  FlowObservableStub({
                    id: 'shows-form' as never,
                    description: 'shows login form' as never,
                    type: 'ui-state',
                  }),
                ],
              }),
            ],
            edges: [],
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/^## Flow: #login-flow \u2014 "Login Flow"$/mu);
      expect(result).toMatch(/^Scope: authentication$/mu);
      expect(result).toMatch(/^Entry: login-page \| Exits: dashboard$/mu);
      expect(result).toMatch(/^\[#login-page\] Login Page \(state\)$/mu);
      expect(result).toMatch(/^ {2}> #shows-form: shows login form \[ui-state\]$/mu);
    });

    it('VALID: {quest: flow without scope} => omits scope line', () => {
      const quest = QuestStub({
        flows: [FlowStub()],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(
        /^## Flow: #login-flow \u2014 "Login Flow"\nEntry: \/login \| Exits: \/dashboard$/mu,
      );
    });
  });

  // `format: 'text'` is what every get-quest returns by default, so this composed render is where
  // an agent reads its own track. A verdict that only exists in the JSON is invisible to it.
  describe('sign-offs and observable provenance', () => {
    it('VALID: {node signed by one track} => the node line carries that track mark alone', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            entryPoint: 'login-page' as never,
            nodes: [
              FlowNodeStub({
                id: 'login-page' as never,
                label: 'Login Page' as never,
                type: 'state',
                flowriderSignoff: SignoffStub(),
              }),
            ],
            edges: [],
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/^\[#login-page\] Login Page \(state\) \[F\u2713\]$/mu);
    });

    it('VALID: {node signed by both tracks} => the node line carries both marks', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            entryPoint: 'login-page' as never,
            nodes: [
              FlowNodeStub({
                id: 'login-page' as never,
                label: 'Login Page' as never,
                type: 'state',
                flowriderSignoff: SignoffStub(),
                siegemasterSignoff: SignoffStub(),
              }),
            ],
            edges: [],
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/^\[#login-page\] Login Page \(state\) \[F\u2713 S\u2713\]$/mu);
    });

    it('VALID: {observable unconfirmable and added mid-quest} => provenance then the verdict mark', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            entryPoint: 'login-page' as never,
            nodes: [
              FlowNodeStub({
                id: 'login-page' as never,
                label: 'Login Page' as never,
                type: 'state',
                observables: [
                  FlowObservableStub({
                    id: 'crash-on-bleh' as never,
                    description: 'returns 400 for a non-JSON body' as never,
                    type: 'api-call',
                    addedBy: 'siegemaster',
                    siegemasterSignoff: SignoffStub({
                      verdict: 'unconfirmable',
                      evidence: 'the endpoint 500s before any validation runs',
                      question: 'Should the router reject a non-JSON body before the handler?',
                    }),
                  }),
                ],
              }),
            ],
            edges: [],
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(
        /^ {2}> #crash-on-bleh: returns 400 for a non-JSON body \[api-call\] \+siegemaster \[S\?\]$/mu,
      );
    });

    it('VALID: {signed off-map family} => the flow section ends with an off-map line', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            entryPoint: 'login-page' as never,
            nodes: [
              FlowNodeStub({
                id: 'login-page' as never,
                label: 'Login Page' as never,
                type: 'state',
              }),
            ],
            edges: [],
            offMapSignoffs: [
              FlowOffMapSignoffStub({ id: 'concurrency', siegemasterSignoff: SignoffStub() }),
              FlowOffMapSignoffStub({ id: 'perf' }),
            ],
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/^off-map: concurrency \[S\u2713\]$/mu);
    });
  });

  // The regression guard for the whole feature: a quest that has recorded no sign-offs must render
  // byte-for-byte as it does without one. No markers, no empty brackets, no provenance suffix on a
  // spec observable, and no off-map line for families nobody signed.
  describe('regression: a quest with zero sign-offs renders unchanged', () => {
    it('EMPTY: {no sign-offs anywhere} => the complete render carries no marker of any kind', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            entryPoint: 'login-page' as never,
            nodes: [
              FlowNodeStub({
                id: 'login-page' as never,
                label: 'Login Page' as never,
                type: 'state',
                observables: [
                  FlowObservableStub({
                    id: 'shows-form' as never,
                    description: 'shows login form' as never,
                    type: 'ui-state',
                  }),
                ],
              }),
            ],
            edges: [],
            offMapSignoffs: [
              FlowOffMapSignoffStub({ id: 'concurrency' }),
              FlowOffMapSignoffStub({ id: 'perf' }),
            ],
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toBe(
        [
          ...textDisplaySymbolsStatics.legendLines,
          '',
          '# Quest: Add Authentication',
          'Status: in_progress',
          '',
          '## Design Decisions',
          '',
          '(none)',
          '',
          '## Contracts',
          '',
          '(none)',
          '',
          '## Tooling',
          '',
          '(none)',
          '',
          '## Packages Affected',
          '',
          '(none)',
          '',
          '## Flow: #login-flow \u2014 "Login Flow"',
          'Entry: login-page | Exits: /dashboard',
          '',
          '[#login-page] Login Page (state)',
          '  > #shows-form: shows login form [ui-state]',
          '  (terminal)',
          '',
          '## Operations',
          '',
          '(none)',
        ].join('\n'),
      );
    });
  });

  describe('operations', () => {
    it('EMPTY: {quest: no operations} => shows (none)', () => {
      const quest = QuestStub({ operations: [] });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/^## Operations\n\n\(none\)$/mu);
    });

    it('VALID: {quest: with codeweaver operation} => renders role, text, and status', () => {
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' as never,
            role: 'codeweaver',
            text: 'core: config load+validate adapter' as never,
            status: 'pending',
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(
        /^#a1b2c3d4-58cc-4372-a567-0e02b2c3d479: \[codeweaver\] core: config load\+validate adapter — pending$/mu,
      );
    });

    it('VALID: {quest: with locked ward operation} => renders wardMode and locked marker', () => {
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' as never,
            role: 'ward',
            text: 'ward gate' as never,
            status: 'in_progress',
            locked: true,
            wardMode: 'changed',
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(
        /^#a1b2c3d4-58cc-4372-a567-0e02b2c3d479: \[ward \(changed\)\] ward gate — in_progress \[locked\]$/mu,
      );
    });

    it('VALID: {operation with packageNames} => renders the packages part after the flows part', () => {
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' as never,
            role: 'flowrider',
            text: 'author the suites' as never,
            status: 'pending',
            flowIds: ['send-comment'],
            packageNames: ['web', 'server'],
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(
        /^#a1b2c3d4-58cc-4372-a567-0e02b2c3d479: \[flowrider\] author the suites — pending \[flows: #send-comment\] \[packages: web, server\]$/mu,
      );
    });

    it('VALID: {operation with packageNames and no flowIds} => renders the packages part alone', () => {
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' as never,
            role: 'codeweaver',
            text: 'shared: the entry contract' as never,
            status: 'pending',
            packageNames: ['shared'],
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(
        /^#a1b2c3d4-58cc-4372-a567-0e02b2c3d479: \[codeweaver\] shared: the entry contract — pending \[packages: shared\]$/mu,
      );
    });

    it('EMPTY: {operation with empty packageNames} => renders no packages part at all', () => {
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' as never,
            role: 'codeweaver',
            text: 'shared: the entry contract' as never,
            status: 'pending',
            packageNames: [],
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(
        /^#a1b2c3d4-58cc-4372-a567-0e02b2c3d479: \[codeweaver\] shared: the entry contract — pending$/mu,
      );
    });
  });

  describe('quest notes', () => {
    it('VALID: {quest: two notes of different kinds} => renders both, scope lines only on the scoped one', () => {
      const quest = QuestStub({
        planningNotes: {
          questNotes: [
            QuestNoteStub({
              id: 'open-question-anchor-scope',
              kind: 'open-question',
              role: 'siegemaster',
              flowId: 'view-comments',
              unitId: 'view-comments:observable:badge-count',
              summary: 'Notify per box or once per batch',
              detail: 'The batch send drops stale boxes',
            }),
            QuestNoteStub({
              id: 'tooling-error-browser-bridge',
              kind: 'tooling-error',
              role: 'flowrider',
              flowId: undefined,
              unitId: undefined,
              summary: 'Browser bridge never attached',
              detail: 'Chrome launched but the port stayed closed',
            }),
          ],
        },
      });

      const result = questToTextDisplayTransformer({ quest });
      const flowLines = result.split('\n').filter((line) => line.startsWith('  Flow: '));
      const unitLines = result.split('\n').filter((line) => line.startsWith('  Unit: '));

      expect(result).toMatch(
        /^## Quest Notes\n\n#open-question-anchor-scope: \[open-question\] siegemaster — Notify per box or once per batch\n {2}Detail: The batch send drops stale boxes\n {2}Flow: #view-comments\n {2}Unit: view-comments:observable:badge-count\n#tooling-error-browser-bridge: \[tooling-error\] flowrider — Browser bridge never attached\n {2}Detail: Chrome launched but the port stayed closed$/mu,
      );
      // The regex's `$` is end-of-LINE under /m, so it alone would still match if the unscoped note
      // emitted its own Flow/Unit lines. These two assert the whole render carries exactly one of
      // each — the second note contributed neither.
      expect(flowLines).toStrictEqual(['  Flow: #view-comments']);
      expect(unitLines).toStrictEqual(['  Unit: view-comments:observable:badge-count']);
    });

    it('EMPTY: {quest: no quest notes} => renders no Quest Notes header at all', () => {
      const quest = QuestStub();

      const result = questToTextDisplayTransformer({ quest });
      const headers = result.split('\n').filter((line) => line.startsWith('## '));

      expect(headers).toStrictEqual([
        '## Design Decisions',
        '## Contracts',
        '## Tooling',
        '## Packages Affected',
        '## Flow: #login-flow — "Login Flow"',
        '## Operations',
      ]);
    });

    it('VALID: {stage: spec, notes present} => omits Quest Notes because spec excludes planningNotes', () => {
      const quest = QuestStub({
        planningNotes: { questNotes: [QuestNoteStub({ id: 'open-question-anchor-scope' })] },
      });

      const result = questToTextDisplayTransformer({ quest, stage: 'spec' });
      const headers = result.split('\n').filter((line) => line.startsWith('## '));

      expect(headers).toStrictEqual([
        '## Design Decisions',
        '## Contracts',
        '## Tooling',
        '## Packages Affected',
        '## Flow: #login-flow — "Login Flow"',
        '## Operations',
      ]);
    });

    it('VALID: {stage: planning, notes present} => renders Quest Notes alongside the planning sections', () => {
      const quest = QuestStub({
        planningNotes: { questNotes: [QuestNoteStub({ id: 'open-question-anchor-scope' })] },
      });

      const result = questToTextDisplayTransformer({ quest, stage: 'planning' });
      const headers = result.split('\n').filter((line) => line.startsWith('## '));

      expect(headers).toStrictEqual([
        '## Contracts',
        '## Packages Affected',
        '## Operations',
        '## Quest Notes',
      ]);
    });
  });

  describe('stage filtering (a filtered-out section is omitted, not rendered as empty)', () => {
    it('VALID: {stage: spec} => renders the spec sections including Operations, and omits planningNotes', () => {
      // A staged get-quest response empties the excluded sections, so the renderer cannot tell
      // "filtered out" from "genuinely empty" without the stage — and would print "(none)".
      const quest = QuestStub({ operations: [] });

      const result = questToTextDisplayTransformer({ quest, stage: 'spec' });
      const headers = result.split('\n').filter((line) => line.startsWith('## '));

      expect(headers).toStrictEqual([
        '## Design Decisions',
        '## Contracts',
        '## Tooling',
        '## Packages Affected',
        '## Flow: #login-flow — "Login Flow"',
        '## Operations',
      ]);
    });

    it('VALID: {stage: planning} => renders exactly the planning sections', () => {
      const quest = QuestStub();

      const result = questToTextDisplayTransformer({ quest, stage: 'planning' });
      const headers = result.split('\n').filter((line) => line.startsWith('## '));

      expect(headers).toStrictEqual(['## Contracts', '## Packages Affected', '## Operations']);
    });

    it('VALID: {stage: implementation} => renders exactly the implementation sections', () => {
      const quest = QuestStub();

      const result = questToTextDisplayTransformer({ quest, stage: 'implementation' });
      const headers = result.split('\n').filter((line) => line.startsWith('## '));

      expect(headers).toStrictEqual([
        '## Design Decisions',
        '## Contracts',
        '## Tooling',
        '## Packages Affected',
        '## Flow: #login-flow — "Login Flow"',
        '## Operations',
      ]);
    });

    it('EDGE: {no stage} => every section renders, including a genuinely empty operations ledger', () => {
      const quest = QuestStub({ operations: [] });

      const result = questToTextDisplayTransformer({ quest });
      const headers = result.split('\n').filter((line) => line.startsWith('## '));

      expect(headers).toStrictEqual([
        '## Design Decisions',
        '## Contracts',
        '## Tooling',
        '## Packages Affected',
        '## Flow: #login-flow — "Login Flow"',
        '## Operations',
      ]);
      expect(result).toMatch(/^## Operations\n\n\(none\)$/mu);
    });
  });
});
