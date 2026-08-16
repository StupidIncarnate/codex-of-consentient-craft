import { DisciplineStub } from '../../contracts/discipline/discipline.stub';
import { disciplineBelowBrowserStatics } from '../../statics/discipline-below-browser/discipline-below-browser-statics';
import { disciplineBrowserE2eStatics } from '../../statics/discipline-browser-e2e/discipline-browser-e2e-statics';
import { disciplineBugReproStatics } from '../../statics/discipline-bug-repro/discipline-bug-repro-statics';
import { disciplineImplementationStatics } from '../../statics/discipline-implementation/discipline-implementation-statics';
import { disciplineManualQaStatics } from '../../statics/discipline-manual-qa/discipline-manual-qa-statics';
import { roleToDisciplineStatics } from '../../statics/role-to-discipline/role-to-discipline-statics';
import { disciplineToPackTransformer } from './discipline-to-pack-transformer';

// Every discipline an orchestrator role can be dispatched with, read off the role map rather than
// listed here: a discipline added there and forgotten in a hand-written case list is exactly the
// silent gap the transformer's `never` default exists to make impossible.
const EVERY_DISPATCHABLE_DISCIPLINE = Object.values(roleToDisciplineStatics);

describe('disciplineToPackTransformer', () => {
  describe('every discipline resolves to its own pack', () => {
    it('VALID: {discipline: implementation} => returns the implementation pack', () => {
      const result = disciplineToPackTransformer({
        discipline: DisciplineStub({ value: 'implementation' }),
      });

      expect(result).toBe(disciplineImplementationStatics);
    });

    it('VALID: {discipline: bug-repro} => returns the bug-repro pack', () => {
      const result = disciplineToPackTransformer({
        discipline: DisciplineStub({ value: 'bug-repro' }),
      });

      expect(result).toBe(disciplineBugReproStatics);
    });

    it('VALID: {discipline: below-browser} => returns the below-browser pack', () => {
      const result = disciplineToPackTransformer({
        discipline: DisciplineStub({ value: 'below-browser' }),
      });

      expect(result).toBe(disciplineBelowBrowserStatics);
    });

    it('VALID: {discipline: browser-e2e} => returns the browser-e2e pack', () => {
      const result = disciplineToPackTransformer({
        discipline: DisciplineStub({ value: 'browser-e2e' }),
      });

      expect(result).toBe(disciplineBrowserE2eStatics);
    });

    it('VALID: {discipline: manual-qa} => returns the manual-qa pack', () => {
      const result = disciplineToPackTransformer({
        discipline: DisciplineStub({ value: 'manual-qa' }),
      });

      expect(result).toBe(disciplineManualQaStatics);
    });
  });

  describe('every dispatchable discipline resolves to four non-empty blocks', () => {
    it.each(EVERY_DISPATCHABLE_DISCIPLINE)(
      'VALID: {discipline: %s} => returns a pack carrying all four substitution blocks',
      (discipline) => {
        const pack = disciplineToPackTransformer({
          discipline: DisciplineStub({ value: discipline }),
        });

        expect({
          orchestrator: pack.orchestratorMarkdown.length > 0,
          planner: pack.plannerMarkdown.length > 0,
          worker: pack.workerMarkdown.length > 0,
          reviewer: pack.reviewerMarkdown.length > 0,
        }).toStrictEqual({ orchestrator: true, planner: true, worker: true, reviewer: true });
      },
    );
  });

  describe('unknown discipline', () => {
    it('INVALID: {discipline: "orchestration"} => throws parsing the discipline', () => {
      expect(() => {
        DisciplineStub({ value: 'orchestration' as never });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
