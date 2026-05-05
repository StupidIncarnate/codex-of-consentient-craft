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
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { PackageNameStub } from '../../../contracts/package-name/package-name.stub';
import { processCwdAdapter } from '../../../adapters/process/cwd/process-cwd-adapter';

describe('architectureProjectMapBroker (integration with real monorepo)', () => {
  it('VALID: {real monorepo, packages: [all]} => classifies every package by its architecture role', async () => {
    const cwd = String(processCwdAdapter());
    const projectRoot = AbsoluteFilePathStub({
      value: cwd.slice(0, cwd.lastIndexOf('/packages/')),
    });
    const packagesPath = AbsoluteFilePathStub({ value: `${projectRoot}/packages` });
    const allPackages = discoverPackagesLayerBroker({ dirPath: packagesPath })
      .filter((entry) => entry.isDirectory())
      .map((entry) => PackageNameStub({ value: entry.name }));

    const result = await architectureProjectMapBroker({ projectRoot, packages: allPackages });
    const lines = String(result).split('\n');

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

  it('VALID: {real monorepo, packages: [all]} => library packages are filtered out (project-inventory shows them)', async () => {
    const cwd = String(processCwdAdapter());
    const projectRoot = AbsoluteFilePathStub({
      value: cwd.slice(0, cwd.lastIndexOf('/packages/')),
    });
    const packagesPath = AbsoluteFilePathStub({ value: `${projectRoot}/packages` });
    const allPackages = discoverPackagesLayerBroker({ dirPath: packagesPath })
      .filter((entry) => entry.isDirectory())
      .map((entry) => PackageNameStub({ value: entry.name }));

    const result = await architectureProjectMapBroker({ projectRoot, packages: allPackages });
    const lines = String(result).split('\n');

    const libraryHeaders = ['# shared [library]', '# config [library]', '# testing [library]'];
    const present = libraryHeaders.filter((header) => lines.includes(header));

    expect(present).toStrictEqual([]);
  });

  it('VALID: {real monorepo, packages: [all]} => emits Boot header', async () => {
    const cwd = String(processCwdAdapter());
    const projectRoot = AbsoluteFilePathStub({
      value: cwd.slice(0, cwd.lastIndexOf('/packages/')),
    });
    const packagesPath = AbsoluteFilePathStub({ value: `${projectRoot}/packages` });
    const allPackages = discoverPackagesLayerBroker({ dirPath: packagesPath })
      .filter((entry) => entry.isDirectory())
      .map((entry) => PackageNameStub({ value: entry.name }));

    const result = await architectureProjectMapBroker({ projectRoot, packages: allPackages });
    const lines = String(result).split('\n');

    expect(lines.some((l) => l === '## Boot')).toBe(true);
  });

  it('VALID: {real monorepo, packages: [all]} => renders adapter chain entries by their export name', async () => {
    const cwd = String(processCwdAdapter());
    const projectRoot = AbsoluteFilePathStub({
      value: cwd.slice(0, cwd.lastIndexOf('/packages/')),
    });
    const packagesPath = AbsoluteFilePathStub({ value: `${projectRoot}/packages` });
    const allPackages = discoverPackagesLayerBroker({ dirPath: packagesPath })
      .filter((entry) => entry.isDirectory())
      .map((entry) => PackageNameStub({ value: entry.name }));

    const result = await architectureProjectMapBroker({ projectRoot, packages: allPackages });
    const lines = String(result).split('\n');

    expect(lines.some((l) => l.endsWith('→ orchestratorGetQuestAdapter'))).toBe(true);
    expect(lines.some((l) => l.endsWith('→ orchestratorStartQuestAdapter'))).toBe(true);
    expect(lines.some((l) => l.endsWith('→ orchestratorListQuestsAdapter'))).toBe(true);
  });

  it('VALID: {real monorepo, packages: [all]} => emits exactly one --- separator after URL pairing block before first package', async () => {
    const cwd = String(processCwdAdapter());
    const projectRoot = AbsoluteFilePathStub({
      value: cwd.slice(0, cwd.lastIndexOf('/packages/')),
    });
    const packagesPath = AbsoluteFilePathStub({ value: `${projectRoot}/packages` });
    const allPackages = discoverPackagesLayerBroker({ dirPath: packagesPath })
      .filter((entry) => entry.isDirectory())
      .map((entry) => PackageNameStub({ value: entry.name }));

    const result = await architectureProjectMapBroker({ projectRoot, packages: allPackages });
    const lines = String(result).split('\n');
    const urlBlockIdx = lines.findIndex((l) => l.startsWith('**URL pairing convention**'));
    const after = lines.slice(urlBlockIdx + 1, urlBlockIdx + 5);

    expect(after).toStrictEqual(['', '---', '', '# cli [cli-tool]']);
  });

  it('VALID: {real monorepo, packages: [all]} => emits pointer footer at the end with no EDGES section', async () => {
    const cwd = String(processCwdAdapter());
    const projectRoot = AbsoluteFilePathStub({
      value: cwd.slice(0, cwd.lastIndexOf('/packages/')),
    });
    const packagesPath = AbsoluteFilePathStub({ value: `${projectRoot}/packages` });
    const allPackages = discoverPackagesLayerBroker({ dirPath: packagesPath })
      .filter((entry) => entry.isDirectory())
      .map((entry) => PackageNameStub({ value: entry.name }));

    const result = await architectureProjectMapBroker({ projectRoot, packages: allPackages });
    const lines = String(result).split('\n');

    expect(lines.some((l) => l === '## EDGES')).toBe(false);
    expect(lines[lines.length - 1]).toBe(
      '> Call `get-project-inventory({ packageName })` for the per-package folder/file detail.',
    );
  });

  it('VALID: {real monorepo, packages: [cli]} => renders only cli section, omits other packages', async () => {
    const cwd = String(processCwdAdapter());
    const projectRoot = AbsoluteFilePathStub({
      value: cwd.slice(0, cwd.lastIndexOf('/packages/')),
    });

    const result = await architectureProjectMapBroker({
      projectRoot,
      packages: [PackageNameStub({ value: 'cli' })],
    });
    const lines = String(result).split('\n');

    expect(lines.some((l) => l === '# cli [cli-tool]')).toBe(true);
    expect(lines.some((l) => l === '# mcp [mcp-server]')).toBe(false);
    expect(lines.some((l) => l === '# web [frontend-react]')).toBe(false);
    expect(lines.some((l) => l === '# server [http-backend]')).toBe(false);
  });

  it('VALID: {real monorepo} => orchestrator section inlines runSiegemasterLayerBroker under orchestration-loop', async () => {
    const cwd = String(processCwdAdapter());
    const projectRoot = AbsoluteFilePathStub({
      value: cwd.slice(0, cwd.lastIndexOf('/packages/')),
    });

    const result = await architectureProjectMapBroker({
      projectRoot,
      packages: [PackageNameStub({ value: 'orchestrator' })],
    });
    const lines = String(result).split('\n');

    expect(lines.some((l) => l.endsWith('→ runSiegemasterLayerBroker'))).toBe(true);
  });

  it('VALID: {real monorepo} => mcp section does NOT include phantom from-string imports inside testing-patterns markdown', async () => {
    const cwd = String(processCwdAdapter());
    const projectRoot = AbsoluteFilePathStub({
      value: cwd.slice(0, cwd.lastIndexOf('/packages/')),
    });

    const result = await architectureProjectMapBroker({
      projectRoot,
      packages: [PackageNameStub({ value: 'mcp' })],
    });
    const lines = String(result).split('\n');

    expect(lines.some((l) => /→ contracts\/?user/u.test(l))).toBe(false);
    expect(lines.some((l) => /→ statics\/?exit-code/u.test(l))).toBe(false);
  });

  it('VALID: {real monorepo, packages: [all]} => at least one package emits an Unreferenced section', async () => {
    const cwd = String(processCwdAdapter());
    const projectRoot = AbsoluteFilePathStub({
      value: cwd.slice(0, cwd.lastIndexOf('/packages/')),
    });
    const packagesPath = AbsoluteFilePathStub({ value: `${projectRoot}/packages` });
    const allPackages = discoverPackagesLayerBroker({ dirPath: packagesPath })
      .filter((entry) => entry.isDirectory())
      .map((entry) => PackageNameStub({ value: entry.name }));

    const result = await architectureProjectMapBroker({ projectRoot, packages: allPackages });
    const lines = String(result).split('\n');

    expect(lines.some((l) => l === '## Unreferenced')).toBe(true);
  });

  it('VALID: {real monorepo} => web section renders binding broker chain by export name (questQueueBroker)', async () => {
    const cwd = String(processCwdAdapter());
    const projectRoot = AbsoluteFilePathStub({
      value: cwd.slice(0, cwd.lastIndexOf('/packages/')),
    });

    const result = await architectureProjectMapBroker({
      projectRoot,
      packages: [PackageNameStub({ value: 'web' })],
    });
    const lines = String(result).split('\n');

    expect(lines.some((l) => l.endsWith('→ questQueueBroker'))).toBe(true);
  });

  it('INVALID: {real monorepo, packages: [nonexistent]} => throws with valid-names list', async () => {
    const cwd = String(processCwdAdapter());
    const projectRoot = AbsoluteFilePathStub({
      value: cwd.slice(0, cwd.lastIndexOf('/packages/')),
    });

    await expect(
      architectureProjectMapBroker({
        projectRoot,
        packages: [PackageNameStub({ value: 'nonexistent' })],
      }),
    ).rejects.toThrow(/Unknown package\(s\): nonexistent\. Valid: .*\bcli\b.*\bmcp\b.*\bweb\b/u);
  });
});
