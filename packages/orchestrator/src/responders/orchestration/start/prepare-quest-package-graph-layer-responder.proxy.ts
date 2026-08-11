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

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

import { FilePathStub, QuestPackageEntryStub } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

// This file lives at packages/orchestrator/src/responders/orchestration/start/, so the workspace
// root is five directories up. Resolved from __dirname rather than cwd because jest's working
// directory differs between a package-scoped run and a root ward run.
const WORKSPACE_ROOT = resolve(__dirname, '..', '..', '..', '..', '..');

export const PrepareQuestPackageGraphLayerResponderProxy = (): {
  setupManifest: (params: { location: string; packageJson: unknown }) => void;
  setupManifestUnreadable: (params: { location: string }) => void;
  setupRealWorkspaceManifests: () => ReturnType<typeof QuestPackageEntryStub>[];
} => {
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupRealWorkspaceManifests: (): ReturnType<typeof QuestPackageEntryStub>[] =>
      readdirSync(WORKSPACE_ROOT)
        .filter((entry) => existsSync(join(WORKSPACE_ROOT, entry, 'package.json')))
        .sort((left, right) => left.localeCompare(right))
        .map((entry) => {
          const location = `./packages/${entry}`;
          readFileProxy.resolves({
            filePath: FilePathStub({ value: `${location}/package.json` }),
            content: readFileSync(join(WORKSPACE_ROOT, entry, 'package.json'), 'utf-8'),
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
      readFileProxy.resolves({
        filePath: FilePathStub({ value: `${location}/package.json` }),
        content: JSON.stringify(packageJson),
      });
    },

    setupManifestUnreadable: ({ location }: { location: string }): void => {
      readFileProxy.rejects({
        filePath: FilePathStub({ value: `${location}/package.json` }),
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },
  };
};
