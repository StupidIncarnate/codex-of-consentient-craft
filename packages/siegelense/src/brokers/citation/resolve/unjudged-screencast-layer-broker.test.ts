import {
  AbsoluteFilePathStub,
  FilePathStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  GuildIdStub,
  ObservableIdStub,
  QuestNoteStub,
  QuestStub,
  SiegeInstanceIdStub,
  SiegeRunIdStub,
} from '@dungeonmaster/shared/contracts';

import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { unjudgedScreencastLayerBroker } from './unjudged-screencast-layer-broker';
import { unjudgedScreencastLayerBrokerProxy } from './unjudged-screencast-layer-broker.proxy';

const HOME_DIR = '/home/user';
const HOME = '/home/user/.dungeonmaster';
const ROOT = `${HOME}/siegelense`;
const GUILD = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const INSTANCE = 'inst_9b2c0001';
const OTHER_INSTANCE = 'inst_1d090002';
const EVIDENCE = `${ROOT}/guilds/${GUILD}/instances/${INSTANCE}`;
const RUNS = `${EVIDENCE}/runs`;
const QUEST_FILE = `${HOME}/guilds/${GUILD}/quests/add-auth/quest.json`;

describe('unjudgedScreencastLayerBroker', () => {
  describe('a criterion only a person can settle', () => {
    it('VALID: {verifyByHuman unit, a note naming run_2, a .webm in the run} => one citation carrying the screencast path a person can open', async () => {
      const proxy = unjudgedScreencastLayerBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: EVIDENCE }),
      });
      proxy.setupRunDir({
        dirPath: AbsoluteFilePathStub({ value: `${RUNS}/run_2` }),
        entries: ['step1.png', 'walk.webm'],
      });

      const result = await unjudgedScreencastLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        guildId: GuildIdStub({ value: GUILD }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        quest: QuestStub({
          status: 'in_progress',
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
                runId: SiegeRunIdStub({ value: 'run_2' }),
              }),
            ],
          },
        }),
      });

      expect(result).toStrictEqual({
        references: [
          {
            kind: 'unjudged-screencast',
            instanceId: INSTANCE,
            runId: 'run_2',
            citingFile: QUEST_FILE,
            why:
              'run_2 cited by motion-feels-smooth on quest add-auth (in_progress), which only a ' +
              `person can settle — held until that verdict is recorded: ${RUNS}/run_2/walk.webm`,
          },
        ],
        blocked: null,
      });
    });

    it('VALID: {the same unit and note on a COMPLETE quest} => still cited, because the person reading the list arrives after the quest is over', async () => {
      const proxy = unjudgedScreencastLayerBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: EVIDENCE }),
      });
      proxy.setupRunDir({
        dirPath: AbsoluteFilePathStub({ value: `${RUNS}/run_2` }),
        entries: ['walk.webm'],
      });

      const result = await unjudgedScreencastLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        guildId: GuildIdStub({ value: GUILD }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        quest: QuestStub({
          status: 'complete',
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
                runId: SiegeRunIdStub({ value: 'run_2' }),
              }),
            ],
          },
        }),
      });

      expect(result).toStrictEqual({
        references: [
          {
            kind: 'unjudged-screencast',
            instanceId: INSTANCE,
            runId: 'run_2',
            citingFile: QUEST_FILE,
            why:
              'run_2 cited by motion-feels-smooth on quest add-auth (complete), which only a ' +
              `person can settle — held until that verdict is recorded: ${RUNS}/run_2/walk.webm`,
          },
        ],
        blocked: null,
      });
    });

    it('EDGE: {two notes naming the SAME run} => one citation, because two reasons are not two recordings', async () => {
      const proxy = unjudgedScreencastLayerBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: EVIDENCE }),
      });
      proxy.setupRunDir({
        dirPath: AbsoluteFilePathStub({ value: `${RUNS}/run_2` }),
        entries: ['walk.webm'],
      });

      const result = await unjudgedScreencastLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        guildId: GuildIdStub({ value: GUILD }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        quest: QuestStub({
          status: 'complete',
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
                runId: SiegeRunIdStub({ value: 'run_2' }),
              }),
              QuestNoteStub({
                id: 'walked-path-4' as never,
                kind: 'walked',
                instanceId: SiegeInstanceIdStub({ value: INSTANCE }),
                runId: SiegeRunIdStub({ value: 'run_2' }),
              }),
            ],
          },
        }),
      });

      expect(result.references.map((reference) => String(reference.runId))).toStrictEqual([
        'run_2',
      ]);
    });
  });

  describe('a screencast that is not there', () => {
    it('ERROR: {verifyByHuman unit, a note naming run_2, only shots in the run} => blocked naming the run, the directory and the criterion, rather than answering uncited', async () => {
      const proxy = unjudgedScreencastLayerBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: EVIDENCE }),
      });
      proxy.setupRunDir({
        dirPath: AbsoluteFilePathStub({ value: `${RUNS}/run_2` }),
        entries: ['step1.png', 'step2.png'],
      });

      const result = await unjudgedScreencastLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        guildId: GuildIdStub({ value: GUILD }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        quest: QuestStub({
          status: 'complete',
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
                runId: SiegeRunIdStub({ value: 'run_2' }),
              }),
            ],
          },
        }),
      });

      expect(result).toStrictEqual({
        references: [],
        blocked:
          'quest add-auth (complete) leaves motion-feels-smooth for a person to settle off run_2 ' +
          `on ${INSTANCE}, and no .webm is in ${RUNS}/run_2 — refusing rather than handing that ` +
          'person a pointer to a recording that is not there.',
      });
    });

    it('ERROR: {the run directory was never written at all} => blocked, so an absent tree is not read as an uncited one', async () => {
      const proxy = unjudgedScreencastLayerBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: EVIDENCE }),
      });

      const result = await unjudgedScreencastLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        guildId: GuildIdStub({ value: GUILD }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        quest: QuestStub({
          status: 'complete',
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
                runId: SiegeRunIdStub({ value: 'run_5' }),
              }),
            ],
          },
        }),
      });

      expect(result).toStrictEqual({
        references: [],
        blocked:
          'quest add-auth (complete) leaves motion-feels-smooth for a person to settle off run_5 ' +
          `on ${INSTANCE}, and no .webm is in ${RUNS}/run_5 — refusing rather than handing that ` +
          'person a pointer to a recording that is not there.',
      });
    });

    it('ERROR: {two runs, one with a screencast and one without} => blocked on the empty one, and the run that HAS its recording is not reported as held', async () => {
      const proxy = unjudgedScreencastLayerBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: EVIDENCE }),
      });
      proxy.setupRunDir({
        dirPath: AbsoluteFilePathStub({ value: `${RUNS}/run_2` }),
        entries: ['walk.webm'],
      });
      proxy.setupRunDir({
        dirPath: AbsoluteFilePathStub({ value: `${RUNS}/run_3` }),
        entries: ['step1.png'],
      });

      const result = await unjudgedScreencastLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        guildId: GuildIdStub({ value: GUILD }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        quest: QuestStub({
          status: 'complete',
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
                runId: SiegeRunIdStub({ value: 'run_2' }),
              }),
              QuestNoteStub({
                id: 'walked-path-4' as never,
                kind: 'walked',
                instanceId: SiegeInstanceIdStub({ value: INSTANCE }),
                runId: SiegeRunIdStub({ value: 'run_3' }),
              }),
            ],
          },
        }),
      });

      expect(result).toStrictEqual({
        references: [],
        blocked:
          'quest add-auth (complete) leaves motion-feels-smooth for a person to settle off run_3 ' +
          `on ${INSTANCE}, and no .webm is in ${RUNS}/run_3 — refusing rather than handing that ` +
          'person a pointer to a recording that is not there.',
      });
    });
  });

  describe('nothing a person has to settle', () => {
    it('VALID: {every observable settled by an automated check} => no citation and no refusal, even with a note and a screencast on disk', async () => {
      const proxy = unjudgedScreencastLayerBrokerProxy();
      proxy.setupRunDir({
        dirPath: AbsoluteFilePathStub({ value: `${RUNS}/run_2` }),
        entries: ['walk.webm'],
      });

      const result = await unjudgedScreencastLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        guildId: GuildIdStub({ value: GUILD }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        quest: QuestStub({
          status: 'in_progress',
          flows: [
            FlowStub({
              nodes: [
                FlowNodeStub({
                  observables: [
                    FlowObservableStub({
                      id: ObservableIdStub({ value: 'motion-feels-smooth' }),
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
                runId: SiegeRunIdStub({ value: 'run_2' }),
              }),
            ],
          },
        }),
      });

      expect(result).toStrictEqual({ references: [], blocked: null });
    });

    it('VALID: {verifyByHuman: false} => no citation and no refusal, because the flag is what marks the criterion, not its presence', async () => {
      const proxy = unjudgedScreencastLayerBrokerProxy();
      proxy.setupRunDir({
        dirPath: AbsoluteFilePathStub({ value: `${RUNS}/run_2` }),
        entries: ['walk.webm'],
      });

      const result = await unjudgedScreencastLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        guildId: GuildIdStub({ value: GUILD }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        quest: QuestStub({
          status: 'in_progress',
          flows: [
            FlowStub({
              nodes: [
                FlowNodeStub({
                  observables: [
                    FlowObservableStub({
                      id: ObservableIdStub({ value: 'motion-feels-smooth' }),
                      verifyByHuman: false,
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
                runId: SiegeRunIdStub({ value: 'run_2' }),
              }),
            ],
          },
        }),
      });

      expect(result).toStrictEqual({ references: [], blocked: null });
    });
  });

  describe('notes that are not this instance', () => {
    it('EMPTY: {a verifyByHuman unit and no notes at all} => no citation and no refusal, because this instance holds none of its evidence', async () => {
      unjudgedScreencastLayerBrokerProxy();

      const result = await unjudgedScreencastLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        guildId: GuildIdStub({ value: GUILD }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        quest: QuestStub({
          status: 'complete',
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
        }),
      });

      expect(result).toStrictEqual({ references: [], blocked: null });
    });

    it('VALID: {a note naming a DIFFERENT instance} => no citation and no refusal for this one', async () => {
      unjudgedScreencastLayerBrokerProxy();

      const result = await unjudgedScreencastLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        guildId: GuildIdStub({ value: GUILD }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        quest: QuestStub({
          status: 'complete',
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
                instanceId: SiegeInstanceIdStub({ value: OTHER_INSTANCE }),
                runId: SiegeRunIdStub({ value: 'run_2' }),
              }),
            ],
          },
        }),
      });

      expect(result).toStrictEqual({ references: [], blocked: null });
    });

    it('VALID: {a note naming this instance with no runId} => no citation and no refusal, because a recording is found by its run id and nothing browses', async () => {
      unjudgedScreencastLayerBrokerProxy();

      const result = await unjudgedScreencastLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        guildId: GuildIdStub({ value: GUILD }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        quest: QuestStub({
          status: 'complete',
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
                runId: null,
              }),
            ],
          },
        }),
      });

      expect(result).toStrictEqual({ references: [], blocked: null });
    });
  });

  describe('a verdict releases the hold', () => {
    it('VALID: {a human-verdict note naming the SAME criterion} => released: no citation and no refusal, even though the run still holds a screencast', async () => {
      unjudgedScreencastLayerBrokerProxy();

      const result = await unjudgedScreencastLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        guildId: GuildIdStub({ value: GUILD }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        quest: QuestStub({
          status: 'complete',
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
                runId: SiegeRunIdStub({ value: 'run_2' }),
              }),
              QuestNoteStub({
                id: 'human-verdict-motion-feels-smooth' as never,
                kind: 'human-verdict',
                unitId: 'motion-feels-smooth',
                outcome: 'met',
              }),
            ],
          },
        }),
      });

      expect(result).toStrictEqual({ references: [], blocked: null });
    });

    it('VALID: {a human-verdict note naming a DIFFERENT criterion} => still held: the outstanding criterion keeps its citation', async () => {
      const proxy = unjudgedScreencastLayerBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: EVIDENCE }),
      });
      proxy.setupRunDir({
        dirPath: AbsoluteFilePathStub({ value: `${RUNS}/run_2` }),
        entries: ['walk.webm'],
      });

      const result = await unjudgedScreencastLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        guildId: GuildIdStub({ value: GUILD }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        quest: QuestStub({
          status: 'complete',
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
                runId: SiegeRunIdStub({ value: 'run_2' }),
              }),
              QuestNoteStub({
                id: 'human-verdict-some-other-criterion' as never,
                kind: 'human-verdict',
                unitId: 'some-other-criterion',
                outcome: 'met',
              }),
            ],
          },
        }),
      });

      expect(result).toStrictEqual({
        references: [
          {
            kind: 'unjudged-screencast',
            instanceId: INSTANCE,
            runId: 'run_2',
            citingFile: QUEST_FILE,
            why:
              'run_2 cited by motion-feels-smooth on quest add-auth (complete), which only a ' +
              `person can settle — held until that verdict is recorded: ${RUNS}/run_2/walk.webm`,
          },
        ],
        blocked: null,
      });
    });
  });
});
