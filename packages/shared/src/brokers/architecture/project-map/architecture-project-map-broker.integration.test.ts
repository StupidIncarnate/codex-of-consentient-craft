/**
 * PURPOSE: Regression test for project-map composer against the real monorepo.
 *
 * Locks in classification, structural sections, and key adapter rendering against the live
 * codebase so future changes can't silently break the format. Aligned with `tmp/server-map.md`
 * as the locked format target — when the server section eventually byte-matches that file,
 * tighten this test to a full string comparison per plan step 29.
 */

import { architectureProjectMapBroker } from './architecture-project-map-broker';
import { discoverPackagesLayerBroker } from './discover-packages-layer-broker';
import { cwd as getCwd } from '#gateway/node/process';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';
import { architectureOrchestratorMethodExtractBroker } from '../orchestrator-method-extract/architecture-orchestrator-method-extract-broker';
import { architectureWsGatewayBroker } from '../ws-gateway/architecture-ws-gateway-broker';
import { architectureImportEdgesBroker } from '../import-edges/architecture-import-edges-broker';

const cwd = getCwd();
const projectRoot = cwd.slice(0, cwd.lastIndexOf('/packages/'));
const packagesPath = `${projectRoot}/packages`;
const allPackages = discoverPackagesLayerBroker({ dirPath: packagesPath }).map(
  (entry) => entry.name,
);

// One whole-monorepo scan, awaited by every all-packages test below. The scan walks each
// package's source tree and re-reads a given source file once per import edge into it — ~5s
// per call under ts-jest — while its output is byte-identical call to call, so the tests share
// a single promise. `jest/no-hooks` forbids beforeAll and `jest/require-hook` exempts `const`
// declarations, which is why this is a module-scope const rather than a hook or a helper.
const allPackagesMap = architectureProjectMapBroker({ projectRoot, packages: allPackages });

