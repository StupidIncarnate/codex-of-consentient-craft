import { registryEntryContract } from './registry-entry-contract';
import { RegistryEntryStub } from './registry-entry.stub';

describe('registryEntryContract', () => {
  describe('valid rows', () => {
    it('VALID: {pid, bootedAtMs, lastBeatMs set, state: "alive"} => parses a booted row', () => {
      const entry = RegistryEntryStub({
        id: 'inst_7f3a9c21',
        owner: '42781',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        specName: 'dungeonmaster-stack',
        specHash: 'a3f9c2e1',
        pid: 'proc-12345',
        pgids: [4821],
        socketPath: null,
        ports: { api: 34_172, web: 34_173 },
        state: 'alive',
        reservedAtMs: 1_700_000_000_000,
        bootedAtMs: 1_700_000_005_000,
        lastBeatMs: 1_700_000_010_000,
        prunedAtMs: null,
        prunedByRule: null,
      });

      const result = registryEntryContract.parse(entry);

      expect(result).toStrictEqual({
        id: 'inst_7f3a9c21',
        owner: '42781',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        specName: 'dungeonmaster-stack',
        specHash: 'a3f9c2e1',
        pid: 'proc-12345',
        pgids: [4821],
        socketPath: null,
        ports: { api: 34_172, web: 34_173 },
        state: 'alive',
        reservedAtMs: 1_700_000_000_000,
        bootedAtMs: 1_700_000_005_000,
        lastBeatMs: 1_700_000_010_000,
        prunedAtMs: null,
        prunedByRule: null,
        branch: null,
      });
    });

    it('VALID: {socketPath: a real path} => parses a booted row with its driver socket recorded', () => {
      const entry = RegistryEntryStub({
        id: 'inst_7f3a9c21',
        owner: '42781',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        specName: 'dungeonmaster-stack',
        specHash: 'a3f9c2e1',
        pid: 'proc-12345',
        pgids: [4821],
        socketPath: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
        ports: { api: 34_172, web: 34_173 },
        state: 'alive',
        reservedAtMs: 1_700_000_000_000,
        bootedAtMs: 1_700_000_005_000,
        lastBeatMs: 1_700_000_010_000,
        prunedAtMs: null,
        prunedByRule: null,
      });

      const result = registryEntryContract.parse(entry);

      expect(result).toStrictEqual({
        id: 'inst_7f3a9c21',
        owner: '42781',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        specName: 'dungeonmaster-stack',
        specHash: 'a3f9c2e1',
        pid: 'proc-12345',
        pgids: [4821],
        socketPath: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
        ports: { api: 34_172, web: 34_173 },
        state: 'alive',
        reservedAtMs: 1_700_000_000_000,
        bootedAtMs: 1_700_000_005_000,
        lastBeatMs: 1_700_000_010_000,
        prunedAtMs: null,
        prunedByRule: null,
        branch: null,
      });
    });

    it('VALID: {pid: null, bootedAtMs: null, lastBeatMs: null} => parses a reserved row', () => {
      const entry = RegistryEntryStub({
        id: 'inst_7f3a9c21',
        owner: '42781',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        specName: 'dungeonmaster-stack',
        specHash: 'a3f9c2e1',
        pid: null,
        pgids: [],
        socketPath: null,
        ports: { api: 34_172, web: 34_173 },
        state: 'alive',
        reservedAtMs: 1_700_000_000_000,
        bootedAtMs: null,
        lastBeatMs: null,
        prunedAtMs: null,
        prunedByRule: null,
      });

      const result = registryEntryContract.parse(entry);

      expect(result).toStrictEqual({
        id: 'inst_7f3a9c21',
        owner: '42781',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        specName: 'dungeonmaster-stack',
        specHash: 'a3f9c2e1',
        pid: null,
        pgids: [],
        socketPath: null,
        ports: { api: 34_172, web: 34_173 },
        state: 'alive',
        reservedAtMs: 1_700_000_000_000,
        bootedAtMs: null,
        lastBeatMs: null,
        prunedAtMs: null,
        prunedByRule: null,
        branch: null,
      });
    });

    it('VALID: {questId: null, guildId: null} => parses an unowned row', () => {
      const entry = RegistryEntryStub({
        id: 'inst_7f3a9c21',
        owner: '42781',
        questId: null,
        guildId: null,
        specName: 'dungeonmaster-stack',
        specHash: 'a3f9c2e1',
        pid: 'proc-12345',
        pgids: [4821],
        socketPath: null,
        ports: { api: 34_172, web: 34_173 },
        state: 'alive',
        reservedAtMs: 1_700_000_000_000,
        bootedAtMs: 1_700_000_005_000,
        lastBeatMs: 1_700_000_010_000,
        prunedAtMs: null,
        prunedByRule: null,
      });

      const result = registryEntryContract.parse(entry);

      expect(result).toStrictEqual({
        id: 'inst_7f3a9c21',
        owner: '42781',
        questId: null,
        guildId: null,
        specName: 'dungeonmaster-stack',
        specHash: 'a3f9c2e1',
        pid: 'proc-12345',
        pgids: [4821],
        socketPath: null,
        ports: { api: 34_172, web: 34_173 },
        state: 'alive',
        reservedAtMs: 1_700_000_000_000,
        bootedAtMs: 1_700_000_005_000,
        lastBeatMs: 1_700_000_010_000,
        prunedAtMs: null,
        prunedByRule: null,
        branch: null,
      });
    });

    it('VALID: {state: "pruned", prunedAtMs, prunedByRule set} => parses a tombstone row', () => {
      const entry = RegistryEntryStub({
        id: 'inst_7f3a9c21',
        owner: '42781',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        specName: 'dungeonmaster-stack',
        specHash: 'a3f9c2e1',
        pid: null,
        pgids: [],
        socketPath: null,
        ports: { api: 34_172, web: 34_173 },
        state: 'pruned',
        reservedAtMs: 1_700_000_000_000,
        bootedAtMs: 1_700_000_005_000,
        lastBeatMs: 1_700_000_010_000,
        prunedAtMs: 1_700_003_000_000,
        prunedByRule: 'olderThan 7d',
      });

      const result = registryEntryContract.parse(entry);

      expect(result).toStrictEqual({
        id: 'inst_7f3a9c21',
        owner: '42781',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        specName: 'dungeonmaster-stack',
        specHash: 'a3f9c2e1',
        pid: null,
        pgids: [],
        socketPath: null,
        ports: { api: 34_172, web: 34_173 },
        state: 'pruned',
        reservedAtMs: 1_700_000_000_000,
        bootedAtMs: 1_700_000_005_000,
        lastBeatMs: 1_700_000_010_000,
        prunedAtMs: 1_700_003_000_000,
        prunedByRule: 'olderThan 7d',
        branch: null,
      });
    });

    it('VALID: {branch: "feature/DEF-04"} => parses a row carrying a git branch name', () => {
      const entry = RegistryEntryStub({
        id: 'inst_7f3a9c21',
        branch: 'feature/DEF-04',
      });

      const result = registryEntryContract.parse(entry);

      expect(result.branch).toBe('feature/DEF-04');
    });
  });

  describe('invalid rows', () => {
    it('INVALID: {missing id} => throws Required', () => {
      expect(() =>
        registryEntryContract.parse({
          owner: '42781',
          questId: null,
          guildId: null,
          specName: 'dungeonmaster-stack',
          specHash: 'a3f9c2e1',
          pid: null,
          pgids: [],
          socketPath: null,
          ports: { api: 34_172, web: 34_173 },
          state: 'alive',
          reservedAtMs: 1_700_000_000_000,
          bootedAtMs: null,
          lastBeatMs: null,
          prunedAtMs: null,
          prunedByRule: null,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {state: "starting"} => throws for an unlisted InstanceState', () => {
      expect(() =>
        registryEntryContract.parse({
          id: 'inst_7f3a9c21',
          owner: '42781',
          questId: null,
          guildId: null,
          specName: 'dungeonmaster-stack',
          specHash: 'a3f9c2e1',
          pid: null,
          pgids: [],
          socketPath: null,
          ports: { api: 34_172, web: 34_173 },
          state: 'starting' as never,
          reservedAtMs: 1_700_000_000_000,
          bootedAtMs: null,
          lastBeatMs: null,
          prunedAtMs: null,
          prunedByRule: null,
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {questId: undefined} => an omitted-but-present key still requires a value', () => {
      expect(() =>
        registryEntryContract.parse({
          id: 'inst_7f3a9c21',
          owner: '42781',
          questId: undefined,
          guildId: null,
          specName: 'dungeonmaster-stack',
          specHash: 'a3f9c2e1',
          pid: null,
          pgids: [],
          socketPath: null,
          ports: { api: 34_172, web: 34_173 },
          state: 'alive',
          reservedAtMs: 1_700_000_000_000,
          bootedAtMs: null,
          lastBeatMs: null,
          prunedAtMs: null,
          prunedByRule: null,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing socketPath} => throws Required, because .nullable() is not .optional()', () => {
      expect(() =>
        registryEntryContract.parse({
          id: 'inst_7f3a9c21',
          owner: '42781',
          questId: null,
          guildId: null,
          specName: 'dungeonmaster-stack',
          specHash: 'a3f9c2e1',
          pid: null,
          pgids: [],
          ports: { api: 34_172, web: 34_173 },
          state: 'alive',
          reservedAtMs: 1_700_000_000_000,
          bootedAtMs: null,
          lastBeatMs: null,
          prunedAtMs: null,
          prunedByRule: null,
        }),
      ).toThrow(/Required/u);
    });
  });
});
