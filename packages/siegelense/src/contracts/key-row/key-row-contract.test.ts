import { keyRowContract } from './key-row-contract';
import { KeyRowStub } from './key-row.stub';

describe('keyRowContract', () => {
  describe('valid rows', () => {
    it('VALID: {a testId row with own text} => parses whole', () => {
      const row = KeyRowStub({
        ref: 26,
        depth: 2,
        testId: 'subagent-chain-duration',
        tag: 'span',
        text: '4m',
        flags: ['clipped-x'],
      });

      const result = keyRowContract.parse(row);

      expect(result).toStrictEqual({
        ref: 26,
        depth: 2,
        testId: 'subagent-chain-duration',
        tag: 'span',
        role: null,
        domId: null,
        sibling: null,
        text: '4m',
        value: null,
        placeholder: null,
        attrs: [],
        attrsDropped: 0,
        flags: ['clipped-x'],
        flagDetail: {},
      });
    });

    it('VALID: {an input row} => carries the current value and the placeholder as separate columns', () => {
      const row = KeyRowStub({
        ref: 41,
        depth: 1,
        testId: 'GUILD_NAME_INPUT',
        tag: 'input',
        text: null,
        value: '',
        placeholder: 'my-guild',
        attrs: [{ name: 'maxlength', value: '40' }],
        flags: ['focused'],
      });

      const result = keyRowContract.parse(row);

      expect(result).toStrictEqual({
        ref: 41,
        depth: 1,
        testId: 'GUILD_NAME_INPUT',
        tag: 'input',
        role: null,
        domId: null,
        sibling: null,
        text: null,
        value: '',
        placeholder: 'my-guild',
        attrs: [{ name: 'maxlength', value: '40' }],
        attrsDropped: 0,
        flags: ['focused'],
        flagDetail: {},
      });
    });

    it('VALID: {an untagged row with no testId} => the tag is still present, because the testId never replaces it', () => {
      const row = KeyRowStub({ ref: 24, depth: 2, testId: null, tag: 'p', text: '▾ SUB-AGENT' });

      const result = keyRowContract.parse(row);

      expect(result.tag).toBe('p');
    });

    it('VALID: {a flag carrying a measurement} => flagDetail holds it so the column stays one word wide', () => {
      const row = KeyRowStub({
        ref: 52,
        flags: ['low-contrast'],
        flagDetail: { 'low-contrast': '1.4' },
      });

      const result = keyRowContract.parse(row);

      expect(result.flagDetail).toStrictEqual({ 'low-contrast': '1.4' });
    });

    it('VALID: {siblings sharing a name} => the nth marker parses', () => {
      const row = KeyRowStub({ ref: 27, testId: 'CHAT_MESSAGE', tag: 'div', sibling: '1/2' });

      const result = keyRowContract.parse(row);

      expect(result.sibling).toBe('1/2');
    });
  });

  describe('invalid rows', () => {
    it('INVALID: {ref: 0} => throws, because a ref names one element and zero names none', () => {
      expect(() => keyRowContract.parse({ ...KeyRowStub(), ref: 0 })).toThrow(
        /Number must be greater than 0/u,
      );
    });

    it('INVALID: {tag: null} => throws, because the tag is present even when a testId is', () => {
      expect(() => keyRowContract.parse({ ...KeyRowStub(), tag: null })).toThrow(
        /Expected string/u,
      );
    });

    it('INVALID: {flags: ["className"]} => throws, because className is in neither column', () => {
      expect(() => keyRowContract.parse({ ...KeyRowStub(), flags: ['className'] })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {depth: -1} => throws', () => {
      expect(() => keyRowContract.parse({ ...KeyRowStub(), depth: -1 })).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });
  });
});
