import { portKillListenerResultContract } from './port-kill-listener-result-contract';
import { PortKillListenerResultStub } from './port-kill-listener-result.stub';

describe('portKillListenerResultContract', () => {
  describe('valid results', () => {
    it('VALID: {pid, exitCode: 0, output: ""} => parses a successful kill', () => {
      const result = PortKillListenerResultStub({ pid: 12345, exitCode: 0, output: '' });

      const parsed = portKillListenerResultContract.parse(result);

      expect(parsed).toStrictEqual({ pid: 12345, exitCode: 0, output: '' });
    });

    it('VALID: {exitCode: 1, output: non-empty} => parses a refusal, not an invented success', () => {
      const result = PortKillListenerResultStub({
        pid: 999,
        exitCode: 1,
        output: 'kill: (999): No such process',
      });

      const parsed = portKillListenerResultContract.parse(result);

      expect(parsed).toStrictEqual({
        pid: 999,
        exitCode: 1,
        output: 'kill: (999): No such process',
      });
    });

    it('VALID: {stub defaults} => parses a successful, empty-output result', () => {
      const result = PortKillListenerResultStub();

      expect(result).toStrictEqual({ pid: 12345, exitCode: 0, output: '' });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {pid: 0} => throws validation error', () => {
      expect(() => {
        return portKillListenerResultContract.parse({ pid: 0, exitCode: 0, output: '' });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {pid: -1} => throws validation error', () => {
      expect(() => {
        return portKillListenerResultContract.parse({ pid: -1, exitCode: 0, output: '' });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {pid: 1.5} => throws validation error', () => {
      expect(() => {
        return portKillListenerResultContract.parse({ pid: 1.5, exitCode: 0, output: '' });
      }).toThrow('Invalid input: expected int, received number');
    });

    it('INVALID: {missing pid} => throws validation error', () => {
      expect(() => {
        return portKillListenerResultContract.parse({ exitCode: 0, output: '' });
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {missing exitCode} => throws validation error', () => {
      expect(() => {
        return portKillListenerResultContract.parse({ pid: 12345, output: '' });
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {missing output} => throws validation error', () => {
      expect(() => {
        return portKillListenerResultContract.parse({ pid: 12345, exitCode: 0 });
      }).toThrow(/received undefined/u);
    });

    it('EMPTY: {missing all fields} => throws validation error', () => {
      expect(() => {
        return portKillListenerResultContract.parse({});
      }).toThrow(/received undefined/u);
    });
  });
});
