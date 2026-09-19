import { questUpdateRouteBroker } from './quest-update-route-broker';
import { questUpdateRouteBrokerProxy } from './quest-update-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import {
  GetQuestInputStub,
  GetQuestResultStub,
  ModifyQuestInputStub,
  ModifyQuestResultStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

describe('questUpdateRouteBroker', () => {
  describe('a successful modify', () => {
    it('VALID: {record, fields: {title}} => reloads the quest and returns the reloaded record', async () => {
      const proxy = questUpdateRouteBrokerProxy();
      const target = DmTargetStub({});
      const record = QuestStub({ id: 'add-auth', title: 'Add Auth' });
      const input = ModifyQuestInputStub({ questId: 'add-auth', title: 'Renamed Quest' });
      const modifyResult = ModifyQuestResultStub({ success: true });
      const getInput = GetQuestInputStub({ questId: 'add-auth' });
      const reloadedQuest = QuestStub({ id: 'add-auth', title: 'Renamed Quest' });
      const getResult = GetQuestResultStub({ success: true, quest: reloadedQuest });
      proxy.setupModifySucceeds({ input, modifyResult, getInput, getResult });

      const outcome = await questUpdateRouteBroker({
        target,
        record,
        fields: { title: 'Renamed Quest' },
      });

      expect(outcome).toStrictEqual(reloadedQuest);
    });
  });

  describe('a rejected modify', () => {
    it('ERROR: {questModifyBroker returns success: false} => throws naming the error', async () => {
      const proxy = questUpdateRouteBrokerProxy();
      const target = DmTargetStub({});
      const record = QuestStub({ id: 'add-auth' });
      const input = ModifyQuestInputStub({ questId: 'add-auth', title: 'Renamed Quest' });
      const result = ModifyQuestResultStub({ success: false, error: 'Quest not found' });
      proxy.setupModifyFails({ input, result });

      await expect(
        questUpdateRouteBroker({ target, record, fields: { title: 'Renamed Quest' } }),
      ).rejects.toThrow(/questUpdateRouteBroker: modify failed — Quest not found/u);
    });
  });

  describe('a failed reload', () => {
    it('ERROR: {questGetBroker returns success: false after a successful modify} => throws naming the reload error', async () => {
      const proxy = questUpdateRouteBrokerProxy();
      const target = DmTargetStub({});
      const record = QuestStub({ id: 'add-auth' });
      const input = ModifyQuestInputStub({ questId: 'add-auth', title: 'Renamed Quest' });
      const modifyResult = ModifyQuestResultStub({ success: true });
      const getInput = GetQuestInputStub({ questId: 'add-auth' });
      const getResult = GetQuestResultStub({ success: false, error: 'quest add-auth vanished' });
      proxy.setupModifySucceeds({ input, modifyResult, getInput, getResult });

      await expect(
        questUpdateRouteBroker({ target, record, fields: { title: 'Renamed Quest' } }),
      ).rejects.toThrow(/questUpdateRouteBroker: reload failed — quest add-auth vanished/u);
    });
  });
});
