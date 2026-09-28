import { questGateContentDefaultsStatics } from './quest-gate-content-defaults-statics';

describe('questGateContentDefaultsStatics', () => {
  describe('flows', () => {
    it('VALID: {} => holds exactly one flow with a start and end node, each tagging hydration-recipes-seed', () => {
      expect(questGateContentDefaultsStatics.flows).toStrictEqual([
        {
          id: 'seeded-gate-flow',
          name: 'Seeded Gate Flow',
          flowType: 'runtime',
          entryPoint: 'start',
          exitPoints: ['end'],
          nodes: [
            {
              id: 'start',
              label: 'Start',
              type: 'state',
              packages: ['hydration-recipes-seed'],
              observables: [],
            },
            {
              id: 'end',
              label: 'End',
              type: 'terminal',
              packages: ['hydration-recipes-seed'],
              observables: [],
            },
          ],
          edges: [{ id: 'start-to-end', from: 'start', to: 'end' }],
        },
      ]);
    });
  });

  describe('packagesAffected', () => {
    it('VALID: {} => declares exactly one new package, hydration-recipes-seed', () => {
      expect(questGateContentDefaultsStatics.packagesAffected).toStrictEqual([
        {
          name: 'hydration-recipes-seed',
          location: './packages/hydration-recipes-seed',
          changeType: 'new',
          packageType: 'library',
          usedBy: ['hydration-recipes-seed-consumer'],
        },
      ]);
    });
  });

  describe('node package coverage', () => {
    it('VALID: {} => every node package tag names a package declared in packagesAffected — what questSaveInvariantsTransformer checks at flows_approved', () => {
      const declaredNames = questGateContentDefaultsStatics.packagesAffected.map(
        (entry) => entry.name,
      );
      const taggedPackages = questGateContentDefaultsStatics.flows.flatMap((flow) =>
        flow.nodes.flatMap((node) => node.packages),
      );

      expect(taggedPackages.every((packageName) => declaredNames.includes(packageName))).toBe(true);
    });
  });
});
