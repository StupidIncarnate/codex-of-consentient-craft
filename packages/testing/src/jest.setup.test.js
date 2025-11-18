/**
 * Tests for jest.setup.js runtime enforcement
 *
 * These tests verify that .todo and .skip are forbidden at runtime
 */

describe('jest.setup runtime enforcement', () => {
  describe('test.todo', () => {
    it('VALID: attempting test.todo => throws error', () => {
      expect(() => {
        global.test.todo('this should throw');
      }).toThrow(/test\.todo\(\) is forbidden/u);
    });
  });

  describe('it.todo', () => {
    it('VALID: attempting it.todo => throws error', () => {
      expect(() => {
        global.it.todo('this should throw');
      }).toThrow(/it\.todo\(\) is forbidden/u);
    });
  });

  describe('describe.skip', () => {
    it('VALID: attempting describe.skip => throws error', () => {
      expect(() => {
        global.describe.skip('this should throw', () => {});
      }).toThrow(/describe\.skip\(\) is forbidden/u);
    });
  });

  describe('test.skip', () => {
    it('VALID: attempting test.skip => throws error', () => {
      expect(() => {
        global.test.skip('this should throw', () => {});
      }).toThrow(/test\.skip\(\) is forbidden/u);
    });
  });

  describe('it.skip', () => {
    it('VALID: attempting it.skip => throws error', () => {
      expect(() => {
        global.it.skip('this should throw', () => {});
      }).toThrow(/it\.skip\(\) is forbidden/u);
    });
  });

  describe('normal test methods', () => {
    it('VALID: regular it() => works normally', () => {
      expect(true).toBe(true);
    });

    it('VALID: regular test() => works normally', () => {
      expect(true).toBe(true);
    });

    describe('VALID: regular describe() => works normally', () => {
      it('nested test', () => {
        expect(true).toBe(true);
      });
    });
  });
});
