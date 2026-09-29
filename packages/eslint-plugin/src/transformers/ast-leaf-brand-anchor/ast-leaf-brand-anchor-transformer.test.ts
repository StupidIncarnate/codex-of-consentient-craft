import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';
import { astCollectNodesTransformer } from '../ast-collect-nodes/ast-collect-nodes-transformer';
import { zodObjectBrandStatics } from '../../statics/zod-object-brand/zod-object-brand-statics';
import { astLeafBrandAnchorTransformer } from './ast-leaf-brand-anchor-transformer';

// The last call in source order is the leaf root, `z.string()`, the innermost of its chain. The
// result is a list of one range, so a missing leaf reads as an empty list and not a skipped assertion.
const anchorRangesFor = ({ code }: { code: string }) =>
  astCollectNodesTransformer({
    node: ProgramStub({ code }),
    type: AST_NODE_TYPES.CallExpression,
  })
    .slice(-1)
    .map((node) => astLeafBrandAnchorTransformer({ node }).range);

describe('astLeafBrandAnchorTransformer', () => {
  describe('a bare leaf', () => {
    it('VALID: {z.string()} => anchors on the leaf call itself', () => {
      const result = anchorRangesFor({ code: 'z.string();' });

      expect(result).toStrictEqual([[0, 10]]);
    });
  });

  describe('checks after the leaf', () => {
    it('VALID: {z.string().min(1)} => anchors after the check', () => {
      const result = anchorRangesFor({ code: 'z.string().min(1);' });

      expect(result).toStrictEqual([[0, 17]]);
    });

    it('VALID: {z.string().min(1).uuid()} => anchors after the last check', () => {
      const result = anchorRangesFor({ code: 'z.string().min(1).uuid();' });

      expect(result).toStrictEqual([[0, 24]]);
    });
  });

  describe('wrappers after the leaf', () => {
    it.each(zodObjectBrandStatics.leafWrapperMethods)(
      'VALID: {z.number().int().%s()} => anchors before the wrapper',
      (wrapper) => {
        const result = anchorRangesFor({ code: `z.number().int().${wrapper}();` });

        expect(result).toStrictEqual([[0, 16]]);
      },
    );

    it('EDGE: {z.string().optional().min(1)} => a check after a wrapper does not move the anchor', () => {
      const result = anchorRangesFor({ code: 'z.string().optional().min(1);' });

      expect(result).toStrictEqual([[0, 10]]);
    });
  });

  describe('a leaf that is not the receiver of a call', () => {
    it('EDGE: {z.string() as an argument} => anchors on the leaf call', () => {
      const result = anchorRangesFor({ code: 'run(z.string());' });

      expect(result).toStrictEqual([[4, 14]]);
    });
  });
});
