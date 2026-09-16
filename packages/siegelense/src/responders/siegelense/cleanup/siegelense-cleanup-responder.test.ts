import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { CleanupAnswerStub } from '../../../contracts/cleanup-answer/cleanup-answer.stub';

import { SiegelenseCleanupResponder } from './siegelense-cleanup-responder';
import { SiegelenseCleanupResponderProxy } from './siegelense-cleanup-responder.proxy';

describe('SiegelenseCleanupResponder', () => {
  describe('something reaped', () => {
    it('VALID: {human: false, one stale instance reaped} => writes the CleanupAnswer as one JSON document', async () => {
      const proxy = SiegelenseCleanupResponderProxy();
      const answer = CleanupAnswerStub({
        reaped: [{ id: 'inst_9b2c', staleFor: '9h', killed: [33_812, 33_840], homeRemoved: true }],
        portsReleased: [41_345, 34_173],
        lockReleased: true,
        leftAlone: [],
      });
      proxy.stageAnswer({ answer });

      await SiegelenseCleanupResponder({ human: false });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('VALID: {human: true, one stale instance reaped} => writes what was reaped, ports released, and lock released', async () => {
      const proxy = SiegelenseCleanupResponderProxy();
      const answer = CleanupAnswerStub({
        reaped: [{ id: 'inst_9b2c', staleFor: '9h', killed: [33_812, 33_840], homeRemoved: true }],
        portsReleased: [41_345, 34_173],
        lockReleased: true,
        leftAlone: [],
      });
      proxy.stageAnswer({ answer });

      await SiegelenseCleanupResponder({ human: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        'REAPED: inst_9b2c (stale 9h, killed 33812, 33840, home removed)\n' +
          'PORTS RELEASED: 41345, 34173\n' +
          'LOCK RELEASED: yes\n' +
          'LEFT ALONE: none\n',
      ]);
    });
  });

  describe('nothing reaped, one instance left alone', () => {
    it('VALID: {human: false, no stale instances, one live instance left alone} => writes the CleanupAnswer as one JSON document', async () => {
      const proxy = SiegelenseCleanupResponderProxy();
      const answer = CleanupAnswerStub({
        reaped: [],
        portsReleased: [],
        lockReleased: false,
        leftAlone: [{ id: 'inst_7f3a', why: 'live — last beat 2s ago' }],
      });
      proxy.stageAnswer({ answer });

      await SiegelenseCleanupResponder({ human: false });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('VALID: {human: true, no stale instances, one live instance left alone} => writes REAPED: none and the left-alone reason', async () => {
      const proxy = SiegelenseCleanupResponderProxy();
      const answer = CleanupAnswerStub({
        reaped: [],
        portsReleased: [],
        lockReleased: false,
        leftAlone: [{ id: 'inst_7f3a', why: 'live — last beat 2s ago' }],
      });
      proxy.stageAnswer({ answer });

      await SiegelenseCleanupResponder({ human: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        'REAPED: none\n' +
          'PORTS RELEASED: none\n' +
          'LOCK RELEASED: no\n' +
          'LEFT ALONE: inst_7f3a (live — last beat 2s ago)\n',
      ]);
    });
  });
});
