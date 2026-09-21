import { ruleGraphReachabilityBroker } from './rule-graph-reachability-broker';
import { eslintRuleTesterAdapter } from '@dungeonmaster/eslint-plugin';

const ruleTester = eslintRuleTesterAdapter();

// Virtual fixture paths — RuleTester does NOT read these off disk; it only uses them as the
// "filename" key on each test case so the scope guard's path-substring check works.
const questFlowStaticsFixture =
  '/repo/packages/shared/src/statics/quest-flow/quest-flow-statics.ts';
const outsideScopeFixture = '/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx';

ruleTester.run('graph-reachability', ruleGraphReachabilityBroker(), {
  valid: [
    // === OUTSIDE SCOPE: any file but questFlowStatics's own source is never reported on,
    // whatever the real family graph carries — the rule returns {} before it ever reads
    // graphViolations for a filename outside scope ===
    {
      code: 'export const x = 1;',
      filename: outsideScopeFixture,
    },
    // === IN SCOPE: reading the real graph does not crash, and today it reports nothing —
    // graph-reachability-violations-transformer.test.ts is what proves the real
    // questFlowStatics graph is clean; this case proves the wiring reaches it without error ===
    {
      code: 'export const questFlowStatics = {};',
      filename: questFlowStaticsFixture,
    },
  ],
  invalid: [],
});
