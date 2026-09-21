import { agentFlowStatics } from '../agent-flow/agent-flow-statics';

import { stepScopeStatics } from './step-scope-statics';

// Every declared (family, step) pair, walked off the static itself rather than hand-typed, so a
// new entry is swept into every table-driven check below without anyone updating a second list.
const DECLARED_FAMILY_STEPS = Object.entries(stepScopeStatics.byFamilyStep).flatMap(
  ([family, steps]) => Object.keys(steps).map((step) => [family, step] as const),
);

const REVIEW_STEPS = [
  ['codeweaver.review', stepScopeStatics.byFamilyStep.codeweaver.review] as const,
  ['flowrider.review', stepScopeStatics.byFamilyStep.flowrider.review] as const,
  ['siegemaster.happyWalk', stepScopeStatics.byFamilyStep.siegemaster.happyWalk] as const,
  ['siegemaster.adversarial', stepScopeStatics.byFamilyStep.siegemaster.adversarial] as const,
];

// Statics may import statics but `ban-contract-in-tests` refuses a contract import, so this sorted
// literal is the coverage assertion against packageTypeContract's nine options — the same pin
// `package-build-order-statics.test.ts` holds against its own flattened tiers.
const CANONICAL_PACKAGE_TYPES_SORTED = [
  'cli-tool',
  'eslint-plugin',
  'frontend-ink',
  'frontend-react',
  'hook-handlers',
  'http-backend',
  'library',
  'mcp-server',
  'programmatic-service',
];

// Flattened to "family.step" labels, so membership is a single Set lookup with no conditional
// operator inside the test body — a table-driven sweep over both statics at once.
const AGENT_FLOW_FAMILY_STEP_LABELS = new Set(
  Object.entries(agentFlowStatics).flatMap(([family, definition]) =>
    Object.keys(definition.steps).map((step) => `${family}.${step}`),
  ),
);

