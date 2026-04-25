/**
 * PURPOSE: Bans raw filename / dirname literals that belong to `locationsStatics` from leaking into application code. Forces callers to compose paths via the resolver brokers under `@dungeonmaster/shared/brokers/locations/**` instead.
 *
 * USAGE:
 * const rule = ruleNoBareLocationLiteralsBroker();
 * // Returns ESLint rule that flags `'.mcp.json'` outside packages/shared/src/statics/locations/** and packages/shared/src/brokers/locations/** (and test/stub/proxy/harness files).
 *
 * WHEN-TO-USE: Registered in @dungeonmaster/local-eslint (this repo only, never shipped) to prevent regression of the spawn-cwd / hardcoded-path bug class — the `13b291b7` smoketest fix and the latent chat-spawn-broker bug.
 *
 * NOTE: Reads `locationsStatics` from @dungeonmaster/shared/statics at module-load time. A stale `dist/` for shared causes stale banned literals; rebuild shared first (`npm run build --workspace=@dungeonmaster/shared`) before lint.
 */
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { pathSegmentContract } from '@dungeonmaster/shared/contracts';
import { eslintRuleContract } from '@dungeonmaster/eslint-plugin';
import type { EslintRule, EslintContext, Tsestree } from '@dungeonmaster/eslint-plugin';
import { locationLiteralStatics } from '../../../statics/location-literal/location-literal-statics';
import { locationLiteralKeyPathsTransformer } from '../../../transformers/location-literal-key-paths/location-literal-key-paths-transformer';
import { isLocationLiteralAllowlistedGuard } from '../../../guards/is-location-literal-allowlisted/is-location-literal-allowlisted-guard';

const bannedLiteralKeyPaths = locationLiteralKeyPathsTransformer({
  source: locationsStatics,
  rootName: 'locationsStatics',
  minRetainedLength: locationLiteralStatics.minRetainedLiteralLength,
});

export const ruleNoBareLocationLiteralsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban raw filename / dirname literals that belong to `locationsStatics`. Compose paths via the resolver brokers under @dungeonmaster/shared/brokers/locations instead.',
      },
      messages: {
        bareLocationLiteral:
          "Do not use the raw location literal '{{literal}}'. It belongs to `{{keyPath}}` — compose the absolute path via the corresponding resolver under @dungeonmaster/shared/brokers/locations instead of hardcoding the literal.",
      },
      schema: [],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    const filename = ctx.filename ?? ctx.getFilename?.() ?? '';

    if (isLocationLiteralAllowlistedGuard({ filename: String(filename) })) {
      return {};
    }

    return {
      Literal: (node: Tsestree): void => {
        const { value } = node;
        if (typeof value !== 'string') {
          return;
        }
        const keyPath = bannedLiteralKeyPaths.get(pathSegmentContract.parse(value));
        if (keyPath === undefined) {
          return;
        }
        ctx.report({
          node,
          messageId: 'bareLocationLiteral',
          data: { literal: value, keyPath: String(keyPath) },
        });
      },
    };
  },
});
