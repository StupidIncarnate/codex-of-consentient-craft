import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { workspaceManifestEntriesVerifyBroker } from './workspace-manifest-entries-verify-broker';

// The unit tests beside this one all mock fs, so every one of them stays green against a
// package.json whose main/exports/types point nowhere real — the mock answers whatever the test
// tells it to. Every ward check also sets --conditions=source (sourceConditionSupportedBroker), so
// even a check that DID resolve the real @dungeonmaster/cli package would resolve straight past a
// broken main/exports to the TypeScript the "source" condition names, and never see the mismatch a
// real consumer's `require` (no such condition) hits. This is the only test that reads THIS repo's
// own real packages/cli/package.json and stats its real dist/ tree, which is what proves the
// manifest and the compiled output agree the way a real install does.
//
// PREREQUISITE: packages/cli must be built (`npm run build --workspace=@dungeonmaster/cli`) —
// against an unbuilt tree every declared entry is "missing" for the mundane reason that dist/
// does not exist yet, the same caveat packages/cli/bin/cli-entry.integration.test.ts documents.
describe('workspaceManifestEntriesVerifyBroker (integration) — this repo’s real packages/cli manifest', () => {
  it('VALID: {packages/cli, built} => every declared main/exports/types entry exists on disk', async () => {
    const packagePath = AbsoluteFilePathStub({
      value: `${__dirname}/../../../../../../packages/cli`,
    });

    const missing = await workspaceManifestEntriesVerifyBroker({ packagePath });

    expect(missing).toStrictEqual([]);
  });
});