describe('stepScopeStatics', () => {
  describe('verification-method scope', () => {
    it('VALID: {codeweaver.review} => includes reading, the only step that settles a (read-check) unit', () => {
      const { verificationMethods } = stepScopeStatics.byFamilyStep.codeweaver.review;

      expect(
        verificationMethods.map(String).filter((method) => method === 'reading'),
      ).toStrictEqual(['reading']);
    });

    it('VALID: {flowrider.review} => excludes reading, so a (read-check) unit never reaches its denominator', () => {
      const { verificationMethods } = stepScopeStatics.byFamilyStep.flowrider.review;

      expect(
        verificationMethods.map(String).filter((method) => method === 'reading'),
      ).toStrictEqual([]);
    });
  });

  describe('flow-type scope', () => {
    const RUNTIME_ONLY_STEPS = [
      ['flowrider.review', stepScopeStatics.byFamilyStep.flowrider.review] as const,
      ['siegemaster.happyWalk', stepScopeStatics.byFamilyStep.siegemaster.happyWalk] as const,
      ['siegemaster.adversarial', stepScopeStatics.byFamilyStep.siegemaster.adversarial] as const,
    ];

    it.each(RUNTIME_ONLY_STEPS)(
      'VALID: {step: %s} => measures runtime flows alone, so an operational flow is out of scope',
      (_label, scope) => {
        expect(scope.flowTypes).toStrictEqual(['runtime']);
      },
    );

    it('VALID: {codeweaver.review} => measures both flow types, because it builds the code behind an operational flow too', () => {
      expect(stepScopeStatics.byFamilyStep.codeweaver.review.flowTypes).toStrictEqual([
        'runtime',
        'operational',
      ]);
    });
  });

  describe('unit-kind scope', () => {
    const OFF_MAP_MEMBERSHIP = [
      ['codeweaver.review', stepScopeStatics.byFamilyStep.codeweaver.review, []] as const,
      ['flowrider.review', stepScopeStatics.byFamilyStep.flowrider.review, []] as const,
      [
        'siegemaster.happyWalk',
        stepScopeStatics.byFamilyStep.siegemaster.happyWalk,
        ['off-map'],
      ] as const,
      [
        'siegemaster.adversarial',
        stepScopeStatics.byFamilyStep.siegemaster.adversarial,
        ['off-map'],
      ] as const,
    ];

    it.each(OFF_MAP_MEMBERSHIP)(
      'VALID: {step: %s} => filters to exactly the off-map members it owns',
      (_label, scope, expected) => {
        expect(scope.unitKinds.map(String).filter((kind) => kind === 'off-map')).toStrictEqual(
          expected,
        );
      },
    );

    it('VALID: {siegemaster.adversarial} => unitKinds is exactly off-map, the family it was allocated and nothing else', () => {
      expect(stepScopeStatics.byFamilyStep.siegemaster.adversarial.unitKinds).toStrictEqual([
        'off-map',
      ]);
    });
  });

  describe('package-type scope', () => {
    it.each(REVIEW_STEPS)(
      'VALID: {step: %s} => the nine packageTypes are 1:1 with packageTypeContract options',
      (_label, scope) => {
        expect(scope.packageTypes.map(String).sort()).toStrictEqual(CANONICAL_PACKAGE_TYPES_SORTED);
      },
    );
  });

  describe('step existence', () => {
    it.each(DECLARED_FAMILY_STEPS)(
      'VALID: {family: %s, step: %s} => names a step agentFlowStatics actually declares',
      (family, step) => {
        const isDeclared = AGENT_FLOW_FAMILY_STEP_LABELS.has(`${family}.${step}`);

        expect(isDeclared).toBe(true);
      },
    );
  });

  describe('full exported value', () => {
    it('VALID: {statics} => matches the complete step-scope map', () => {
      expect(stepScopeStatics).toStrictEqual({
        byFamilyStep: {
          codeweaver: {
            review: {
              flowTypes: ['runtime', 'operational'],
              verificationMethods: ['test', 'reading'],
              unitKinds: ['terminal', 'branch', 'observable'],
              packageTypes: [
                'http-backend',
                'mcp-server',
                'frontend-react',
                'frontend-ink',
                'hook-handlers',
                'eslint-plugin',
                'cli-tool',
                'programmatic-service',
                'library',
              ],
              observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
            },
          },
          flowrider: {
            review: {
              flowTypes: ['runtime'],
              verificationMethods: ['test'],
              unitKinds: ['terminal', 'branch', 'observable'],
              packageTypes: [
                'http-backend',
                'mcp-server',
                'frontend-react',
                'frontend-ink',
                'hook-handlers',
                'eslint-plugin',
                'cli-tool',
                'programmatic-service',
                'library',
              ],
              observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
            },
          },
          siegemaster: {
            happyWalk: {
              flowTypes: ['runtime'],
              verificationMethods: ['test'],
              unitKinds: ['terminal', 'branch', 'observable', 'off-map'],
              packageTypes: [
                'http-backend',
                'mcp-server',
                'frontend-react',
                'frontend-ink',
                'hook-handlers',
                'eslint-plugin',
                'cli-tool',
                'programmatic-service',
                'library',
              ],
              observableOrigins: [
                'spec',
                'chaoswhisperer',
                'codeweaver',
                'flowrider',
                'siegemaster',
                'operator',
              ],
            },
            adversarial: {
              flowTypes: ['runtime'],
              verificationMethods: ['test'],
              unitKinds: ['off-map'],
              packageTypes: [
                'http-backend',
                'mcp-server',
                'frontend-react',
                'frontend-ink',
                'hook-handlers',
                'eslint-plugin',
                'cli-tool',
                'programmatic-service',
                'library',
              ],
              observableOrigins: [
                'spec',
                'chaoswhisperer',
                'codeweaver',
                'flowrider',
                'siegemaster',
                'operator',
              ],
            },
          },
        },
      });
    });
  });
});
