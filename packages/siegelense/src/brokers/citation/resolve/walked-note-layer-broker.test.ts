import {
  AbsoluteFilePathStub,
  QuestNoteStub,
  QuestStub,
  SiegeInstanceIdStub,
  SiegeRunIdStub,
} from '@dungeonmaster/shared/contracts';

import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { walkedNoteLayerBroker } from './walked-note-layer-broker';
import { walkedNoteLayerBrokerProxy } from './walked-note-layer-broker.proxy';

const QUEST_FILE = '/home/user/.dungeonmaster/guilds/g1/quests/add-auth/quest.json';
const INSTANCE = 'inst_9b2c0001';

describe('walkedNoteLayerBroker', () => {
  describe('an open quest', () => {
    it('VALID: {one walked note for this instance} => one citation naming the quest file and the run', () => {
      walkedNoteLayerBrokerProxy();

      const result = walkedNoteLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        quest: QuestStub({
          status: 'in_progress',
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

      expect(result).toStrictEqual([
        {
          kind: 'walked-note',
          instanceId: INSTANCE,
          runId: 'run_2',
          citingFile: QUEST_FILE,
          why: `run_2 cited by a WALKED note on open quest add-auth (in_progress) in ${QUEST_FILE}`,
        },
      ]);
    });

    it('VALID: {two walked notes for this instance} => both, so a refusal can name every run that still needs it', () => {
      walkedNoteLayerBrokerProxy();

      const result = walkedNoteLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        quest: QuestStub({
          status: 'blocked',
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

      expect(result.map((reference) => String(reference.runId))).toStrictEqual(['run_2', 'run_3']);
    });

    it('EDGE: {a walked note with no runId} => still a citation, naming every run rather than guessing one', () => {
      walkedNoteLayerBrokerProxy();

      const result = walkedNoteLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        quest: QuestStub({
          status: 'in_progress',
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

      expect(result).toStrictEqual([
        {
          kind: 'walked-note',
          instanceId: INSTANCE,
          runId: null,
          citingFile: QUEST_FILE,
          why: `every run cited by a WALKED note on open quest add-auth (in_progress) in ${QUEST_FILE}`,
        },
      ]);
    });
  });

  describe('a quest that is over', () => {
    it.each(['complete', 'merged', 'abandoned'])(
      'VALID: {status: %s} => no citation, because the walk is over',
      (status) => {
        walkedNoteLayerBrokerProxy();

        const result = walkedNoteLayerBroker({
          instanceId: InstanceIdStub({ value: INSTANCE }),
          questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
          quest: QuestStub({
            status: status as never,
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

        expect(result).toStrictEqual([]);
      },
    );
  });

  describe('notes that are not this instance', () => {
    it('EMPTY: {no notes at all} => no citations', () => {
      walkedNoteLayerBrokerProxy();

      const result = walkedNoteLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        quest: QuestStub({ status: 'in_progress' }),
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {a walked note with no instanceId at all} => skipped, because a note with nothing typed on it cites nothing mechanically', () => {
      walkedNoteLayerBrokerProxy();

      const result = walkedNoteLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        questFilePath: AbsoluteFilePathStub({ value: QUEST_FILE }),
        quest: QuestStub({
          status: 'in_progress',
          planningNotes: {
            blightLedger: [],
            operationPlans: [],
            questNotes: [
              QuestNoteStub({ id: 'walked-path-3' as never, kind: 'walked', instanceId: null }),
            ],
          },
        }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
