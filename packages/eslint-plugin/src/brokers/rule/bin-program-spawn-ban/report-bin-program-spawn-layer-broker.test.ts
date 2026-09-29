import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { LiteralStub } from '#gateway/npm/typescript-eslint__utils/literal/literal.stub';
import { reportBinProgramSpawnLayerBroker } from './report-bin-program-spawn-layer-broker';
import { reportBinProgramSpawnLayerBrokerProxy } from './report-bin-program-spawn-layer-broker.proxy';

describe('reportBinProgramSpawnLayerBroker', () => {
  describe('a homed program', () => {
    it('VALID: {commandNode: Literal "git"} => reports binProgramSpawn for git/currentBranch', () => {
      reportBinProgramSpawnLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = CallExpressionStub({ code: 'f();' });
      const commandNode = LiteralStub({ code: 'const l = "git";' });

      reportBinProgramSpawnLayerBroker({
        ctx,
        node,
        commandNode,
        argsNode: undefined,
        moduleBody: [],
      });

      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'binProgramSpawn',
        data: {
          program: 'git',
          binFunction: 'currentBranch',
          gatewayPath: '#gateway/bin/git',
        },
      });
    });

    it('VALID: {commandNode: Literal "lsof"} => builds the gatewayPath from the import-alias prefix', () => {
      reportBinProgramSpawnLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = CallExpressionStub({ code: 'f();' });
      const commandNode = LiteralStub({ code: 'const l = "lsof";' });

      reportBinProgramSpawnLayerBroker({
        ctx,
        node,
        commandNode,
        argsNode: undefined,
        moduleBody: [],
      });

      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'binProgramSpawn',
        data: {
          program: 'lsof',
          binFunction: 'listeningPids',
          gatewayPath: '#gateway/bin/lsof',
        },
      });
    });
  });

  describe('a program with no home', () => {
    it('INVALID: {commandNode: Literal "tsc"} => never reports', () => {
      reportBinProgramSpawnLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = CallExpressionStub({ code: 'f();' });
      const commandNode = LiteralStub({ code: 'const l = "tsc";' });

      reportBinProgramSpawnLayerBroker({
        ctx,
        node,
        commandNode,
        argsNode: undefined,
        moduleBody: [],
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });

  describe('an unresolvable command', () => {
    it('EMPTY: {commandNode: undefined} => never reports, failing open', () => {
      reportBinProgramSpawnLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = RuleContextStub({ report: mockReport });
      const node = CallExpressionStub({ code: 'f();' });

      reportBinProgramSpawnLayerBroker({
        ctx,
        node,
        commandNode: undefined,
        argsNode: undefined,
        moduleBody: [],
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });
});
