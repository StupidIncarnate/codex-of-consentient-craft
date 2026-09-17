// D11 — the recipes package was never built. Driven against an ISOLATED fake repo root under
// tmp/round-d/ (never the real packages/siegelense-recipes/dist, which other concurrent sessions in
// this worktree may depend on) — `recipesLocateBroker` walks up from `process.cwd()` to the nearest
// `.dungeonmaster.json`, so a scratch directory carrying that marker is a real, if synthetic, repo
// root as far as the broker is concerned. Two sub-cases: the package directory absent entirely, and
// present but never built (no dist/index.js).
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { recipesLocateBroker } from '../../packages/siegelense/src/brokers/recipes/locate/recipes-locate-broker';
import { recipesReadBroker } from '../../packages/siegelense/src/brokers/recipes/read/recipes-read-broker';

const REPO_ROOT_FOR_RESTORE = '/home/brutus-home/projects/codex-of-consentient-craft/worktrees/recipes-doc';

const withFakeRepoRoot = async ({
  label,
  setup,
  run,
}: {
  label: string;
  setup: (repoRoot: string) => void;
  run: () => Promise<unknown>;
}) => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'dm-d11-'));
  writeFileSync(join(repoRoot, '.dungeonmaster.json'), '{}');
  setup(repoRoot);
  process.chdir(repoRoot);
  console.log(`=== ${label} ===`);
  try {
    const result = await run();
    console.log('RESOLVED (unexpected):', JSON.stringify(result));
  } catch (error) {
    console.log(
      'THREW:',
      error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error),
    );
  }
  process.chdir(REPO_ROOT_FOR_RESTORE);
  rmSync(repoRoot, { recursive: true, force: true });
};

(async () => {
  await withFakeRepoRoot({
    label: 'D11a — packages/siegelense-recipes does not exist at all (locate)',
    setup: () => undefined,
    run: () => recipesLocateBroker(),
  });

  await withFakeRepoRoot({
    label: 'D11b — packages/siegelense-recipes exists, never built (no dist/index.js) (locate)',
    setup: (repoRoot) => {
      mkdirSync(join(repoRoot, 'packages', 'siegelense-recipes'), { recursive: true });
    },
    run: () => recipesLocateBroker(),
  });

  await withFakeRepoRoot({
    label: 'D11c — same as D11a, through the LISTING broker (recipesReadBroker) rather than locate directly',
    setup: () => undefined,
    run: () => recipesReadBroker(),
  });

  await withFakeRepoRoot({
    label: 'D11d — same as D11b, through the LISTING broker (recipesReadBroker)',
    setup: (repoRoot) => {
      mkdirSync(join(repoRoot, 'packages', 'siegelense-recipes'), { recursive: true });
    },
    run: () => recipesReadBroker(),
  });
})();
