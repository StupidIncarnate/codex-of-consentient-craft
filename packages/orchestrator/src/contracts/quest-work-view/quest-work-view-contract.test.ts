import { questWorkViewContract } from './quest-work-view-contract';
import { QuestWorkViewStub } from './quest-work-view.stub';

describe('questWorkViewContract', () => {
  describe('the null rule', () => {
    it('VALID: {piece unset} => the KEY is present carrying null, not absent', () => {
      const view = QuestWorkViewStub({ piece: null });

      expect('piece' in view).toBe(true);
      expect(view.piece).toBe(null);
    });

    it('VALID: {serialized} => the round trip loses no key, so nothing was left undefined', () => {
      const view = QuestWorkViewStub();

      expect(JSON.parse(JSON.stringify(view))).toStrictEqual(view);
    });

    it('VALID: {every nullable row unset} => each arrives as null rather than absent', () => {
      const view = QuestWorkViewStub();

      expect({
        piece: view.piece,
        mintingObservation: view.mintingObservation,
        ward: view.ward,
        riftcarverLogPath: view.riftcarverLogPath,
        instance: view.instance,
        baseline: view.baseline,
        scopeFlowId: view.scope.flowId,
        gitBaseBranch: view.git.baseBranch,
      }).toStrictEqual({
        piece: null,
        mintingObservation: null,
        ward: null,
        riftcarverLogPath: null,
        instance: null,
        baseline: null,
        scopeFlowId: 'send-flow',
        gitBaseBranch: null,
      });
    });

    it('VALID: {scope.flowId: null} => the contracts-only codeweaver cell parses', () => {
      const view = QuestWorkViewStub({
        scope: {
          flowId: null,
          packageNames: ['shared'],
          operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
          operationItemText: 'the contracts this package owns — package: shared',
        } as never,
      });

      expect(view.scope.flowId).toBe(null);
    });

    it("INVALID: {scope.flowId: ''} => refused, so an empty string can never stand in for null", () => {
      expect(() =>
        QuestWorkViewStub({
          scope: {
            flowId: '',
            packageNames: [],
            operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
            operationItemText: 'text',
          } as never,
        }),
      ).toThrow(/flowId/u);
    });
  });

  describe('units', () => {
    it('VALID: {a settled unit} => mark, evidence, toSettle and the marking work item all round-trip', () => {
      const view = QuestWorkViewStub({
        assignedUnits: [
          {
            unitId: 'send-flow:observable:scan-finds-every-path',
            kind: 'observable',
            text: 'the scan finds every path',
            surface: 'the real filesystem',
            nodeId: 'scan',
            edgeId: null,
            observableType: 'file-exists',
            verifyByReading: false,
            mark: 'cant-meet',
            evidence: 'no lane reaches the writer from here',
            toSettle: 'drive a real send through a live quest and read the session JSONL',
            markedBy: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
            markedAt: '2026-01-01T00:00:00.000Z',
          },
        ] as never,
      });

      const [unit] = view.assignedUnits;

      expect({
        unitId: unit?.unitId,
        mark: unit?.mark,
        evidence: unit?.evidence,
        toSettle: unit?.toSettle,
        markedBy: unit?.markedBy,
        markedAt: unit?.markedAt,
      }).toStrictEqual({
        unitId: 'send-flow:observable:scan-finds-every-path',
        mark: 'cant-meet',
        evidence: 'no lane reaches the writer from here',
        toSettle: 'drive a real send through a live quest and read the session JSONL',
        markedBy: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
        markedAt: '2026-01-01T00:00:00.000Z',
      });
    });

    it('VALID: {an off-map unit hanging on neither anchor} => nodeId and edgeId are both null', () => {
      const view = QuestWorkViewStub({
        assignedUnits: [
          {
            unitId: 'send-flow:off-map:hostile-input',
            kind: 'off-map',
            text: 'hostile input',
            surface: 'whatever surface the probe touches',
            nodeId: null,
            edgeId: null,
            observableType: null,
            verifyByReading: false,
            mark: null,
            evidence: null,
            toSettle: null,
            markedBy: null,
            markedAt: null,
          },
        ] as never,
      });

      expect({
        nodeId: view.assignedUnits[0]?.nodeId,
        edgeId: view.assignedUnits[0]?.edgeId,
      }).toStrictEqual({ nodeId: null, edgeId: null });
    });

    it('INVALID: {unitId: offmap:hostile-input} => refused, because it joins to nothing', () => {
      expect(() =>
        QuestWorkViewStub({
          assignedUnits: [
            {
              unitId: 'offmap:hostile-input',
              kind: 'off-map',
              text: 'hostile input',
              surface: 'whatever surface the probe touches',
              nodeId: null,
              edgeId: null,
              observableType: null,
              verifyByReading: false,
              mark: null,
              evidence: null,
              toSettle: null,
              markedBy: null,
              markedAt: null,
            },
          ] as never,
        }),
      ).toThrow(/unitId/u);
    });
  });

  describe('truncation', () => {
    it('VALID: {truncated: flows dropped 2} => section and dropped count round-trip', () => {
      const view = QuestWorkViewStub({
        truncated: [{ section: 'flows', dropped: 2 }] as never,
      });

      expect(view.truncated).toStrictEqual([{ section: 'flows', dropped: 2 }]);
    });

    it('INVALID: {truncated section the cut order does not name} => refused', () => {
      expect(() =>
        QuestWorkViewStub({ truncated: [{ section: 'assignedUnits', dropped: 1 }] as never }),
      ).toThrow(/section/u);
    });
  });

  describe('required rows', () => {
    it('INVALID: {no scope} => refused, because without it every family is dead on its first call', () => {
      const { scope, ...rest } = QuestWorkViewStub();

      expect(String(scope.operationItemId)).toBe('a1b2c3d4-58cc-4372-a567-0e02b2c3d479');
      expect(() => questWorkViewContract.parse(rest)).toThrow(/scope/u);
    });

    it('INVALID: {role outside planner|worker|reviewer} => refused', () => {
      expect(() => QuestWorkViewStub({ role: 'antagonist' as never })).toThrow(/role/u);
    });
  });
});