describe('architectureProjectMapBroker (integration with real monorepo)', () => {
  it('VALID: {real monorepo, packages: [all]} => classifies every package by its architecture role', async () => {
    const lines = (await allPackagesMap).split('\n');

    const expectedHeaders = [
      '# server [http-backend]',
      '# orchestrator [programmatic-service]',
      '# mcp [mcp-server]',
      '# web [frontend-react]',
      '# hooks [hook-handlers]',
      '# eslint-plugin [eslint-plugin]',
      '# local-eslint [eslint-plugin]',
      '# cli [cli-tool]',
      '# ward [cli-tool]',
      '# tooling [cli-tool]',
    ];
    const missing = expectedHeaders.filter((header) => !lines.includes(header));

    expect(missing).toStrictEqual([]);
  });

  it('VALID: {real monorepo, packages: [all]} => each library package renders a header then the inventory pointer', async () => {
    const lines = (await allPackagesMap).split('\n');
    const libraryHeaders = ['# shared [library]', '# config [library]', '# testing [library]'];

    const rendered = libraryHeaders.map((header) => {
      const headerIndex = lines.indexOf(header);
      return lines.slice(headerIndex, headerIndex + 3);
    });

    expect(rendered).toStrictEqual(
      libraryHeaders.map((header) => [header, '', projectMapStatics.libraryNoFlowNotice]),
    );
  });

  it('VALID: {real monorepo, packages: [all]} => emits Boot header', async () => {
    const lines = (await allPackagesMap).split('\n');

    expect(lines.some((l) => l === '## Boot')).toBe(true);
  });

  it('VALID: {real monorepo, packages: [all]} => renders adapter chain entries by their export name', async () => {
    const lines = (await allPackagesMap).split('\n');

    // A gateway call (`verifyRef`, `worktreePrune`, `worktreeAdd` from `#gateway/bin/git`) is not a
    // chain node: worktreePrepareBroker renders its child brokers only, so the git steps that moved
    // onto the gateway leave no adapter line behind. Web's `reactDomMountAdapter` is gone too: its
    // `createRoot` call is a web broker over the gateway now.
    const adapterLines = lines.filter((l) => l.endsWith('Adapter'));
    const worktreePrepareChildren = lines.filter((l) => /→ worktree\w+Broker$/u.test(l));

    expect(adapterLines.some((l) => l.endsWith('→ reactDomMountAdapter'))).toBe(false);
    expect(adapterLines.some((l) => l.endsWith('→ fsWatchTailAdapter'))).toBe(false);
    expect(adapterLines.some((l) => l.endsWith('→ fsIsAccessibleAdapter'))).toBe(false);
    expect(adapterLines.some((l) => l.endsWith('→ fsReadFileAdapter'))).toBe(false);
    expect(adapterLines.some((l) => l.endsWith('→ childProcessSpawnStreamJsonAdapter'))).toBe(
      false,
    );
    expect(adapterLines.some((l) => l.endsWith('→ gitVerifyRefAdapter'))).toBe(false);
    expect(adapterLines.some((l) => l.endsWith('→ gitWorktreePruneAdapter'))).toBe(false);
    expect(adapterLines.some((l) => l.endsWith('→ gitWorktreeAddAdapter'))).toBe(false);
    expect(worktreePrepareChildren.some((l) => l.endsWith('→ worktreeDiscardBroker'))).toBe(true);
  });

  it('VALID: {real monorepo, packages: [all]} => emits exactly one --- separator after URL pairing block before first package', async () => {
    const lines = (await allPackagesMap).split('\n');
    const urlBlockIdx = lines.findIndex((l) => l.startsWith('**URL pairing convention**'));
    const after = lines.slice(urlBlockIdx + 1, urlBlockIdx + 5);

    // 'bin' is one of the gateway packages under packages/@gateway/ — discovered by its own bare
    // name, it sorts alphabetically before every other package, 'cli' included.
    expect(after).toStrictEqual(['', '---', '', '# bin [library]']);
  });

  it('VALID: {real monorepo, packages: [all]} => discovers every gateway package by its bare name, and never lists @gateway itself', async () => {
    const lines = (await allPackagesMap).split('\n');

    expect(lines.some((l) => l.startsWith('# bin ['))).toBe(true);
    expect(lines.some((l) => l.startsWith('# browser ['))).toBe(true);
    expect(lines.some((l) => l.startsWith('# node ['))).toBe(true);
    expect(lines.some((l) => l.startsWith('# npm ['))).toBe(true);
    expect(lines.some((l) => l.startsWith('# @gateway'))).toBe(false);
  });

  it('VALID: {real monorepo, packages: [all]} => emits pointer footer at the end with no EDGES section', async () => {
    const lines = (await allPackagesMap).split('\n');

    expect(lines.some((l) => l === '## EDGES')).toBe(false);
    expect(lines[lines.length - 1]).toBe(
      '> Call `get-project-inventory({ packageName })` for the per-package folder/file detail.',
    );
  });

  it('VALID: {real monorepo, packages: [cli]} => renders only cli section, omits other packages', async () => {
    const result = await architectureProjectMapBroker({
      projectRoot,
      packages: ['cli'],
    });
    const lines = result.split('\n');

    expect(lines.some((l) => l === '# cli [cli-tool]')).toBe(true);
    expect(lines.some((l) => l === '# mcp [mcp-server]')).toBe(false);
    expect(lines.some((l) => l === '# web [frontend-react]')).toBe(false);
    expect(lines.some((l) => l === '# server [http-backend]')).toBe(false);
  });

  it('VALID: {real monorepo} => orchestrator section inlines runChatLayerBroker under orchestration-loop', async () => {
    // packageSectionBuildLayerBroker renders a package's section from (packageName, packageRoot,
    // packageType, projectRoot) alone — identical whether reached via a single-package request or
    // via allPackagesMap's all-packages request — so this reads orchestrator's slice out of the
    // module-scope scan instead of paying for a second full walk of it.
    const lines = (await allPackagesMap).split('\n');

    expect(lines.some((l) => l.endsWith('→ runChatLayerBroker'))).toBe(true);
  });

  it('VALID: {real monorepo} => mcp section does NOT include phantom from-string imports inside testing-patterns markdown', async () => {
    const lines = (await allPackagesMap).split('\n');

    expect(lines.some((l) => /→ contracts\/?user/u.test(l))).toBe(false);
    expect(lines.some((l) => /→ statics\/?exit-code/u.test(l))).toBe(false);
  });

  it('VALID: {real monorepo, packages: [all]} => at least one package emits an Unreferenced section', async () => {
    const lines = (await allPackagesMap).split('\n');

    expect(lines.some((l) => l === '## Unreferenced')).toBe(true);
  });

  it('VALID: {real monorepo} => web section renders binding broker chain by export name (questQueueBroker)', async () => {
    const lines = (await allPackagesMap).split('\n');

    expect(lines.some((l) => l.endsWith('→ questQueueBroker'))).toBe(true);
  });

  it('VALID: {real monorepo} => extracts StartOrchestrator methods from server responders via orchestrator method extract broker', () => {
    const userAddResponder = `${projectRoot}/packages/server/src/responders/quest/user-add/quest-user-add-responder.ts`;
    const result = architectureOrchestratorMethodExtractBroker({
      serverResponderFile: userAddResponder,
    });

    expect(result).toBe('StartOrchestrator.addQuest({...})');
  });

  it('VALID: {real monorepo} => detects server-init-responder as WS gateway file via ws gateway broker', () => {
    const gateways = architectureWsGatewayBroker({ projectRoot });
    const serverInitResponder = `${projectRoot}/packages/server/src/responders/server/init/server-init-responder.ts`;

    expect(gateways).toStrictEqual([serverInitResponder]);
  });

  it('VALID: {real monorepo} => architectureImportEdgesBroker finds cross-package edges into shared/contracts', () => {
    const edges = architectureImportEdgesBroker({ projectRoot });
    const sharedContractsEdges = edges.filter(
      (edge) => `${edge.sourcePackage}/${edge.barrel}` === 'shared/contracts',
    );

    expect(sharedContractsEdges.length).toBeGreaterThan(0);
  });

  it('INVALID: {real monorepo, packages: [nonexistent]} => throws with valid-names list', async () => {
    await expect(
      architectureProjectMapBroker({
        projectRoot,
        packages: ['nonexistent'],
      }),
    ).rejects.toThrow(/Unknown package\(s\): nonexistent\. Valid: .*\bcli\b.*\bmcp\b.*\bweb\b/u);
  });
});
