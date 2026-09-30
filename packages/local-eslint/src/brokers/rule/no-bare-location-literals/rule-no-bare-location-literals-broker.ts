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
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { locationLiteralStatics } from '../../../statics/location-literal/location-literal-statics';
import { locationLiteralKeyPathsTransformer } from '../../../transformers/location-literal-key-paths/location-literal-key-paths-transformer';
import { isLocationLiteralAllowlistedGuard } from '../../../guards/is-location-literal-allowlisted/is-location-literal-allowlisted-guard';

const bannedLiteralKeyPaths = locationLiteralKeyPathsTransformer({
  source: locationsStatics,
  rootName: 'locationsStatics',
  minRetainedLength: locationLiteralStatics.minRetainedLiteralLength,
  excludedLiterals: locationLiteralStatics.excludedLiterals,
});

export const ruleNoBareLocationLiteralsBroker = (): TSESLint.RuleModule<'bareLocationLiteral'> => ({
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
  defaultOptions: [],
  create: (context: unknown) => {
    const ctx = context as TSESLint.RuleContext<string, unknown[]>;
    const { filename } = ctx;

    if (isLocationLiteralAllowlistedGuard({ filename })) {
      return {};
    }

    return {
      Literal: (node: TSESTree.Literal): void => {
        const { value } = node;
        if (typeof value !== 'string') {
          return;
        }
        const keyPath = bannedLiteralKeyPaths.get(value);
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
