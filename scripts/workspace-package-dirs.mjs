#!/usr/bin/env node
/**
 * Lists the real workspace package directories under `packages/`, relative to it, one level deep
 * with one exception: a directory whose OWN name starts with `@` is a scope/group folder — the
 * same nesting `node_modules/@scope/name` uses — not a package itself, so its children are listed
 * in its place (`@gateway/npm`, not `@gateway`). Shared by build-workspaces.mjs and
 * check-published-output.mjs so the two scripts can't drift on what counts as a package.
 */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const GROUP_FOLDER_PREFIX = '@';

export const listWorkspacePackageDirs = ({ packagesDir }) => {
  const dirNames = [];

  for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (!entry.name.startsWith(GROUP_FOLDER_PREFIX)) {
      dirNames.push(entry.name);
      continue;
    }

    for (const child of readdirSync(join(packagesDir, entry.name), { withFileTypes: true })) {
      if (child.isDirectory()) {
        dirNames.push(`${entry.name}/${child.name}`);
      }
    }
  }

  return dirNames;
};
