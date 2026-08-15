import { packageBuildOrderStatics } from './package-build-order-statics';

// Flattened once, so a kind's RANK is `TIER_INDEX_BY_KIND.get(kind)` and a test can compare two
// kinds' ranks without re-deriving the walk the transformer does.
const TIER_INDEX_BY_KIND = new Map(
  packageBuildOrderStatics.tiers.flatMap((tier, tierIndex) =>
    tier.map((kind) => [kind, tierIndex] as const),
  ),
);

describe('packageBuildOrderStatics', () => {
  describe('the tier list itself', () => {
    it('VALID: exported value => five kind tiers, pure providers first and tooling leaves last', () => {
      expect(packageBuildOrderStatics).toStrictEqual({
        tiers: [
          ['library'],
          ['programmatic-service', 'mcp-server'],
          ['http-backend'],
          ['frontend-react', 'frontend-ink'],
          ['cli-tool', 'hook-handlers', 'eslint-plugin'],
        ],
      });
    });

    // Pins the flattened tiers 1:1 with packageTypeContract's nine options. A statics file — and
    // its test — cannot import a contract, so this sorted literal IS the coverage assertion: a kind
    // the tiers lose, or list twice, fails here. A kind that reached the enum without a tier would
    // rank at `unrankedTier` in operationsCodeweaverOrderTransformer and schedule its package's
    // session after every consumer of it.
    it('VALID: {flattened tiers, sorted} => every packageTypeContract option appears exactly once', () => {
      expect(packageBuildOrderStatics.tiers.flat().sort()).toStrictEqual([
        'cli-tool',
        'eslint-plugin',
        'frontend-ink',
        'frontend-react',
        'hook-handlers',
        'http-backend',
        'library',
        'mcp-server',
        'programmatic-service',
      ]);
    });
  });

  describe('the ordering the manifest gets wrong', () => {
    // The whole reason this list outranks `quest.packageGraph` depth. Measured in this repo:
    // packages/server depends on @dungeonmaster/web (it serves the built bundle) while packages/web
    // depends only on @dungeonmaster/shared, so Kahn ranks web 1 and server 2 — the browser package
    // ahead of the backend whose routes it calls. Ranking by kind puts http-backend first.
    it('VALID: {http-backend vs the two frontend kinds} => the backend tier ranks strictly ahead of both', () => {
      expect({
        httpBackend: TIER_INDEX_BY_KIND.get('http-backend'),
        frontendReact: TIER_INDEX_BY_KIND.get('frontend-react'),
        frontendInk: TIER_INDEX_BY_KIND.get('frontend-ink'),
      }).toStrictEqual({ httpBackend: 2, frontendReact: 3, frontendInk: 3 });
    });

    // Ranked in the order the seam runs: a service is composed from libraries, an http-backend
    // fronts the services, the browser packages consume that backend over a wire no manifest edge
    // records, and the tooling leaves wrap everything with nothing consuming them back. `library`
    // alone at rank 0 is what stops a provider tying with its consumers and falling back to
    // authored order — the tie the depth key is only allowed to settle WITHIN a tier.
    it('VALID: {each kind} => resolves to the tier index its position in the build seam demands', () => {
      expect({
        library: TIER_INDEX_BY_KIND.get('library'),
        programmaticService: TIER_INDEX_BY_KIND.get('programmatic-service'),
        mcpServer: TIER_INDEX_BY_KIND.get('mcp-server'),
        httpBackend: TIER_INDEX_BY_KIND.get('http-backend'),
        frontendReact: TIER_INDEX_BY_KIND.get('frontend-react'),
        frontendInk: TIER_INDEX_BY_KIND.get('frontend-ink'),
        cliTool: TIER_INDEX_BY_KIND.get('cli-tool'),
        hookHandlers: TIER_INDEX_BY_KIND.get('hook-handlers'),
        eslintPlugin: TIER_INDEX_BY_KIND.get('eslint-plugin'),
      }).toStrictEqual({
        library: 0,
        programmaticService: 1,
        mcpServer: 1,
        httpBackend: 2,
        frontendReact: 3,
        frontendInk: 3,
        cliTool: 4,
        hookHandlers: 4,
        eslintPlugin: 4,
      });
    });
  });
});
