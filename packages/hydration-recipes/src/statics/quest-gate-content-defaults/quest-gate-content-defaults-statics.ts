/**
 * PURPOSE: The minimal, schema-valid `flows`/`packagesAffected` a recipe hands `questApiRouteBroker`
 * so a create-time status folded straight past `created` (a `setRaw` right after `add()`) can walk
 * the REAL `flows_approved`/`approved` gates on a live target instead of being refused for missing
 * content. `packagesAffected` names a package that cannot exist on any real disk
 * (`changeType: 'new'`, an invented name), so `questModifyBroker`'s package-entry resolution passes
 * regardless of which guild/repo the recipe seeds against — the same property
 * `seedFixtureStatics.quest.packagesAffected` (`guild-with-three-quests`'s own fixture) already
 * relies on, kept as a separate file here because that one is scoped to its own two recipes.
 *
 * USAGE:
 * questGateContentDefaultsStatics.flows;
 * // Returns a one-node-pair flow whose node tags match packagesAffected below
 */

export const questGateContentDefaultsStatics = {
  flows: [
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
  ],
  packagesAffected: [
    {
      name: 'hydration-recipes-seed',
      location: './packages/hydration-recipes-seed',
      changeType: 'new',
      packageType: 'library',
      usedBy: ['hydration-recipes-seed-consumer'],
    },
  ],
} as const;
