import { IsoTimestampStub } from '../../contracts/iso-timestamp/iso-timestamp.stub';
import { smoketestCaseCatalogStatics } from '../../statics/smoketest-case-catalog/smoketest-case-catalog-statics';
import { smoketestPromptsStatics } from '../../statics/smoketest-prompts/smoketest-prompts-statics';
import { caseCatalogToBlueprintTransformer } from './case-catalog-to-blueprint-transformer';
import { caseCatalogToBlueprintTransformerProxy } from './case-catalog-to-blueprint-transformer.proxy';

const NOW = IsoTimestampStub({ value: '2024-01-15T10:00:00.000Z' });

describe('caseCatalogToBlueprintTransformer', () => {
  describe('signals suite', () => {
    it('VALID: {3 signal cases} => blueprint carries one codeweaver operation item per case', () => {
      const proxy = caseCatalogToBlueprintTransformerProxy();
      proxy.setupUuids({
        uuids: [
          '00000000-0000-4000-8000-0000000000a1',
          '00000000-0000-4000-8000-0000000000b1',
          '00000000-0000-4000-8000-0000000000a2',
          '00000000-0000-4000-8000-0000000000b2',
          '00000000-0000-4000-8000-0000000000a3',
          '00000000-0000-4000-8000-0000000000b3',
        ],
      });

      const result = caseCatalogToBlueprintTransformer({
        suite: 'signals',
        cases: [
          {
            caseId: 'signal-a',
            name: 'Signal: a',
            promptKey: 'signalComplete',
            expectedSignal: 'complete',
          },
          {
            caseId: 'signal-b',
            name: 'Signal: b',
            promptKey: 'signalComplete',
            expectedSignal: 'complete',
          },
          {
            caseId: 'signal-c',
            name: 'Signal: c',
            promptKey: 'signalComplete',
            expectedSignal: 'complete',
          },
        ],
        now: NOW,
      });

      expect(result.blueprint.operations).toStrictEqual([
        {
          id: '00000000-0000-4000-8000-0000000000a1',
          role: 'codeweaver',
          text: 'Signal: a',
          status: 'pending',
          locked: false,
        },
        {
          id: '00000000-0000-4000-8000-0000000000a2',
          role: 'codeweaver',
          text: 'Signal: b',
          status: 'pending',
          locked: false,
        },
        {
          id: '00000000-0000-4000-8000-0000000000a3',
          role: 'codeweaver',
          text: 'Signal: c',
          status: 'pending',
          locked: false,
        },
      ]);
    });

    it('VALID: {3 signal cases} => 3 linearly-chained codeweaver work items each linked to its operation item', () => {
      const proxy = caseCatalogToBlueprintTransformerProxy();
      proxy.setupUuids({
        uuids: [
          '00000000-0000-4000-8000-0000000000a1',
          '00000000-0000-4000-8000-0000000000b1',
          '00000000-0000-4000-8000-0000000000a2',
          '00000000-0000-4000-8000-0000000000b2',
          '00000000-0000-4000-8000-0000000000a3',
          '00000000-0000-4000-8000-0000000000b3',
        ],
      });

      const result = caseCatalogToBlueprintTransformer({
        suite: 'signals',
        cases: [
          {
            caseId: 'signal-a',
            name: 'Signal: a',
            promptKey: 'signalComplete',
            expectedSignal: 'complete',
          },
          {
            caseId: 'signal-b',
            name: 'Signal: b',
            promptKey: 'signalComplete',
            expectedSignal: 'complete',
          },
          {
            caseId: 'signal-c',
            name: 'Signal: c',
            promptKey: 'signalComplete',
            expectedSignal: 'complete',
          },
        ],
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
          id: '00000000-0000-4000-8000-0000000000b1',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          dependsOn: [],
          relatedDataItems: ['operations/00000000-0000-4000-8000-0000000000a1'],
          smoketestPromptOverride: smoketestPromptsStatics.signalComplete,
          smoketestExpectedSignal: 'complete',
        },
        {
          id: '00000000-0000-4000-8000-0000000000b2',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          dependsOn: ['00000000-0000-4000-8000-0000000000b1'],
          relatedDataItems: ['operations/00000000-0000-4000-8000-0000000000a2'],
          smoketestPromptOverride: smoketestPromptsStatics.signalComplete,
          smoketestExpectedSignal: 'complete',
        },
        {
          id: '00000000-0000-4000-8000-0000000000b3',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          dependsOn: ['00000000-0000-4000-8000-0000000000b2'],
          relatedDataItems: ['operations/00000000-0000-4000-8000-0000000000a3'],
          smoketestPromptOverride: smoketestPromptsStatics.signalComplete,
          smoketestExpectedSignal: 'complete',
        },
      ]);
    });

    it('VALID: {signals suite} => blueprint title/userRequest/skipRoles identify the suite and skip the relay tail', () => {
      const proxy = caseCatalogToBlueprintTransformerProxy();
      proxy.setupUuids({
        uuids: ['00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000b1'],
      });

      const result = caseCatalogToBlueprintTransformer({
        suite: 'signals',
        cases: [
          {
            caseId: 'signal-a',
            name: 'Signal: a',
            promptKey: 'signalComplete',
            expectedSignal: 'complete',
          },
        ],
        now: NOW,
      });

      expect({
        title: result.blueprint.title,
        userRequest: result.blueprint.userRequest,
        skipRoles: result.blueprint.skipRoles,
      }).toStrictEqual({
        title: 'Smoketest: Signals',
        userRequest: 'Emit a scripted signal-back once per case',
        skipRoles: ['ward', 'flowrider', 'siegemaster', 'lawbringer', 'blightwarden'],
      });
    });
  });

  describe('mcp suite', () => {
    it('VALID: {mcp suite, 2 cases} => 2 codeweaver work items chained via dependsOn to previous work item id', () => {
      const proxy = caseCatalogToBlueprintTransformerProxy();
      proxy.setupUuids({
        uuids: [
          '00000000-0000-4000-8000-0000000000c1',
          '00000000-0000-4000-8000-0000000000d1',
          '00000000-0000-4000-8000-0000000000c2',
          '00000000-0000-4000-8000-0000000000d2',
        ],
      });

      const twoMcpCases = smoketestCaseCatalogStatics.mcp.slice(0, 2);

      const result = caseCatalogToBlueprintTransformer({
        suite: 'mcp',
        cases: twoMcpCases,
        now: NOW,
      });

      expect({
        title: result.blueprint.title,
        operationCount: result.blueprint.operations.length,
        operationRoles: result.blueprint.operations.map((op) => op.role),
        operationTexts: result.blueprint.operations.map((op) => op.text),
        workItemCount: result.workItems.length,
        workItemRoles: result.workItems.map((wi) => wi.role),
        workItemDeps: result.workItems.map((wi) => wi.dependsOn),
        workItemLinks: result.workItems.map((wi) => wi.relatedDataItems),
      }).toStrictEqual({
        title: 'Smoketest: MCP',
        operationCount: 2,
        operationRoles: ['codeweaver', 'codeweaver'],
        operationTexts: twoMcpCases.map((c) => c.name),
        workItemCount: 2,
        workItemRoles: ['codeweaver', 'codeweaver'],
        workItemDeps: [[], ['00000000-0000-4000-8000-0000000000d1']],
        workItemLinks: [
          ['operations/00000000-0000-4000-8000-0000000000c1'],
          ['operations/00000000-0000-4000-8000-0000000000c2'],
        ],
      });
    });
  });

  describe('unknown promptKey', () => {
    it('ERROR: {case with promptKey not in smoketestPromptsStatics} => throws descriptive error', () => {
      const proxy = caseCatalogToBlueprintTransformerProxy();
      proxy.setupUuids({
        uuids: ['00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000e2'],
      });

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
