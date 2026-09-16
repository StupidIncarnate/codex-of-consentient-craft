import { linkValuesTransformer } from './link-values-transformer';
import { LinkSpecStub } from '../../contracts/link-spec/link-spec.stub';
import { RowRefStub } from '../../contracts/row-ref/row-ref.stub';
import { FieldValuesStub } from '../../contracts/field-values/field-values.stub';

describe('linkValuesTransformer', () => {
  describe('one link satisfied by an ancestor', () => {
    it('VALID: {links: [guild/guildId], ancestors: [guild[0:0]]} => returns {guildId: "g1"}', () => {
      const result = linkValuesTransformer({
        links: [LinkSpecStub({ of: 'guild', as: 'guildId' })],
        ancestors: [RowRefStub({ value: 'guild[0:0]' })],
        ownFields: {},
        records: new Map([[RowRefStub({ value: 'guild[0:0]' }), { id: 'g1' }]]),
      });

      expect(result).toStrictEqual({ ok: true, values: { guildId: 'g1' } });
    });
  });

  describe('two links, one to a quest and one to its guild', () => {
    it('VALID: {an operation linking to both quest and guild} => returns {questId: "q1", guildId: "g1"}', () => {
      const result = linkValuesTransformer({
        links: [
          LinkSpecStub({ of: 'quest', as: 'questId' }),
          LinkSpecStub({ of: 'guild', as: 'guildId' }),
        ],
        ancestors: [
          RowRefStub({ value: 'guild[0:0]' }),
          RowRefStub({ value: 'guild[0:0]/quest[0:0]' }),
        ],
        ownFields: {},
        records: new Map<ReturnType<typeof RowRefStub>, unknown>([
          [RowRefStub({ value: 'guild[0:0]' }), { id: 'g1' }],
          [RowRefStub({ value: 'guild[0:0]/quest[0:0]' }), { id: 'q1' }],
        ]),
      });

      expect(result).toStrictEqual({ ok: true, values: { questId: 'q1', guildId: 'g1' } });
    });
  });

  describe('an explicit field on the op already carries the link', () => {
    it('VALID: {guildId already present in ownFields} => the ancestor value is not written', () => {
      const result = linkValuesTransformer({
        links: [LinkSpecStub({ of: 'guild', as: 'guildId' })],
        ancestors: [RowRefStub({ value: 'guild[0:0]' })],
        ownFields: FieldValuesStub({ guildId: 'explicit-guild-id' }),
        records: new Map([[RowRefStub({ value: 'guild[0:0]' }), { id: 'g1' }]]),
      });

      expect(result).toStrictEqual({ ok: true, values: {} });
    });
  });

  describe('three siblings under one guild', () => {
    it('VALID: {three siblings under one guild} => all three get the same guildId', () => {
      const links = [LinkSpecStub({ of: 'guild', as: 'guildId' })];
      const ancestors = [RowRefStub({ value: 'guild[0:0]' })];
      const records = new Map([[RowRefStub({ value: 'guild[0:0]' }), { id: 'g1' }]]);

      const first = linkValuesTransformer({ links, ancestors, ownFields: {}, records });
      const second = linkValuesTransformer({ links, ancestors, ownFields: {}, records });
      const third = linkValuesTransformer({ links, ancestors, ownFields: {}, records });

      expect(first).toStrictEqual({ ok: true, values: { guildId: 'g1' } });
      expect(second).toStrictEqual({ ok: true, values: { guildId: 'g1' } });
      expect(third).toStrictEqual({ ok: true, values: { guildId: 'g1' } });
    });
  });

  describe('a link naming a parent field other than id', () => {
    it('VALID: {session link with from: "sessionId"} => returns {sessionId: "s1"}', () => {
      const result = linkValuesTransformer({
        links: [LinkSpecStub({ of: 'session', as: 'sessionId', from: 'sessionId' })],
        ancestors: [RowRefStub({ value: 'session[0:0]' })],
        ownFields: {},
        records: new Map([[RowRefStub({ value: 'session[0:0]' }), { sessionId: 's1' }]]),
      });

      expect(result).toStrictEqual({ ok: true, values: { sessionId: 's1' } });
    });
  });

  describe('a row added at the top level, with no ancestor at all', () => {
    it('INVALID: {dm.quests.add(1, ...) at top level} => returns ok: false naming guild', () => {
      const result = linkValuesTransformer({
        links: [LinkSpecStub({ of: 'guild', as: 'guildId' })],
        ancestors: [],
        ownFields: {},
        records: new Map(),
      });

      expect(result).toStrictEqual({ ok: false, missingParentName: 'guild' });
    });
  });

  describe('a nested row whose second link has no matching ancestor', () => {
    it('INVALID: {an operation under a quest with no guild anywhere} => returns ok: false naming guild', () => {
      const result = linkValuesTransformer({
        links: [
          LinkSpecStub({ of: 'quest', as: 'questId' }),
          LinkSpecStub({ of: 'guild', as: 'guildId' }),
        ],
        ancestors: [RowRefStub({ value: 'quest[0:0]' })],
        ownFields: {},
        records: new Map([[RowRefStub({ value: 'quest[0:0]' }), { id: 'q1' }]]),
      });

      expect(result).toStrictEqual({ ok: false, missingParentName: 'guild' });
    });
  });
});
