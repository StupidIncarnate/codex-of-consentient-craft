/**
 * PURPOSE: Proxy for PrepareQuestPackageGraphLayerResponder — the layer is pure apart from one
 * manifest read per declared package, so this stages those reads by path. Nothing is staged in the
 * constructor: a catch-all would answer an unaddressed read and the layer's own degrade-on-throw
 * path would swallow it, turning a mis-staged test green.
 *
 * `setupRealWorkspaceManifests` stages this repo's OWN `packages/*` manifests, verbatim off disk,
 * so a test can assert the layering the workspace actually has rather than one transcribed by hand
 * into a fixture — a transcription goes stale silently the moment a `package.json` gains a
 * dependency, which is the whole failure the derived assertion exists to catch.
 *
 * USAGE:
 * const proxy = PrepareQuestPackageGraphLayerResponderProxy();
 * proxy.setupManifest({ location: './packages/web', packageJson: { name: '@dm/web', dependencies: { '@dm/shared': '*' } } });
 * proxy.setupManifestUnreadable({ location: './packages/gone' });
 * const packagesAffected = proxy.setupRealWorkspaceManifests();
 */

import { existsSync, readFileSync, readdirSync } from '#gateway/node/fs';
import { join, resolve } from '#gateway/node/path';

import { QuestPackageEntryStub } from '@dungeonmaster/shared/contracts';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

// This file lives at packages/orchestrator/src/responders/orchestration/start/, so the workspace
// root is five directories up. Resolved from __dirname rather than cwd because jest's working
// directory differs between a package-scoped run and a root ward run.
const WORKSPACE_ROOT = resolve(__dirname, '..', '..', '..', '..', '..');

export const PrepareQuestPackageGraphLayerResponderProxy = (): {
  setupManifest: (params: { location: string; packageJson: unknown }) => void;
  setupManifestUnreadable: (params: { location: string }) => void;
  setupRealWorkspaceManifests: () => ReturnType<typeof QuestPackageEntryStub>[];
} => {
  const readFileHandle = readFileProxy();

  return {
    setupRealWorkspaceManifests: (): ReturnType<typeof QuestPackageEntryStub>[] =>
      readdirSync(WORKSPACE_ROOT)
        .filter((entry) => existsSync(join(WORKSPACE_ROOT, entry, 'package.json')))
        .sort((left, right) => left.localeCompare(right))
        .map((entry) => {
          const location = `./packages/${entry}`;
          readFileHandle.returns({
            path: `${location}/package.json`,
            contents: readFileSync(join(WORKSPACE_ROOT, entry, 'package.json')),
          });
          // `packageType` is not derivable without the on-disk detector and does not enter the
          // depth computation, so every entry declares the same neutral kind.
          return QuestPackageEntryStub({
            name: entry,
            location,
            changeType: 'edit',
            packageType: 'library',
          });
        }),

    setupManifest: ({
      location,
      packageJson,
    }: {
      location: string;
      packageJson: unknown;
    }): void => {
      readFileHandle.returns({
        path: `${location}/package.json`,
        contents: JSON.stringify(packageJson),
      });
    },

    setupManifestUnreadable: ({ location }: { location: string }): void => {
      readFileHandle.missing({ path: `${location}/package.json` });
    },
  };
};
