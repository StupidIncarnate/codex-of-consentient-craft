import { blightConcernLegendStatics } from '../blight-concern-legend/blight-concern-legend-statics';
import { blightConcernGatingStatics } from './blight-concern-gating-statics';

describe('blightConcernGatingStatics', () => {
  describe('full exported value', () => {
    it('VALID: {statics} => names the inert concerns, the declaration-shaped suffixes, and the barrel basename', () => {
      expect(blightConcernGatingStatics).toStrictEqual({
        structurallyInertConcerns: ['perf', 'integrity'],
        inertImplSuffixes: [
          '-contract.ts',
          '.stub.ts',
          '.proxy.ts',
          '.proxy.tsx',
          '.test.ts',
          '.test.tsx',
          '.e2e.ts',
          '.harness.ts',
        ],
        barrelBasename: 'index.ts',
      });
    });
  });

  describe('the inert concerns are real concerns, and are a strict subset', () => {
    it('VALID: {structurallyInertConcerns} => every entry is a key of blightConcernLegendStatics.byConcern, which is pinned 1:1 with blightConcernContract', () => {
      const legendKeys = Object.keys(blightConcernLegendStatics.byConcern);

      expect(
        blightConcernGatingStatics.structurallyInertConcerns.filter(
          (concern) => !legendKeys.includes(concern),
        ),
      ).toStrictEqual([]);
    });

    it('VALID: {structurallyInertConcerns} => leaves three concerns that still apply to a declaration-shaped file, so gating never empties a unit group', () => {
      const legendKeys = Object.keys(blightConcernLegendStatics.byConcern);

      expect(
        legendKeys.filter(
          (concern) =>
            !blightConcernGatingStatics.structurallyInertConcerns.some(
              (inert) => inert === concern,
            ),
        ),
      ).toStrictEqual(['craft', 'dedup', 'test-cases']);
    });
  });

  describe('the suffixes are suffix tests, not exact markers', () => {
    it('VALID: {a .integration.test.ts path} => is already matched by the .test.ts entry, so the list carries no second copy of that rule', () => {
      const path = 'packages/orchestrator/src/startup/start-thing.integration.test.ts';

      expect(
        blightConcernGatingStatics.inertImplSuffixes.filter((suffix) => path.endsWith(suffix)),
      ).toStrictEqual(['.test.ts']);
    });
  });
});
