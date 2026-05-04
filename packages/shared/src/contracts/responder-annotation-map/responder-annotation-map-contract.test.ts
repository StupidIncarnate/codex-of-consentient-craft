import { responderAnnotationMapContract } from './responder-annotation-map-contract';
import { ResponderAnnotationMapStub } from './responder-annotation-map.stub';
import { ResponderAnnotationStub } from '../responder-annotation/responder-annotation.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../content-text/content-text.stub';

describe('responderAnnotationMapContract', () => {
  describe('valid inputs', () => {
    it('VALID: {default stub} => parses with empty Map', () => {
      const result = ResponderAnnotationMapStub();

      expect(result).toStrictEqual(new Map());
    });

    it('VALID: {single entry} => parses with one key-value pair', () => {
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/responders/quest/start/quest-start-responder.ts',
      });
      const annotation = ResponderAnnotationStub({
        suffix: ContentTextStub({ value: '[POST /api/quests/:questId/start]' }),
      });

      const result = ResponderAnnotationMapStub({ entries: [[filePath, annotation]] });

      expect(result).toStrictEqual(
        new Map([
          [
            filePath,
            {
              suffix: '[POST /api/quests/:questId/start]',
              childLines: [],
            },
          ],
        ]),
      );
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {plain object} => throws ZodError', () => {
      expect(() => responderAnnotationMapContract.parse({})).toThrow(/Expected map/u);
    });
  });
});
