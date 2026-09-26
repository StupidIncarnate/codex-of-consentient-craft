import { reportBinProgramSpawnLayerBroker } from './report-bin-program-spawn-layer-broker';
import { reportBinProgramSpawnLayerBrokerProxy } from './report-bin-program-spawn-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';
import { PackageNameStub } from '@dungeonmaster/shared/contracts';

describe('reportBinProgramSpawnLayerBroker', () => {
  describe('a homed program', () => {
    it('VALID: {commandNode: Literal "git"} => reports binProgramSpawn for git/currentBranch', () => {
      reportBinProgramSpawnLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      const commandNode = TsestreeStub({ type: TsestreeNodeType.Literal, value: 'git' });

      reportBinProgramSpawnLayerBroker({
        ctx,
        node,
        commandNode,
        argsNode: undefined,
        moduleBody: [],
        scope: PackageNameStub({ value: '@dungeonmaster' }),
      });

      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'binProgramSpawn',
        data: {
          program: 'git',
          binFunction: 'currentBranch',
          gatewayPath: '@dungeonmaster/bin/git',
        },
      });
    });

    it('VALID: {scope: "@acme"} => builds the gatewayPath from the given scope', () => {
      reportBinProgramSpawnLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      const commandNode = TsestreeStub({ type: TsestreeNodeType.Literal, value: 'lsof' });

      reportBinProgramSpawnLayerBroker({
        ctx,
        node,
        commandNode,
        argsNode: undefined,
        moduleBody: [],
        scope: PackageNameStub({ value: '@acme' }),
      });

      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'binProgramSpawn',
        data: {
          program: 'lsof',
          binFunction: 'listeningPids',
          gatewayPath: '@acme/bin/lsof',
        },
      });
    });
  });

  describe('a program with no home', () => {
    it('INVALID: {commandNode: Literal "tsc"} => never reports', () => {
      reportBinProgramSpawnLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      const commandNode = TsestreeStub({ type: TsestreeNodeType.Literal, value: 'tsc' });

      reportBinProgramSpawnLayerBroker({
        ctx,
        node,
        commandNode,
        argsNode: undefined,
        moduleBody: [],
        scope: PackageNameStub({ value: '@dungeonmaster' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });

  describe('an unresolvable command', () => {
    it('EMPTY: {commandNode: undefined} => never reports, failing open', () => {
      reportBinProgramSpawnLayerBrokerProxy();
      const mockReport = jest.fn();
      const ctx = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });

      reportBinProgramSpawnLayerBroker({
        ctx,
        node,
        commandNode: undefined,
        argsNode: undefined,
        moduleBody: [],
        scope: PackageNameStub({ value: '@dungeonmaster' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });
});
