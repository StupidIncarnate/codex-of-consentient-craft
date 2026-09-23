import {
  AbsoluteFilePathStub,
  FilePathStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  GuildIdStub,
  ObservableIdStub,
  QuestIdStub,
  QuestNoteStub,
  QuestStub,
  SiegeInstanceIdStub,
  SiegeRunIdStub,
} from '@dungeonmaster/shared/contracts';

import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { citationResolveBroker } from './citation-resolve-broker';
import { citationResolveBrokerProxy } from './citation-resolve-broker.proxy';

const HOME_DIR = '/home/user';
const HOME = '/home/user/.dungeonmaster';
const GUILD = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const GUILD_DIR = `${HOME}/guilds/${GUILD}`;
const QUEST = 'add-auth';
const QUEST_FOLDER = `${GUILD_DIR}/quests/${QUEST}`;
const QUEST_FILE = `${QUEST_FOLDER}/quest.json`;
const WORKTREE = '/repo/worktrees/add-auth-7bc217a1';
const PLANS_DIR = `${WORKTREE}/.quest-plans`;
const INSTANCE = 'inst_9b2c0001';
const OTHER_INSTANCE = 'inst_1d090002';
// Resolved for real through `pathJoinAdapter`'s passthrough off `osHomedirAdapterProxy`'s standing
// '/home/default', since the quest-folder staging above spends its one homedir answer on the quest
// record's own path.
const SIEGE_RUNS = `/home/default/.dungeonmaster/siegelense/guilds/${GUILD}/instances/${INSTANCE}/runs`;

const OPEN_ISSUE_WHY =
  'not checked: no issue record exists to check. Nothing in this repo stores an issue carrying ' +
  "a typed instanceId/runId — a workItem's own observation carries neither field and questNoteKindContract has " +
  'no issue member — so a walker records a defect as a failing test or as prose in a note, ' +
  'neither of which a resolver can match an instance against.';

const NO_PRELUDE_WHY =
  'not checked: the quest records no worktree, so there is no .quest-plans directory to read ' +
  'preludes out of.';

