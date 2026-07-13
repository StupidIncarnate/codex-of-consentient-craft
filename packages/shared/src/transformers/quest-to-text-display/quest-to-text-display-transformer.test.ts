import { QuestStub } from '../../contracts/quest/quest.stub';
import { DesignDecisionStub } from '../../contracts/design-decision/design-decision.stub';
import { FlowStub } from '../../contracts/flow/flow.stub';
import { FlowNodeStub } from '../../contracts/flow-node/flow-node.stub';
import { FlowObservableStub } from '../../contracts/flow-observable/flow-observable.stub';
import { OperationItemStub } from '../../contracts/operation-item/operation-item.stub';
import { QuestContractEntryStub } from '../../contracts/quest-contract-entry/quest-contract-entry.stub';
import { ToolingRequirementStub } from '../../contracts/tooling-requirement/tooling-requirement.stub';
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
  });
});
