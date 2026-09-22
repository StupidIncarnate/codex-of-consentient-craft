import { SiegelenseStartLayerFlow } from './siegelense-start-layer-flow';

// `start` needs a live driver process to prove anything past this point (siegelense-flow.integration
// .test.ts:837-843, restated for this file since it now owns `start`'s own wiring): a successful boot
// spawns a real OS process, opens a real port pair, and writes a real `InstanceManifest`. Every case
// below is one this layer CAN prove honestly with no driver at all — `startArgsParseTransformer`
// throws before `SiegelenseStartResponder` (and therefore `instanceStartBroker`) is ever called, so
// each one exercises the real flow → parse wiring end to end and stops there.
//
// Left uncovered here, and why: `--quest` alone, `--guild` alone, a non-null `--seed` reaching
// `InstanceManifest.seeded`, `--idle-timeout-ms`'s omitted-vs-raised ceiling, and `--json` versus the
// rendered summary all only diverge AFTER a successful `instanceStartBroker` call — there is no
// refusal to catch. Proving them needs either (a) `siegelense-start-responder.test.ts`, the
// `responders/`-layer file that already mocks `instanceStartBroker` via
// `SiegelenseStartResponderProxy` (architecture forbids `flows/` importing `brokers/`, confirmed by
// `enforce-import-dependencies` — this file cannot stage that same mock), or (b) a real boot through
// this flow via `--spec`, following `driver-flow.integration.test.ts`'s `driverFleetHarness` pattern
// (a ~20s successful boot, a 220s ceiling for a failed one, and its own fake-CLI env setup).
describe('SiegelenseStartLayerFlow', () => {
  describe('--spec is missing', () => {
    it('INVALID: {callArgs: []} => refuses naming --spec as required', async () => {
      await expect(SiegelenseStartLayerFlow({ callArgs: [] })).rejects.toThrow(
        /^--spec is required: name the lane spec to boot\.$/u,
      );
    });

    it('INVALID: {callArgs: --quest and --guild but no --spec} => refuses naming --spec as required', async () => {
      await expect(
        SiegelenseStartLayerFlow({
          callArgs: ['--quest', 'add-auth', '--guild', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'],
        }),
      ).rejects.toThrow(/^--spec is required: name the lane spec to boot\.$/u);
    });
  });

  describe('an unrecognised flag', () => {
    it('INVALID: {callArgs: --bogus X} => refuses naming the flag and listing the accepted ones', async () => {
      await expect(SiegelenseStartLayerFlow({ callArgs: ['--bogus', 'X'] })).rejects.toThrow(
        /^Unknown flag: --bogus\n\nAccepted flags: --spec, --quest, --guild, --idle-timeout-ms, --seed, --json\n\nUsage: dungeonmaster siegelense start --spec <specName> \[--quest <questId>\] \[--guild <guildId>\] \[--seed <recipeName>\] \[--idle-timeout-ms <ms>\] \[--json\]$/u,
      );
    });
  });

  describe('a bare positional argument', () => {
    it('INVALID: {callArgs: [dungeonmaster-stack]} => refuses naming it', async () => {
      await expect(SiegelenseStartLayerFlow({ callArgs: ['dungeonmaster-stack'] })).rejects.toThrow(
        /^Unexpected positional argument: dungeonmaster-stack\n\nEvery value must directly follow the flag it belongs to\.\n\nUsage: dungeonmaster siegelense start --spec <specName> \[--quest <questId>\] \[--guild <guildId>\] \[--seed <recipeName>\] \[--idle-timeout-ms <ms>\] \[--json\]$/u,
      );
    });
  });

  describe('--spec present with a badly-shaped value', () => {
    it('INVALID: {callArgs: --spec ""} => refuses naming --spec and specNameContract\'s own message', async () => {
      await expect(SiegelenseStartLayerFlow({ callArgs: ['--spec', ''] })).rejects.toThrow(
        /^--spec: String must contain at least 1 character\(s\)$/u,
      );
    });
  });

  describe('--quest present with a badly-shaped value', () => {
    it('INVALID: {callArgs: --spec dungeonmaster-stack --quest ""} => refuses naming --quest and questIdContract\'s own message', async () => {
      await expect(
        SiegelenseStartLayerFlow({
          callArgs: ['--spec', 'dungeonmaster-stack', '--quest', ''],
        }),
      ).rejects.toThrow(/^--quest: String must contain at least 1 character\(s\)$/u);
    });
  });

  describe('--guild present with a badly-shaped value', () => {
    it("INVALID: {callArgs: --spec dungeonmaster-stack --guild not-a-uuid} => refuses naming --guild and guildIdContract's own message", async () => {
      await expect(
        SiegelenseStartLayerFlow({
          callArgs: ['--spec', 'dungeonmaster-stack', '--guild', 'not-a-uuid'],
        }),
      ).rejects.toThrow(/^--guild: Invalid uuid$/u);
    });
  });

  describe('--seed present with a badly-shaped value', () => {
    it("INVALID: {callArgs: --spec dungeonmaster-stack --seed 'Not Kebab'} => refuses naming --seed and the kebab rule", async () => {
      await expect(
        SiegelenseStartLayerFlow({
          callArgs: ['--spec', 'dungeonmaster-stack', '--seed', 'Not Kebab'],
        }),
      ).rejects.toThrow(/^--seed: Recipe name must be kebab-case/u);
    });
  });

  describe('--idle-timeout-ms present with a badly-shaped value', () => {
    it('INVALID: {callArgs: --spec dungeonmaster-stack --idle-timeout-ms not-a-number} => refuses naming --idle-timeout-ms', async () => {
      await expect(
        SiegelenseStartLayerFlow({
          callArgs: ['--spec', 'dungeonmaster-stack', '--idle-timeout-ms', 'not-a-number'],
        }),
      ).rejects.toThrow(/^--idle-timeout-ms: Expected number, received nan$/u);
    });
  });
});