describe('citationResolveBroker', () => {
  describe('an instance nobody orchestrated', () => {
    it('EMPTY: {questId: null} => nothing cites it, nothing went unchecked, and it is not blocked — the unowned case working as intended', async () => {
      citationResolveBrokerProxy();

      const result = await citationResolveBroker({
        entry: RegistryEntryStub({
          id: InstanceIdStub({ value: INSTANCE }),
          questId: null,
          guildId: null,
        }),
        runIds: [],
      });

      expect(result).toStrictEqual({ references: [], gaps: [], blocked: null });
    });
  });

  describe('a quest recorded with no guild', () => {
    it('INVALID: {questId set, guildId null} => blocked naming both ids, rather than reading an unreachable record as uncited', async () => {
      citationResolveBrokerProxy();

      const result = await citationResolveBroker({
        entry: RegistryEntryStub({
          id: InstanceIdStub({ value: INSTANCE }),
          questId: QuestIdStub({ value: QUEST }),
          guildId: null,
        }),
        runIds: [],
      });

      expect(result).toStrictEqual({
        references: [],
        gaps: [],
        blocked:
          'quest add-auth is recorded on inst_9b2c0001 but no guild is, and a quest record ' +
          'resolves through its guild — refusing rather than treating an unreachable record as uncited.',
      });
    });
  });

  describe('a quest record that is not there', () => {
    it('ERROR: {quest.json missing} => blocked naming the path a caller can go and look at', async () => {
      const proxy = citationResolveBrokerProxy();
      proxy.setupQuestFolder({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: GUILD_DIR }),
        guildQuestsPath: FilePathStub({ value: `${GUILD_DIR}/quests` }),
        questFolderPath: FilePathStub({ value: QUEST_FOLDER }),
      });
      proxy.setupQuestRecordMissing({ filePath: AbsoluteFilePathStub({ value: QUEST_FILE }) });

      const result = await citationResolveBroker({
        entry: RegistryEntryStub({
          id: InstanceIdStub({ value: INSTANCE }),
          questId: QuestIdStub({ value: QUEST }),
          guildId: GuildIdStub({ value: GUILD }),
        }),
        runIds: [],
      });

      expect(result).toStrictEqual({
        references: [],
        gaps: [],
        blocked:
          `quest add-auth is recorded on inst_9b2c0001 but no quest record exists at ${QUEST_FILE} ` +
          '— refusing rather than treating an unreadable record as uncited.',
      });
    });
  });

  describe('a quest record that will not parse', () => {
    it('ERROR: {quest.json is not JSON} => blocked, and the reason opens with the path and the thrown error class', async () => {
      const proxy = citationResolveBrokerProxy();
      proxy.setupQuestFolder({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: GUILD_DIR }),
        guildQuestsPath: FilePathStub({ value: `${GUILD_DIR}/quests` }),
        questFolderPath: FilePathStub({ value: QUEST_FOLDER }),
      });
      proxy.setupQuestRecord({
        filePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        contents: '{ not json',
      });

      const result = await citationResolveBroker({
        entry: RegistryEntryStub({
          id: InstanceIdStub({ value: INSTANCE }),
          questId: QuestIdStub({ value: QUEST }),
          guildId: GuildIdStub({ value: GUILD }),
        }),
        runIds: [],
      });

      // Sliced rather than matched whole: the rest of the sentence is V8's own SyntaxError text,
      // which is not a value this repo controls across Node versions.
      const expectedOpening =
        `the quest record at ${QUEST_FILE} is not readable JSON, so whether it still cites ` +
        'inst_9b2c0001 cannot be established: SyntaxError';

      expect(String(result.blocked).slice(0, expectedOpening.length)).toBe(expectedOpening);
    });

    it("ERROR: {quest.json is JSON but not a quest} => blocked, carrying the contract's own complaint", async () => {
      const proxy = citationResolveBrokerProxy();
      proxy.setupQuestFolder({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: GUILD_DIR }),
        guildQuestsPath: FilePathStub({ value: `${GUILD_DIR}/quests` }),
        questFolderPath: FilePathStub({ value: QUEST_FOLDER }),
      });
      proxy.setupQuestRecord({
        filePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        contents: JSON.stringify({ id: 'add-auth' }),
      });

      const result = await citationResolveBroker({
        entry: RegistryEntryStub({
          id: InstanceIdStub({ value: INSTANCE }),
          questId: QuestIdStub({ value: QUEST }),
          guildId: GuildIdStub({ value: GUILD }),
        }),
        runIds: [],
      });

      expect(result.blocked).toBe(
        `the quest record at ${QUEST_FILE} did not parse, so whether it still cites ` +
          'inst_9b2c0001 cannot be established: Required; Required; Required; Required; Required',
      );
    });
  });

  describe("an open quest's WALKED line", () => {
    it('VALID: {a walked note naming this instance and run_7} => refused, and the refusal names the real quest file and the real run id', async () => {
      const proxy = citationResolveBrokerProxy();
      proxy.setupQuestFolder({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: GUILD_DIR }),
        guildQuestsPath: FilePathStub({ value: `${GUILD_DIR}/quests` }),
        questFolderPath: FilePathStub({ value: QUEST_FOLDER }),
      });
      proxy.setupQuestRecord({
        filePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        contents: JSON.stringify(
          QuestStub({
            status: 'in_progress',
            worktreePath: AbsoluteFilePathStub({ value: WORKTREE }),
            planningNotes: {
              blightLedger: [],
              operationPlans: [],
              questNotes: [
                QuestNoteStub({
                  id: 'walked-path-3' as never,
                  kind: 'walked',
                  instanceId: SiegeInstanceIdStub({ value: INSTANCE }),
                  runId: SiegeRunIdStub({ value: 'run_7' }),
                }),
              ],
            },
          }),
        ),
      });
      proxy.setupPlansDir({ dirPath: AbsoluteFilePathStub({ value: PLANS_DIR }), entries: [] });

      const result = await citationResolveBroker({
        entry: RegistryEntryStub({
          id: InstanceIdStub({ value: INSTANCE }),
          questId: QuestIdStub({ value: QUEST }),
          guildId: GuildIdStub({ value: GUILD }),
        }),
        runIds: [RunIdStub({ value: 'run_7' })],
      });

      expect(result).toStrictEqual({
        references: [
          {
            kind: 'walked-note',
            instanceId: INSTANCE,
            runId: 'run_7',
            citingFile: QUEST_FILE,
            why: `run_7 cited by a WALKED note on open quest add-auth (in_progress) in ${QUEST_FILE}`,
          },
        ],
        gaps: [{ kind: 'open-issue', why: OPEN_ISSUE_WHY }],
        blocked: null,
      });
    });

    it('VALID: {a walked note naming a DIFFERENT instance} => nothing cites this one', async () => {
      const proxy = citationResolveBrokerProxy();
      proxy.setupQuestFolder({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: GUILD_DIR }),
        guildQuestsPath: FilePathStub({ value: `${GUILD_DIR}/quests` }),
        questFolderPath: FilePathStub({ value: QUEST_FOLDER }),
      });
      proxy.setupQuestRecord({
        filePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        contents: JSON.stringify(
          QuestStub({
            status: 'in_progress',
            worktreePath: AbsoluteFilePathStub({ value: WORKTREE }),
            planningNotes: {
              blightLedger: [],
              operationPlans: [],
              questNotes: [
                QuestNoteStub({
                  id: 'walked-path-3' as never,
                  kind: 'walked',
                  instanceId: SiegeInstanceIdStub({ value: OTHER_INSTANCE }),
                  runId: SiegeRunIdStub({ value: 'run_7' }),
                }),
              ],
            },
          }),
        ),
      });
      proxy.setupPlansDir({ dirPath: AbsoluteFilePathStub({ value: PLANS_DIR }), entries: [] });

      const result = await citationResolveBroker({
        entry: RegistryEntryStub({
          id: InstanceIdStub({ value: INSTANCE }),
          questId: QuestIdStub({ value: QUEST }),
          guildId: GuildIdStub({ value: GUILD }),
        }),
        runIds: [RunIdStub({ value: 'run_7' })],
      });

      expect(result.references).toStrictEqual([]);
    });

    it('VALID: {the same walked note on a COMPLETE quest} => no longer cited, because the walk is over', async () => {
      const proxy = citationResolveBrokerProxy();
      proxy.setupQuestFolder({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: GUILD_DIR }),
        guildQuestsPath: FilePathStub({ value: `${GUILD_DIR}/quests` }),
        questFolderPath: FilePathStub({ value: QUEST_FOLDER }),
      });
      proxy.setupQuestRecord({
        filePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        contents: JSON.stringify(
          QuestStub({
            status: 'complete',
            worktreePath: AbsoluteFilePathStub({ value: WORKTREE }),
            planningNotes: {
              blightLedger: [],
              operationPlans: [],
              questNotes: [
                QuestNoteStub({
                  id: 'walked-path-3' as never,
                  kind: 'walked',
                  instanceId: SiegeInstanceIdStub({ value: INSTANCE }),
                  runId: SiegeRunIdStub({ value: 'run_7' }),
                }),
              ],
            },
          }),
        ),
      });
      proxy.setupPlansDir({ dirPath: AbsoluteFilePathStub({ value: PLANS_DIR }), entries: [] });

      const result = await citationResolveBroker({
        entry: RegistryEntryStub({
          id: InstanceIdStub({ value: INSTANCE }),
          questId: QuestIdStub({ value: QUEST }),
          guildId: GuildIdStub({ value: GUILD }),
        }),
        runIds: [RunIdStub({ value: 'run_7' })],
      });

      expect(result.references).toStrictEqual([]);
    });

    it('VALID: {an out-of-scope note naming this instance} => not a citation, because only a walked note records a drive', async () => {
      const proxy = citationResolveBrokerProxy();
      proxy.setupQuestFolder({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: GUILD_DIR }),
        guildQuestsPath: FilePathStub({ value: `${GUILD_DIR}/quests` }),
        questFolderPath: FilePathStub({ value: QUEST_FOLDER }),
      });
      proxy.setupQuestRecord({
        filePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        contents: JSON.stringify(
          QuestStub({
            status: 'in_progress',
            worktreePath: AbsoluteFilePathStub({ value: WORKTREE }),
            planningNotes: {
              blightLedger: [],
              operationPlans: [],
              questNotes: [
                QuestNoteStub({
                  id: 'out-of-scope-thing' as never,
                  kind: 'out-of-scope',
                  instanceId: SiegeInstanceIdStub({ value: INSTANCE }),
                  runId: SiegeRunIdStub({ value: 'run_7' }),
                }),
              ],
            },
          }),
        ),
      });
      proxy.setupPlansDir({ dirPath: AbsoluteFilePathStub({ value: PLANS_DIR }), entries: [] });

      const result = await citationResolveBroker({
        entry: RegistryEntryStub({
          id: InstanceIdStub({ value: INSTANCE }),
          questId: QuestIdStub({ value: QUEST }),
          guildId: GuildIdStub({ value: GUILD }),
        }),
        runIds: [RunIdStub({ value: 'run_7' })],
      });

      expect(result.references).toStrictEqual([]);
    });
  });

  describe('a VERIFIED prelude', () => {
    it('VALID: {a prelude naming run_7 and an instance holding run_7} => refused, and the refusal names the real plan file', async () => {
      const proxy = citationResolveBrokerProxy();
      proxy.setupQuestFolder({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: GUILD_DIR }),
        guildQuestsPath: FilePathStub({ value: `${GUILD_DIR}/quests` }),
        questFolderPath: FilePathStub({ value: QUEST_FOLDER }),
      });
      proxy.setupQuestRecord({
        filePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        contents: JSON.stringify(
          QuestStub({
            status: 'in_progress',
            worktreePath: AbsoluteFilePathStub({ value: WORKTREE }),
          }),
        ),
      });
      proxy.setupPlansDir({
        dirPath: AbsoluteFilePathStub({ value: PLANS_DIR }),
        entries: ['path-3.md'],
      });
      proxy.setupPlanFile({
        filePath: AbsoluteFilePathStub({ value: `${PLANS_DIR}/path-3.md` }),
        contents:
          '# PATH 3\n  seed  subagent-chain-arrives\n' +
          '  VERIFIED  run_7 · 2026-09-14 · prelude reached the entry, all produces: asserted\n',
      });

      const result = await citationResolveBroker({
        entry: RegistryEntryStub({
          id: InstanceIdStub({ value: INSTANCE }),
          questId: QuestIdStub({ value: QUEST }),
          guildId: GuildIdStub({ value: GUILD }),
        }),
        runIds: [RunIdStub({ value: 'run_7' })],
      });

      expect(result).toStrictEqual({
        references: [
          {
            kind: 'verified-prelude',
            instanceId: INSTANCE,
            runId: 'run_7',
            citingFile: `${PLANS_DIR}/path-3.md`,
            why: `run_7 cited by a VERIFIED prelude in ${PLANS_DIR}/path-3.md`,
          },
        ],
        gaps: [{ kind: 'open-issue', why: OPEN_ISSUE_WHY }],
        blocked: null,
      });
    });

    it("VALID: {a prelude naming run_7 and an instance holding only run_2} => nothing cites it, because the run named is not this instance's", async () => {
      const proxy = citationResolveBrokerProxy();
      proxy.setupQuestFolder({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: GUILD_DIR }),
        guildQuestsPath: FilePathStub({ value: `${GUILD_DIR}/quests` }),
        questFolderPath: FilePathStub({ value: QUEST_FOLDER }),
      });
      proxy.setupQuestRecord({
        filePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        contents: JSON.stringify(
          QuestStub({
            status: 'in_progress',
            worktreePath: AbsoluteFilePathStub({ value: WORKTREE }),
          }),
        ),
      });
      proxy.setupPlansDir({
        dirPath: AbsoluteFilePathStub({ value: PLANS_DIR }),
        entries: ['path-3.md'],
      });
      proxy.setupPlanFile({
        filePath: AbsoluteFilePathStub({ value: `${PLANS_DIR}/path-3.md` }),
        contents: '  VERIFIED  run_7 · 2026-09-14 · prelude reached the entry\n',
      });

      const result = await citationResolveBroker({
        entry: RegistryEntryStub({
          id: InstanceIdStub({ value: INSTANCE }),
          questId: QuestIdStub({ value: QUEST }),
          guildId: GuildIdStub({ value: GUILD }),
        }),
        runIds: [RunIdStub({ value: 'run_2' })],
      });

      expect(result.references).toStrictEqual([]);
    });

    it('VALID: {a prelude naming the instance id outright} => refused with runId null, the stronger match the run-id form falls back from', async () => {
      const proxy = citationResolveBrokerProxy();
      proxy.setupQuestFolder({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: GUILD_DIR }),
        guildQuestsPath: FilePathStub({ value: `${GUILD_DIR}/quests` }),
        questFolderPath: FilePathStub({ value: QUEST_FOLDER }),
      });
      proxy.setupQuestRecord({
        filePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        contents: JSON.stringify(
          QuestStub({
            status: 'in_progress',
            worktreePath: AbsoluteFilePathStub({ value: WORKTREE }),
          }),
        ),
      });
      proxy.setupPlansDir({
        dirPath: AbsoluteFilePathStub({ value: PLANS_DIR }),
        entries: ['path-3.md'],
      });
      proxy.setupPlanFile({
        filePath: AbsoluteFilePathStub({ value: `${PLANS_DIR}/path-3.md` }),
        contents: `  VERIFIED  on ${INSTANCE} · 2026-09-14\n`,
      });

      const result = await citationResolveBroker({
        entry: RegistryEntryStub({
          id: InstanceIdStub({ value: INSTANCE }),
          questId: QuestIdStub({ value: QUEST }),
          guildId: GuildIdStub({ value: GUILD }),
        }),
        runIds: [],
      });

      expect(result.references).toStrictEqual([
        {
          kind: 'verified-prelude',
          instanceId: INSTANCE,
          runId: null,
          citingFile: `${PLANS_DIR}/path-3.md`,
          why: `${INSTANCE} cited by a VERIFIED prelude in ${PLANS_DIR}/path-3.md`,
        },
      ]);
    });

    it('VALID: {a plan file mentioning run_7 with no VERIFIED line} => a map is not a citation', async () => {
      const proxy = citationResolveBrokerProxy();
      proxy.setupQuestFolder({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: GUILD_DIR }),
        guildQuestsPath: FilePathStub({ value: `${GUILD_DIR}/quests` }),
        questFolderPath: FilePathStub({ value: QUEST_FOLDER }),
      });
      proxy.setupQuestRecord({
        filePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        contents: JSON.stringify(
          QuestStub({
            status: 'in_progress',
            worktreePath: AbsoluteFilePathStub({ value: WORKTREE }),
          }),
        ),
      });
      proxy.setupPlansDir({
        dirPath: AbsoluteFilePathStub({ value: PLANS_DIR }),
        entries: ['abc-map.md'],
      });
      proxy.setupPlanFile({
        filePath: AbsoluteFilePathStub({ value: `${PLANS_DIR}/abc-map.md` }),
        contents: '# GROUP 1\n- run_7 is mentioned here but nothing was verified\n',
      });

      const result = await citationResolveBroker({
        entry: RegistryEntryStub({
          id: InstanceIdStub({ value: INSTANCE }),
          questId: QuestIdStub({ value: QUEST }),
          guildId: GuildIdStub({ value: GUILD }),
        }),
        runIds: [RunIdStub({ value: 'run_7' })],
      });

      expect(result.references).toStrictEqual([]);
    });

    it("VALID: {a prelude one level down, the spec's own .quest-plans/<questId>/path-3.md shape} => found", async () => {
      const proxy = citationResolveBrokerProxy();
      proxy.setupQuestFolder({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: GUILD_DIR }),
        guildQuestsPath: FilePathStub({ value: `${GUILD_DIR}/quests` }),
        questFolderPath: FilePathStub({ value: QUEST_FOLDER }),
      });
      proxy.setupQuestRecord({
        filePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        contents: JSON.stringify(
          QuestStub({
            status: 'in_progress',
            worktreePath: AbsoluteFilePathStub({ value: WORKTREE }),
          }),
        ),
      });
      proxy.setupPlansDir({
        dirPath: AbsoluteFilePathStub({ value: PLANS_DIR }),
        entries: ['1dac5395'],
      });
      proxy.setupPlansDir({
        dirPath: AbsoluteFilePathStub({ value: `${PLANS_DIR}/1dac5395` }),
        entries: ['path-3.md'],
      });
      proxy.setupPlanFile({
        filePath: AbsoluteFilePathStub({ value: `${PLANS_DIR}/1dac5395/path-3.md` }),
        contents: '  VERIFIED  run_7 · 2026-09-14\n',
      });

      const result = await citationResolveBroker({
        entry: RegistryEntryStub({
          id: InstanceIdStub({ value: INSTANCE }),
          questId: QuestIdStub({ value: QUEST }),
          guildId: GuildIdStub({ value: GUILD }),
        }),
        runIds: [RunIdStub({ value: 'run_7' })],
      });

      expect(result.references).toStrictEqual([
        {
          kind: 'verified-prelude',
          instanceId: INSTANCE,
          runId: 'run_7',
          citingFile: `${PLANS_DIR}/1dac5395/path-3.md`,
          why: `run_7 cited by a VERIFIED prelude in ${PLANS_DIR}/1dac5395/path-3.md`,
        },
      ]);
    });

    it('EDGE: {an extension-less FILE in the plan directory} => skipped on ENOTDIR rather than crashing the prune', async () => {
      const proxy = citationResolveBrokerProxy();
      proxy.setupQuestFolder({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: GUILD_DIR }),
        guildQuestsPath: FilePathStub({ value: `${GUILD_DIR}/quests` }),
        questFolderPath: FilePathStub({ value: QUEST_FOLDER }),
      });
      proxy.setupQuestRecord({
        filePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        contents: JSON.stringify(
          QuestStub({
            status: 'in_progress',
            worktreePath: AbsoluteFilePathStub({ value: WORKTREE }),
          }),
        ),
      });
      proxy.setupPlansDir({
        dirPath: AbsoluteFilePathStub({ value: PLANS_DIR }),
        entries: ['NOTES'],
      });
      proxy.setupNotADirectory({
        dirPath: AbsoluteFilePathStub({ value: `${PLANS_DIR}/NOTES` }),
      });

      const result = await citationResolveBroker({
        entry: RegistryEntryStub({
          id: InstanceIdStub({ value: INSTANCE }),
          questId: QuestIdStub({ value: QUEST }),
          guildId: GuildIdStub({ value: GUILD }),
        }),
        runIds: [RunIdStub({ value: 'run_7' })],
      });

      expect(result.references).toStrictEqual([]);
    });
  });

  describe('a quest with no worktree', () => {
    it('VALID: {worktreePath absent} => the prelude kind is reported as UNCHECKED beside the open-issue gap, never as "nothing cites this"', async () => {
      const proxy = citationResolveBrokerProxy();
      proxy.setupQuestFolder({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: GUILD_DIR }),
        guildQuestsPath: FilePathStub({ value: `${GUILD_DIR}/quests` }),
        questFolderPath: FilePathStub({ value: QUEST_FOLDER }),
      });
      proxy.setupQuestRecord({
        filePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        contents: JSON.stringify(QuestStub({ status: 'in_progress' })),
      });

      const result = await citationResolveBroker({
        entry: RegistryEntryStub({
          id: InstanceIdStub({ value: INSTANCE }),
          questId: QuestIdStub({ value: QUEST }),
          guildId: GuildIdStub({ value: GUILD }),
        }),
        runIds: [],
      });

      expect(result).toStrictEqual({
        references: [],
        gaps: [
          { kind: 'verified-prelude', why: NO_PRELUDE_WHY },
          { kind: 'open-issue', why: OPEN_ISSUE_WHY },
        ],
        blocked: null,
      });
    });
  });

  describe('a criterion only a person can settle', () => {
    it('VALID: {a verifyByHuman observable, a walked note and a .webm} => refused by BOTH kinds, the screencast citation naming the file a person opens', async () => {
      const proxy = citationResolveBrokerProxy();
      proxy.setupQuestFolder({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: GUILD_DIR }),
        guildQuestsPath: FilePathStub({ value: `${GUILD_DIR}/quests` }),
        questFolderPath: FilePathStub({ value: QUEST_FOLDER }),
      });
      proxy.setupQuestRecord({
        filePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        contents: JSON.stringify(
          QuestStub({
            status: 'in_progress',
            worktreePath: AbsoluteFilePathStub({ value: WORKTREE }),
            flows: [
              FlowStub({
                nodes: [
                  FlowNodeStub({
                    observables: [
                      FlowObservableStub({
                        id: ObservableIdStub({ value: 'motion-feels-smooth' }),
                        verifyByHuman: true,
                      }),
                    ],
                  }),
                ],
              }),
            ],
            planningNotes: {
              blightLedger: [],
              operationPlans: [],
              questNotes: [
                QuestNoteStub({
                  id: 'walked-path-3' as never,
                  kind: 'walked',
                  instanceId: SiegeInstanceIdStub({ value: INSTANCE }),
                  runId: SiegeRunIdStub({ value: 'run_7' }),
                }),
              ],
            },
          }),
        ),
      });
      proxy.setupPlansDir({ dirPath: AbsoluteFilePathStub({ value: PLANS_DIR }), entries: [] });
      proxy.setupRunDir({
        dirPath: AbsoluteFilePathStub({ value: `${SIEGE_RUNS}/run_7` }),
        entries: ['step1.png', 'walk.webm'],
      });

      const result = await citationResolveBroker({
        entry: RegistryEntryStub({
          id: InstanceIdStub({ value: INSTANCE }),
          questId: QuestIdStub({ value: QUEST }),
          guildId: GuildIdStub({ value: GUILD }),
        }),
        runIds: [RunIdStub({ value: 'run_7' })],
      });

      expect(result).toStrictEqual({
        references: [
          {
            kind: 'walked-note',
            instanceId: INSTANCE,
            runId: 'run_7',
            citingFile: QUEST_FILE,
            why: `run_7 cited by a WALKED note on open quest add-auth (in_progress) in ${QUEST_FILE}`,
          },
          {
            kind: 'unjudged-screencast',
            instanceId: INSTANCE,
            runId: 'run_7',
            citingFile: QUEST_FILE,
            why:
              'run_7 cited by motion-feels-smooth on quest add-auth (in_progress), which only a ' +
              `person can settle — held until that verdict is recorded: ${SIEGE_RUNS}/run_7/walk.webm`,
          },
        ],
        gaps: [{ kind: 'open-issue', why: OPEN_ISSUE_WHY }],
        blocked: null,
      });
    });

    it('ERROR: {a verifyByHuman observable whose run holds no .webm} => the whole resolution is blocked naming the empty directory, rather than reporting the walked citation and losing the recording', async () => {
      const proxy = citationResolveBrokerProxy();
      proxy.setupQuestFolder({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: GUILD_DIR }),
        guildQuestsPath: FilePathStub({ value: `${GUILD_DIR}/quests` }),
        questFolderPath: FilePathStub({ value: QUEST_FOLDER }),
      });
      proxy.setupQuestRecord({
        filePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        contents: JSON.stringify(
          QuestStub({
            status: 'complete',
            worktreePath: AbsoluteFilePathStub({ value: WORKTREE }),
            flows: [
              FlowStub({
                nodes: [
                  FlowNodeStub({
                    observables: [
                      FlowObservableStub({
                        id: ObservableIdStub({ value: 'motion-feels-smooth' }),
                        verifyByHuman: true,
                      }),
                    ],
                  }),
                ],
              }),
            ],
            planningNotes: {
              blightLedger: [],
              operationPlans: [],
              questNotes: [
                QuestNoteStub({
                  id: 'walked-path-3' as never,
                  kind: 'walked',
                  instanceId: SiegeInstanceIdStub({ value: INSTANCE }),
                  runId: SiegeRunIdStub({ value: 'run_7' }),
                }),
              ],
            },
          }),
        ),
      });
      proxy.setupPlansDir({ dirPath: AbsoluteFilePathStub({ value: PLANS_DIR }), entries: [] });
      proxy.setupRunDir({
        dirPath: AbsoluteFilePathStub({ value: `${SIEGE_RUNS}/run_7` }),
        entries: ['step1.png'],
      });

      const result = await citationResolveBroker({
        entry: RegistryEntryStub({
          id: InstanceIdStub({ value: INSTANCE }),
          questId: QuestIdStub({ value: QUEST }),
          guildId: GuildIdStub({ value: GUILD }),
        }),
        runIds: [RunIdStub({ value: 'run_7' })],
      });

      expect(result).toStrictEqual({
        references: [],
        gaps: [],
        blocked:
          'quest add-auth (complete) leaves motion-feels-smooth for a person to settle off run_7 ' +
          `on ${INSTANCE}, and no .webm is in ${SIEGE_RUNS}/run_7 — refusing rather than handing ` +
          'that person a pointer to a recording that is not there.',
      });
    });
  });
});
