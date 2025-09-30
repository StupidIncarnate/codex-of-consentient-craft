import type { Rule } from 'eslint';
import { enforceFolderStructureRuleBroker } from './enforce-folder-structure-rule-broker';
import { astNodeContract } from '../../../contracts/ast-node/ast-node-contract';
import { z } from 'zod';

describe('enforceFolderStructureRuleBroker', () => {
  describe('create()', () => {
    it('VALID: => returns ESLint rule object', () => {
      const rule = enforceFolderStructureRuleBroker();
      const ruleDescriptionContract = z.string().min(1).brand<'RuleDescription'>();

      expect(rule).toStrictEqual({
        meta: {
          type: 'problem',
          docs: {
            description: ruleDescriptionContract.parse(
              'Enforce QuestMaestro project folder structure standards',
            ),
          },
          messages: {
            forbiddenFolder:
              'Folder "{{folder}}/" is forbidden. Use "{{suggestion}}/" instead according to project standards.',
            unknownFolder: 'Unknown folder "{{folder}}/". Must use one of: {{allowed}}',
          },
          schema: [],
        },
        create: expect.any(Function),
      });
    });

    it('VALID: file outside src folder => returns empty visitor', () => {
      const rule = enforceFolderStructureRuleBroker();
      const mockContext = {
        filename: '/project/test.ts',
        report: jest.fn(),
      } as unknown as Rule.RuleContext;

      const visitor = rule.create(mockContext);

      expect(visitor).toStrictEqual({});
    });

    it('VALID: file in allowed folder => does not report violation', () => {
      const rule = enforceFolderStructureRuleBroker();
      const mockContext = {
        filename: '/project/src/contracts/user/user-contract.ts',
        report: jest.fn(),
      } as unknown as Rule.RuleContext;
      const visitor = rule.create(mockContext);
      const mockNode = astNodeContract.parse({
        type: 'Program',
        range: [0, 100] as [number, number],
      });

      visitor.Program?.(mockNode as never);

      expect(mockContext.report).not.toHaveBeenCalled();
    });

    it('VALID: file in forbidden utils folder => reports violation with suggestion', () => {
      const rule = enforceFolderStructureRuleBroker();
      const mockContext = {
        filename: '/project/src/utils/helper.ts',
        report: jest.fn(),
      } as unknown as Rule.RuleContext;
      const visitor = rule.create(mockContext);
      const mockNode = astNodeContract.parse({
        type: 'Program',
        range: [0, 100] as [number, number],
      });

      visitor.Program?.(mockNode as never);

      expect(mockContext.report).toHaveBeenCalledTimes(1);
      expect(mockContext.report).toHaveBeenCalledWith({
        node: mockNode,
        messageId: 'forbiddenFolder',
        data: {
          folder: 'utils',
          suggestion: 'adapters or transformers',
        },
      });
    });

    it('VALID: file in forbidden lib folder => reports violation with adapters suggestion', () => {
      const rule = enforceFolderStructureRuleBroker();
      const mockContext = {
        filename: '/project/src/lib/api.ts',
        report: jest.fn(),
      } as unknown as Rule.RuleContext;
      const visitor = rule.create(mockContext);
      const mockNode = astNodeContract.parse({
        type: 'Program',
        range: [0, 100] as [number, number],
      });

      visitor.Program?.(mockNode as never);

      expect(mockContext.report).toHaveBeenCalledTimes(1);
      expect(mockContext.report).toHaveBeenCalledWith({
        node: mockNode,
        messageId: 'forbiddenFolder',
        data: {
          folder: 'lib',
          suggestion: 'adapters',
        },
      });
    });

    it('VALID: file in unknown folder => reports violation with allowed folders list', () => {
      const rule = enforceFolderStructureRuleBroker();
      const mockContext = {
        filename: '/project/src/unknown/file.ts',
        report: jest.fn(),
      } as unknown as Rule.RuleContext;
      const visitor = rule.create(mockContext);
      const mockNode = astNodeContract.parse({
        type: 'Program',
        range: [0, 100] as [number, number],
      });

      visitor.Program?.(mockNode as never);

      expect(mockContext.report).toHaveBeenCalledTimes(1);
      expect(mockContext.report).toHaveBeenCalledWith({
        node: mockNode,
        messageId: 'unknownFolder',
        data: {
          folder: 'unknown',
          allowed:
            'contracts, transformers, errors, flows, adapters, middleware, brokers, bindings, state, responders, widgets, startup, assets, migrations',
        },
      });
    });

    it('VALID: file in brokers folder => does not report violation', () => {
      const rule = enforceFolderStructureRuleBroker();
      const mockContext = {
        filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
        report: jest.fn(),
      } as unknown as Rule.RuleContext;
      const visitor = rule.create(mockContext);
      const mockNode = astNodeContract.parse({
        type: 'Program',
        range: [0, 100] as [number, number],
      });

      visitor.Program?.(mockNode as never);

      expect(mockContext.report).not.toHaveBeenCalled();
    });
  });
});
