import { IsoTimestampStub } from '../../contracts/iso-timestamp/iso-timestamp.stub';
import { smoketestCaseCatalogStatics } from '../../statics/smoketest-case-catalog/smoketest-case-catalog-statics';
import { smoketestPromptsStatics } from '../../statics/smoketest-prompts/smoketest-prompts-statics';
import { caseCatalogToBlueprintTransformer } from './case-catalog-to-blueprint-transformer';
import { caseCatalogToBlueprintTransformerProxy } from './case-catalog-to-blueprint-transformer.proxy';

const NOW = IsoTimestampStub({ value: '2024-01-15T10:00:00.000Z' });

describe('caseCatalogToBlueprintTransformer', () => {
  describe('signals suite', () => {
    it('VALID: {3 signal cases} => produces blueprint with 3 chained steps whose ids, names, dependsOn, and focusFile are all case-derived', () => {
      const proxy = caseCatalogToBlueprintTransformerProxy();
      proxy.setupUuids({
        uuids: [
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000002',
          '00000000-0000-4000-8000-000000000003',
        ],
      });

      const result = caseCatalogToBlueprintTransformer({
        suite: 'signals',
        cases: smoketestCaseCatalogStatics.signals,
        now: NOW,
      });

      expect(
        result.blueprint.steps.map((step) => ({
          id: step.id,
          name: step.name,
          dependsOn: step.dependsOn,
          focusFilePath: step.focusFile?.path,
        })),
      ).toStrictEqual([
        {
          id: 'case-signal-complete',
          name: 'Signal: complete',
          dependsOn: [],
          focusFilePath:
            'packages/orchestrator/src/statics/smoketest-case-catalog/smoketest-case-catalog-statics.ts',
        },
        {
          id: 'case-signal-failed',
          name: 'Signal: failed',
          dependsOn: ['case-signal-complete'],
          focusFilePath:
            'packages/orchestrator/src/statics/smoketest-case-catalog/smoketest-case-catalog-statics.ts',
        },
        {
          id: 'case-signal-failed-replan',
          name: 'Signal: failed-replan',
          dependsOn: ['case-signal-failed'],
          focusFilePath:
            'packages/orchestrator/src/statics/smoketest-case-catalog/smoketest-case-catalog-statics.ts',
        },
      ]);
    });

    it('VALID: {3 signal cases} => produces 3 linearly-chained codeweaver work items each stamped with its case promptKey-resolved prompt', () => {
      const proxy = caseCatalogToBlueprintTransformerProxy();
      proxy.setupUuids({
        uuids: [
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000002',
          '00000000-0000-4000-8000-000000000003',
        ],
      });

      const result = caseCatalogToBlueprintTransformer({
        suite: 'signals',
        cases: smoketestCaseCatalogStatics.signals,
        now: NOW,
      });

      expect(
        result.workItems.map((wi) => ({
          id: wi.id,
          role: wi.role,
          status: wi.status,
          spawnerType: wi.spawnerType,
          dependsOn: wi.dependsOn,
          relatedDataItems: wi.relatedDataItems,
          smoketestPromptOverride: wi.smoketestPromptOverride,
          smoketestExpectedSignal: wi.smoketestExpectedSignal,
        })),
      ).toStrictEqual([
        {
          id: '00000000-0000-4000-8000-000000000001',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          dependsOn: [],
          relatedDataItems: ['steps/case-signal-complete'],
          smoketestPromptOverride: smoketestPromptsStatics.signalComplete,
          smoketestExpectedSignal: 'complete',
        },
        {
          id: '00000000-0000-4000-8000-000000000002',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          dependsOn: ['00000000-0000-4000-8000-000000000001'],
          relatedDataItems: ['steps/case-signal-failed'],
          smoketestPromptOverride: smoketestPromptsStatics.signalFailed,
          smoketestExpectedSignal: 'failed',
        },
        {
          id: '00000000-0000-4000-8000-000000000003',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          dependsOn: ['00000000-0000-4000-8000-000000000002'],
          relatedDataItems: ['steps/case-signal-failed-replan'],
          smoketestPromptOverride: smoketestPromptsStatics.signalFailedReplan,
          smoketestExpectedSignal: 'failed-replan',
        },
      ]);
    });

    it('VALID: {signals suite} => blueprint title/userRequest/skipRoles identify the suite and skip non-codeweaver roles', () => {
      const proxy = caseCatalogToBlueprintTransformerProxy();
      proxy.setupUuids({
        uuids: [
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000002',
          '00000000-0000-4000-8000-000000000003',
        ],
      });

      const result = caseCatalogToBlueprintTransformer({
        suite: 'signals',
        cases: smoketestCaseCatalogStatics.signals,
        now: NOW,
      });

      expect({
        title: result.blueprint.title,
        userRequest: result.blueprint.userRequest,
        skipRoles: result.blueprint.skipRoles,
      }).toStrictEqual({
        title: 'Smoketest: Signals',
        userRequest: 'Emit each scripted signal (complete / failed / failed-replan) once',
        skipRoles: ['ward', 'siegemaster', 'lawbringer', 'blightwarden'],
      });
    });
  });

  describe('mcp suite', () => {
    it('VALID: {mcp suite, 2 cases} => 2 codeweaver work items chained via dependsOn to previous work item id', () => {
      const proxy = caseCatalogToBlueprintTransformerProxy();
      proxy.setupUuids({
        uuids: ['00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000b2'],
      });

      const twoMcpCases = smoketestCaseCatalogStatics.mcp.slice(0, 2);

      const result = caseCatalogToBlueprintTransformer({
        suite: 'mcp',
        cases: twoMcpCases,
        now: NOW,
      });

      expect({
        title: result.blueprint.title,
        stepCount: result.blueprint.steps.length,
        workItemCount: result.workItems.length,
        workItemRoles: result.workItems.map((wi) => wi.role),
        workItemDeps: result.workItems.map((wi) => wi.dependsOn),
      }).toStrictEqual({
        title: 'Smoketest: MCP',
        stepCount: 2,
        workItemCount: 2,
        workItemRoles: ['codeweaver', 'codeweaver'],
        workItemDeps: [[], ['00000000-0000-4000-8000-0000000000b1']],
      });
    });
  });

  describe('unknown promptKey', () => {
    it('ERROR: {case with promptKey not in smoketestPromptsStatics} => throws descriptive error', () => {
      const proxy = caseCatalogToBlueprintTransformerProxy();
      proxy.setupUuids({ uuids: ['00000000-0000-4000-8000-0000000000cc'] });

      expect(() =>
        caseCatalogToBlueprintTransformer({
          suite: 'signals',
          cases: [
            {
              caseId: 'bogus',
              name: 'Bogus',
              promptKey: 'not-a-real-key',
              expectedSignal: 'complete',
            },
          ],
          now: NOW,
        }),
      ).toThrow(/no prompt found for promptKey "not-a-real-key"/u);
    });
  });
});
