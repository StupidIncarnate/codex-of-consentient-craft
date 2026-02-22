import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { BinCommandStub } from '../../../contracts/bin-command/bin-command.stub';

import { binResolveBroker } from './bin-resolve-broker';
import { binResolveBrokerProxy } from './bin-resolve-broker.proxy';

describe('binResolveBroker', () => {
  describe('binary exists in node_modules/.bin', () => {
    it('VALID: {eslint exists in .bin} => returns absolute path to binary', () => {
      const proxy = binResolveBrokerProxy();
      proxy.setupFound();

      const result = binResolveBroker({
        binName: BinCommandStub({ value: 'eslint' }),
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(String(result)).toBe('/project/node_modules/.bin/eslint');
    });
  });

  describe('binary not found in node_modules/.bin', () => {
    it('VALID: {eslint not in .bin} => returns bare binary name', () => {
      const proxy = binResolveBrokerProxy();
      proxy.setupNotFound();

      const result = binResolveBroker({
        binName: BinCommandStub({ value: 'eslint' }),
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(String(result)).toBe('eslint');
    });
  });
});
