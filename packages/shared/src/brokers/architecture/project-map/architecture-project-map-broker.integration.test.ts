/**
 * PURPOSE: Regression test for project-map composer against the real monorepo.
 *
 * Locks in classification, structural sections, and key adapter rendering against the live
 * codebase so future changes can't silently break the format. Aligned with `tmp/server-map.md`
 * as the locked format target — when the server section eventually byte-matches that file,
 * tighten this test to a full string comparison per plan step 29.
 */

import { architectureProjectMapBroker } from './architecture-project-map-broker';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { processCwdAdapter } from '../../../adapters/process/cwd/process-cwd-adapter';

describe('architectureProjectMapBroker (integration with real monorepo)', () => {
  it('VALID: {real monorepo} => classifies every package by its architecture role', async () => {
    const cwd = String(processCwdAdapter());
    const projectRoot = AbsoluteFilePathStub({
      value: cwd.slice(0, cwd.lastIndexOf('/packages/')),
    });

    const result = await architectureProjectMapBroker({ projectRoot });
    const lines = String(result).split('\n');

    expect(lines.some((l) => l === '# server [http-backend]')).toBe(true);
    expect(lines.some((l) => l === '# orchestrator [programmatic-service]')).toBe(true);
    expect(lines.some((l) => l === '# mcp [mcp-server]')).toBe(true);
    expect(lines.some((l) => l === '# web [frontend-react]')).toBe(true);
    expect(lines.some((l) => l === '# hooks [hook-handlers]')).toBe(true);
    expect(lines.some((l) => l === '# eslint-plugin [eslint-plugin]')).toBe(true);
    expect(lines.some((l) => l === '# local-eslint [eslint-plugin]')).toBe(true);
    expect(lines.some((l) => l === '# cli [cli-tool]')).toBe(true);
    expect(lines.some((l) => l === '# ward [cli-tool]')).toBe(true);
    expect(lines.some((l) => l === '# tooling [cli-tool]')).toBe(true);
    expect(lines.some((l) => l === '# shared [library]')).toBe(true);
    expect(lines.some((l) => l === '# config [library]')).toBe(true);
    expect(lines.some((l) => l === '# testing [library]')).toBe(true);
  });

  it('VALID: {real monorepo} => emits Boot header', async () => {
    const cwd = String(processCwdAdapter());
    const projectRoot = AbsoluteFilePathStub({
      value: cwd.slice(0, cwd.lastIndexOf('/packages/')),
    });

    const result = await architectureProjectMapBroker({ projectRoot });
    const lines = String(result).split('\n');

    expect(lines.some((l) => l === '## Boot')).toBe(true);
  });

  it('VALID: {real monorepo} => renders cross-package adapters as slash-paths', async () => {
    const cwd = String(processCwdAdapter());
    const projectRoot = AbsoluteFilePathStub({
      value: cwd.slice(0, cwd.lastIndexOf('/packages/')),
    });

    const result = await architectureProjectMapBroker({ projectRoot });
    const lines = String(result).split('\n');

    expect(lines.some((l) => l === '      → adapters/orchestrator/get-quest')).toBe(true);
    expect(lines.some((l) => l === '      → adapters/orchestrator/start-quest')).toBe(true);
    expect(lines.some((l) => l === '      → adapters/orchestrator/list-quests')).toBe(true);
  });

  it('VALID: {real monorepo} => emits exactly one --- separator after URL pairing block before first package', async () => {
    const cwd = String(processCwdAdapter());
    const projectRoot = AbsoluteFilePathStub({
      value: cwd.slice(0, cwd.lastIndexOf('/packages/')),
    });

    const result = await architectureProjectMapBroker({ projectRoot });
    const lines = String(result).split('\n');
    const urlBlockIdx = lines.findIndex((l) => l.startsWith('**URL pairing convention**'));
    const after = lines.slice(urlBlockIdx + 1, urlBlockIdx + 5);

    expect(after).toStrictEqual(['', '---', '', '# cli [cli-tool]']);
  });

  it('VALID: {real monorepo} => emits pointer footer at the end with no EDGES section', async () => {
    const cwd = String(processCwdAdapter());
    const projectRoot = AbsoluteFilePathStub({
      value: cwd.slice(0, cwd.lastIndexOf('/packages/')),
    });

    const result = await architectureProjectMapBroker({ projectRoot });
    const lines = String(result).split('\n');

    expect(lines.some((l) => l === '## EDGES')).toBe(false);
    expect(lines[lines.length - 1]).toBe(
      '> Call `get-project-inventory({ packageName })` for the per-package folder/file detail.',
    );
  });
});
