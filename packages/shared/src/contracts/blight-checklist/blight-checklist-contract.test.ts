import { BlightChecklistItemStub } from '../blight-checklist-item/blight-checklist-item.stub';
import { blightChecklistContract } from './blight-checklist-contract';
import { BlightChecklistStub } from './blight-checklist.stub';

describe('blightChecklistContract', () => {
  describe('valid checklists', () => {
    it('VALID: {full checklist} => parses baseRef, items, and what remains', () => {
      expect(BlightChecklistStub()).toStrictEqual({
        baseRef: 'a1b2c3d4e5f6',
        items: [BlightChecklistItemStub()],
        remainingItemIds: ['packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:coverage'],
      });
    });

    it('VALID: {nothing remaining} => an empty remaining list is the only gate-clearing state', () => {
      expect(BlightChecklistStub({ remainingItemIds: [] }).remainingItemIds).toStrictEqual([]);
    });

    it('VALID: {no items or remaining ids in payload} => defaults both collections to empty', () => {
      expect(
        blightChecklistContract.parse({
          baseRef: 'a1b2c3d4e5f6',
        }),
      ).toStrictEqual({
        baseRef: 'a1b2c3d4e5f6',
        items: [],
        remainingItemIds: [],
      });
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {baseRef: ""} => throws', () => {
      expect(() => BlightChecklistStub({ baseRef: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {remaining id not a string} => throws', () => {
      expect(() => BlightChecklistStub({ remainingItemIds: [1 as never] })).toThrow(
        /Expected string/u,
      );
    });
  });
});
