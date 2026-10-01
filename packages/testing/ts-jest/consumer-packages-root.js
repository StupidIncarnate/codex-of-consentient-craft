/**
 * Finds the `packages` folder of the repo whose tests Jest is running: the npm-workspaces root
 * above the directory Jest runs in. The transformers' cache versions hash that repo's proxy and
 * harness files. They cannot find it from their own location: through a `file:` link these files
 * sit inside the dungeonmaster checkout, and through an install they sit under `node_modules`.
 * Returns null when no ancestor package.json carries a `workspaces` field.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const consumerPackagesRoot = ({ startDir }) => {
  const manifestPath = path.join(startDir, 'package.json');
  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    : null;

  if (manifest !== null && manifest.workspaces !== undefined) {
    return path.join(startDir, 'packages');
  }

  const parentDir = path.dirname(startDir);
  return parentDir === startDir ? null : consumerPackagesRoot({ startDir: parentDir });
};

module.exports = { consumerPackagesRoot };
