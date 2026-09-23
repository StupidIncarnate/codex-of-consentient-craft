import {
  AbsoluteFilePathStub,
  FilePathStub,
  GuildIdStub,
  QuestIdStub,
  QuestNoteStub,
  QuestStub,
  SiegeInstanceIdStub,
  SiegeRunIdStub,
} from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { assetsAgeLayerBroker } from './assets-age-layer-broker';
import { assetsAgeLayerBrokerProxy } from './assets-age-layer-broker.proxy';

const NOW_MS = 1_700_000_000_000;
const DAY_MS = 86_400_000;
const HOME_DIR = '/home/user';
const HOME = '/home/user/.dungeonmaster';
const ROOT = `${HOME}/siegelense`;
const UNOWNED_EVIDENCE = `${ROOT}/unowned/instances/inst_9b2c0001`;
const GUILD = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const GUILD_DIR = `${HOME}/guilds/${GUILD}`;
const QUEST = 'add-auth';
const QUEST_FOLDER = `${GUILD_DIR}/quests/${QUEST}`;
const QUEST_FILE = `${QUEST_FOLDER}/quest.json`;
const OWNED_EVIDENCE = `${ROOT}/guilds/${GUILD}/instances/inst_1d090002`;

describe('assetsAgeLayerBroker', () => {
  describe('an empty fleet', () => {
    it('EMPTY: {no entries} => nothing aged, nothing refused', async () => {
      assetsAgeLayerBrokerProxy();

      const result = await assetsAgeLayerBroker({
        entries: [],
        nowMs: EpochMsStub({ value: NOW_MS }),
      });

      expect(result).toStrictEqual({ instances: 0, freedMB: 0, refusals: [], gaps: [] });
    });
  });

  describe('video ageing out first and separately', () => {
    it('VALID: {a 3-day-old screencast beside a 3-day-old shot} => the video goes on its 2d window and the shot survives its 7d one', async () => {
      const proxy = assetsAgeLayerBrokerProxy();
      // Two passes run per instance — video, then everything — and each re-resolves the evidence
      // directory, so the resolution is staged twice.
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: UNOWNED_EVIDENCE }),
      });
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: UNOWNED_EVIDENCE }),
      });
      proxy.setupDir({
        dirPath: AbsoluteFilePathStub({ value: `${UNOWNED_EVIDENCE}/runs` }),
        entries: ['run_1'],
      });
      proxy.setupDir({
        dirPath: AbsoluteFilePathStub({ value: `${UNOWNED_EVIDENCE}/runs/run_1` }),
        entries: ['walk.webm', 'step1.png'],
      });
      proxy.setupFile({
        filePath: AbsoluteFilePathStub({ value: `${UNOWNED_EVIDENCE}/runs/run_1/walk.webm` }),
        sizeBytes: 104_857_600,
        modifiedAtMs: NOW_MS - DAY_MS * 3,
      });
      proxy.setupFile({
        filePath: AbsoluteFilePathStub({ value: `${UNOWNED_EVIDENCE}/runs/run_1/step1.png` }),
        sizeBytes: 4096,
        modifiedAtMs: NOW_MS - DAY_MS * 3,
      });
      proxy.setupDeleteSucceeds({
        filePath: AbsoluteFilePathStub({ value: `${UNOWNED_EVIDENCE}/runs/run_1/walk.webm` }),
      });

      const result = await assetsAgeLayerBroker({
        entries: [
          RegistryEntryStub({
            id: InstanceIdStub({ value: 'inst_9b2c0001' }),
            state: 'killed',
            questId: null,
            guildId: null,
            bootedAtMs: EpochMsStub({ value: NOW_MS - DAY_MS * 4 }),
            lastBeatMs: null,
          }),
        ],
        nowMs: EpochMsStub({ value: NOW_MS }),
      });

      expect(result).toStrictEqual({ instances: 1, freedMB: 100, refusals: [], gaps: [] });
      expect(proxy.getDeletedPaths()).toStrictEqual([`${UNOWNED_EVIDENCE}/runs/run_1/walk.webm`]);
    });
  });

  describe('evidence an open quest still walks', () => {
    it('VALID: {a WALKED note on an open quest} => refused ONCE with the citing file named, and nothing unlinked', async () => {
      const proxy = assetsAgeLayerBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: OWNED_EVIDENCE }),
      });
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: OWNED_EVIDENCE }),
      });
      // Only the second (everything) pass reaches the citation resolver: the first selects no
      // video, so it never asks. One staging, consumed once.
      proxy.setupQuestFolder({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: GUILD_DIR }),
        guildQuestsPath: FilePathStub({ value: `${GUILD_DIR}/quests` }),
        questFolderPath: FilePathStub({ value: QUEST_FOLDER }),
      });
      proxy.setupFile({
        filePath: AbsoluteFilePathStub({ value: `${OWNED_EVIDENCE}/api-server.log` }),
        sizeBytes: 999_999,
        modifiedAtMs: NOW_MS - DAY_MS * 30,
      });
      proxy.setupDir({
        dirPath: AbsoluteFilePathStub({ value: `${OWNED_EVIDENCE}/runs` }),
        entries: [],
      });
      proxy.setupQuestRecord({
        filePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        contents: JSON.stringify(
          QuestStub({
            status: 'in_progress',
            planningNotes: {
              blightLedger: [],
              operationPlans: [],
              questNotes: [
                QuestNoteStub({
                  id: 'walked-path-3' as never,
                  kind: 'walked',
                  instanceId: SiegeInstanceIdStub({ value: 'inst_1d090002' }),
                  runId: SiegeRunIdStub({ value: 'run_2' }),
                }),
              ],
            },
          }),
        ),
      });

      const result = await assetsAgeLayerBroker({
        entries: [
          RegistryEntryStub({
            id: InstanceIdStub({ value: 'inst_1d090002' }),
            state: 'killed',
            questId: QuestIdStub({ value: QUEST }),
            guildId: GuildIdStub({ value: GUILD }),
            bootedAtMs: EpochMsStub({ value: NOW_MS - DAY_MS * 40 }),
            lastBeatMs: null,
          }),
        ],
        nowMs: EpochMsStub({ value: NOW_MS }),
      });

      expect(result).toStrictEqual({
        instances: 0,
        freedMB: 0,
        refusals: [
          {
            id: 'inst_1d090002',
            why: `run_2 cited by a WALKED note on open quest add-auth (in_progress) in ${QUEST_FILE}`,
          },
        ],
        gaps: [
          {
            kind: 'verified-prelude',
            why:
              'not checked: the quest records no worktree, so there is no .quest-plans directory ' +
              'to read preludes out of.',
          },
          {
            kind: 'open-issue',
            why:
              'not checked: no issue record exists to check. Nothing in this repo stores an issue ' +
              "carrying a typed instanceId/runId — a workItem's own observation carries neither field and " +
              'questNoteKindContract has no issue member — so a walker records a defect as a ' +
              'failing test or as prose in a note, neither of which a resolver can match an ' +
              'instance against.',
          },
        ],
      });
      expect(proxy.getDeletedPaths()).toStrictEqual([]);
    });
  });
});
