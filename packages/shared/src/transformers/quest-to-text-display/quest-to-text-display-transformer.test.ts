import { QuestStub } from '../../contracts/quest/quest.stub';
import { DesignDecisionStub } from '../../contracts/design-decision/design-decision.stub';
import { FlowStub } from '../../contracts/flow/flow.stub';
import { FlowNodeStub } from '../../contracts/flow-node/flow-node.stub';
import { FlowObservableStub } from '../../contracts/flow-observable/flow-observable.stub';
import { DependencyStepStub } from '../../contracts/dependency-step/dependency-step.stub';
import { QuestContractEntryStub } from '../../contracts/quest-contract-entry/quest-contract-entry.stub';
import { ToolingRequirementStub } from '../../contracts/tooling-requirement/tooling-requirement.stub';
import { questToTextDisplayTransformer } from './quest-to-text-display-transformer';

describe('questToTextDisplayTransformer', () => {
  describe('legend', () => {
    it('VALID: {quest: minimal} => output starts with legend block', () => {
      const quest = QuestStub();

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/^---\nKEY:/u);
      expect(result).toMatch(/---\n\n# Quest:/u);
    });
  });

  describe('header', () => {
    it('VALID: {quest: with title and status} => renders title and status', () => {
      const quest = QuestStub({ title: 'Add Auth' as never, status: 'in_progress' });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/# Quest: Add Auth\nStatus: in_progress/u);
    });
  });

  describe('design decisions', () => {
    it('EMPTY: {quest: no decisions} => shows (none)', () => {
      const quest = QuestStub({ designDecisions: [] });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/## Design Decisions\n\n\(none\)/u);
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
        /#use-jwt: "Use JWT"\n {2}Rationale: Stateless auth\n {2}Relates to: #login-page/u,
      );
    });

    it('VALID: {quest: decision without relatedNodeIds} => omits Relates to line', () => {
      const quest = QuestStub({
        designDecisions: [DesignDecisionStub({ relatedNodeIds: [] })],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).not.toMatch(/Relates to:/u);
    });
  });

  describe('contracts', () => {
    it('EMPTY: {quest: no contracts} => shows (none)', () => {
      const quest = QuestStub({ contracts: [] });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/## Contracts\n\n\(none\)/u);
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

      expect(result).toMatch(/#login-creds \u2014 LoginCredentials \(data, new\)/u);
      expect(result).toMatch(/ {2}email: EmailAddress/u);
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

      expect(result).toMatch(/\[\u2192 src\/contracts\/user\.ts\]/u);
    });
  });

  describe('tooling', () => {
    it('EMPTY: {quest: no tooling} => shows (none)', () => {
      const quest = QuestStub({ toolingRequirements: [] });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/## Tooling\n\n\(none\)/u);
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

      expect(result).toMatch(/#pg-driver: "PostgreSQL Driver" \(pg\)/u);
      expect(result).toMatch(/ {2}Reason: DB access/u);
      expect(result).toMatch(/ {2}Used by: #obs-one/u);
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

      expect(result).toMatch(/## Flow: #login-flow \u2014 "Login Flow"/u);
      expect(result).toMatch(/Scope: authentication/u);
      expect(result).toMatch(/Entry: login-page \| Exits: dashboard/u);
      expect(result).toMatch(/\[#login-page\] Login Page \(state\)/u);
      expect(result).toMatch(/> #shows-form: shows login form \[ui-state\]/u);
    });

    it('VALID: {quest: flow without scope} => omits scope line', () => {
      const quest = QuestStub({
        flows: [FlowStub()],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).not.toMatch(/Scope:/u);
    });
  });

  describe('steps', () => {
    it('EMPTY: {quest: no steps} => shows (none)', () => {
      const quest = QuestStub({ steps: [] });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/## Steps\n\n\(none\)/u);
    });

    it('VALID: {quest: with full step} => renders step header, assertions, focus, and accompanying', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            id: 'create-api' as never,
            name: 'Create API' as never,
            assertions: [
              {
                prefix: 'VALID',
                input: '{user: validUser}',
                expected: 'creates user',
              } as never,
            ],
            observablesSatisfied: ['api-responds' as never],
            dependsOn: ['setup-db' as never],
            focusFile: {
              path: 'src/brokers/api/create/api-create-broker.ts',
              action: 'create',
            } as never,
            accompanyingFiles: [
              {
                path: 'src/brokers/api/create/api-create-broker.test.ts',
                action: 'create',
              } as never,
            ],
            exportName: 'apiHandler' as never,
            inputContracts: ['RequestBody' as never],
            outputContracts: ['ApiResponse' as never],
            uses: ['userContract' as never],
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/#create-api: "Create API"/u);
      expect(result).toMatch(/ {2}Assertions: VALID: \{user: validUser\} => creates user/u);
      expect(result).toMatch(
        / {2}Focus: src\/brokers\/api\/create\/api-create-broker\.ts \(create\)/u,
      );
      expect(result).toMatch(
        / {2}Accompanying: src\/brokers\/api\/create\/api-create-broker\.test\.ts \(create\)/u,
      );
      expect(result).toMatch(/ {2}Satisfies: #api-responds/u);
    });

    it('VALID: {quest: with full step} => renders dependencies, export, contracts, and uses', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            id: 'create-api' as never,
            name: 'Create API' as never,
            assertions: [
              {
                prefix: 'VALID',
                input: '{user: validUser}',
                expected: 'creates user',
              } as never,
            ],
            observablesSatisfied: ['api-responds' as never],
            dependsOn: ['setup-db' as never],
            focusFile: {
              path: 'src/brokers/api/create/api-create-broker.ts',
              action: 'create',
            } as never,
            accompanyingFiles: [
              {
                path: 'src/brokers/api/create/api-create-broker.test.ts',
                action: 'create',
              } as never,
            ],
            exportName: 'apiHandler' as never,
            inputContracts: ['RequestBody' as never],
            outputContracts: ['ApiResponse' as never],
            uses: ['userContract' as never],
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).toMatch(/ {2}Depends on: #setup-db/u);
      expect(result).toMatch(/ {2}Export: apiHandler/u);
      expect(result).toMatch(/ {2}Contracts in: RequestBody \| out: ApiResponse/u);
      expect(result).toMatch(/ {2}Uses: userContract/u);
    });

    it('VALID: {quest: step with no optional fields} => omits satisfies, depends, accompanying, uses', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            observablesSatisfied: [],
            dependsOn: [],
            accompanyingFiles: [],
            uses: [],
          }),
        ],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).not.toMatch(/Satisfies:/u);
      expect(result).not.toMatch(/Depends on:/u);
      expect(result).not.toMatch(/Accompanying:/u);
      expect(result).not.toMatch(/Uses:/u);
    });

    it('VALID: {quest: step without exportName} => omits export line', () => {
      const quest = QuestStub({
        steps: [DependencyStepStub()],
      });

      const result = questToTextDisplayTransformer({ quest });

      expect(result).not.toMatch(/Export:/u);
    });
  });
});
