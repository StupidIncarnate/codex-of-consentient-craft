/**
 * PURPOSE: Checks the one gateway-layout invariant a lint rule can verify cheaply: no two subpath
 * folders directly under a gateway package's `src/` may differ only by case. This
 * is the orchestrator ruling behind `@dungeonmaster/node/buffer` having no separate `Buffer`
 * subpath — TypeScript's `forceConsistentCasingInFileNames` refuses two such folders, and node10
 * resolution needs a real, unambiguous folder for every subpath. Every OTHER layout invariant
 * (a folder path must be an installed package specifier or subpath of one for `npm`; a Node
 * built-in or a global's exact name for `node`; the package.json `exports` map holding only
 * `"./*"` and `"./testing"`, never a per-subpath literal or a root `"."`) needs either the
 * package's own dependency graph or a platform-accurate global list ESLint's own Node process
 * cannot observe for a BROWSER package — those are cheaper and more honest as a unit test inside
 * each gateway package, recorded in `scrolls/gateway/followup-sustainability.md` item 31 rather than guessed at
 * here.
 *
 * USAGE:
 * const rule = ruleGatewayLayoutBroker();
 * // Flags packages/@gateway/node/src/URL/URL.ts if a sibling packages/@gateway/node/src/url/ also exists
 */
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isGatewayFileGuard } from '../../../guards/is-gateway-file/is-gateway-file-guard';
import { isGatewayBarrelFileGuard } from '../../../guards/is-gateway-barrel-file/is-gateway-barrel-file-guard';
import { fsReaddirSyncAdapter } from '../../../adapters/fs/readdir-sync/fs-readdir-sync-adapter';

export const ruleGatewayLayoutBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban two sibling gateway folders whose names differ only by case (node10 resolution and forceConsistentCasingInFileNames both refuse the ambiguity).',
      },
      messages: {
        caseCollision:
          'Gateway folder "{{folderName}}" differs from sibling "{{siblingFolderName}}" only by case, under "{{parentDir}}". Two sibling folders may never differ only by case — fold the global into the same-named module\'s pass-through instead.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ?? ctx.getFilename?.() ?? '';

    if (filename.length === 0 || !isGatewayFileGuard({ filename })) {
      return {};
    }

    const fileBaseName = filename.split('/').pop() ?? '';

    // One check per subpath folder is enough; every subpath folder has exactly one barrel, the
    // file named after the folder, directly under `src/`.
    if (!isGatewayBarrelFileGuard({ filename })) {
      return {};
    }

    return {
      Program: (node: Tsestree): void => {
        const ownFolderPath = filename.slice(0, filename.length - fileBaseName.length - 1);
        const ownFolderName = ownFolderPath.split('/').pop() ?? '';
        const parentDir = ownFolderPath.slice(0, ownFolderPath.length - ownFolderName.length - 1);

        const siblingEntries = fsReaddirSyncAdapter({
          dirPath: filePathContract.parse(parentDir),
        }).filter((entry) => entry.isDirectory);

        const collidingSibling = siblingEntries.find(
          (entry) =>
            entry.name !== ownFolderName &&
            entry.name.toLowerCase() === ownFolderName.toLowerCase(),
        );

        if (collidingSibling === undefined) {
          return;
        }

        ctx.report({
          node,
          messageId: 'caseCollision',
          data: {
            folderName: ownFolderName,
            siblingFolderName: collidingSibling.name,
            parentDir,
          },
        });
      },
    };
  },
});
