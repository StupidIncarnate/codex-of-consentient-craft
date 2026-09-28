import * as eslintGateway from '../eslint';
import { ESLint } from '../eslint';
import { registerModuleMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

// Real `new ESLint(...)` reads the disk (`.eslintignore`, `.eslintcache`), which no unit test may
// do, so the gateway entry is automocked: the constructor is inert and only the methods below
// answer — each by the argument it was called with, and an unstaged call throws.
registerModuleMock({ module: '../eslint' });

type Matcher = string | ((value: unknown) => boolean);
type StagedResults = readonly Partial<Awaited<ReturnType<ESLint['lintText']>>[number]>[];

export const ESLintProxy = (): {
  constructionThrows: (params: { cwd: string; error: Error }) => void;
  lintTextReturns: (params: { text: Matcher; filePath?: Matcher; results: StagedResults }) => void;
  lintTextRejects: (params: { text: Matcher; filePath?: Matcher; error: Error }) => void;
  getLintTextCallsFor: (params: { text: Matcher }) => readonly unknown[][];
  lintFilesReturns: (params: {
    files: readonly string[] | ((value: unknown) => boolean);
    results: StagedResults;
  }) => void;
  lintFilesRejects: (params: {
    files: readonly string[] | ((value: unknown) => boolean);
    error: Error;
  }) => void;
  getLintFilesCallsFor: (params: {
    files: readonly string[] | ((value: unknown) => boolean);
  }) => readonly unknown[][];
  outputFixesResolves: (params: { results: StagedResults }) => void;
  outputFixesRejects: (params: { results: StagedResults; error: Error }) => void;
  getOutputFixesCallsFor: (params: { results: StagedResults }) => readonly unknown[][];
  isPathIgnoredReturns: (params: { filePath: Matcher; ignored: boolean }) => void;
  isPathIgnoredRejects: (params: { filePath: Matcher; error: Error }) => void;
  getIsPathIgnoredCallsFor: (params: { filePath: Matcher }) => readonly unknown[][];
  calculateConfigForFileReturns: (params: {
    filePath: Matcher;
    config: Record<PropertyKey, unknown> | null;
  }) => void;
  calculateConfigForFileRejects: (params: { filePath: Matcher; error: Error }) => void;
  getCalculateConfigForFileCallsFor: (params: { filePath: Matcher }) => readonly unknown[][];
} => {
  const lintTextHandle = registerSpyOn({ object: ESLint.prototype, method: 'lintText' });
  const lintFilesHandle = registerSpyOn({ object: ESLint.prototype, method: 'lintFiles' });
  const outputFixesHandle = registerSpyOn({ object: ESLint, method: 'outputFixes' });
  const isPathIgnoredHandle = registerSpyOn({ object: ESLint.prototype, method: 'isPathIgnored' });
  const calculateConfigHandle = registerSpyOn({
    object: ESLint.prototype,
    method: 'calculateConfigForFile',
  });

  // `lintText(text, { filePath })`: an omitted `filePath` addresses the text alone, so a caller
  // that cannot know the resolved path can still stage by text; a given one is checked as well.
  const lintTextAddress = ({
    text,
    filePath,
  }: {
    text: Matcher;
    filePath?: Matcher;
  }): readonly unknown[] => (filePath === undefined ? [text] : [text, { filePath }]);

  return {
    // Replaces the constructor with a spy that throws for this cwd and, like every other spy here,
    // for any construction it was not told about.
    constructionThrows: ({ cwd, error }): void => {
      registerSpyOn({ object: eslintGateway, method: 'ESLint' })
        .calledWith([{ cwd }])
        .throws(error);
    },

    lintTextReturns: ({ text, filePath, results }): void => {
      lintTextHandle
        .calledWith(lintTextAddress(filePath === undefined ? { text } : { text, filePath }))
        .resolves([...results]);
    },
    lintTextRejects: ({ text, filePath, error }): void => {
      lintTextHandle
        .calledWith(lintTextAddress(filePath === undefined ? { text } : { text, filePath }))
        .rejects(error);
    },
    getLintTextCallsFor: ({ text }): readonly unknown[][] => lintTextHandle.callsMatching([text]),

    lintFilesReturns: ({ files, results }): void => {
      lintFilesHandle.calledWith([files]).resolves([...results]);
    },
    lintFilesRejects: ({ files, error }): void => {
      lintFilesHandle.calledWith([files]).rejects(error);
    },
    getLintFilesCallsFor: ({ files }): readonly unknown[][] =>
      lintFilesHandle.callsMatching([files]),

    outputFixesResolves: ({ results }): void => {
      outputFixesHandle.calledWith([results]).resolves(undefined);
    },
    outputFixesRejects: ({ results, error }): void => {
      outputFixesHandle.calledWith([results]).rejects(error);
    },
    getOutputFixesCallsFor: ({ results }): readonly unknown[][] =>
      outputFixesHandle.callsMatching([results]),

    isPathIgnoredReturns: ({ filePath, ignored }): void => {
      isPathIgnoredHandle.calledWith([filePath]).resolves(ignored);
    },
    isPathIgnoredRejects: ({ filePath, error }): void => {
      isPathIgnoredHandle.calledWith([filePath]).rejects(error);
    },
    getIsPathIgnoredCallsFor: ({ filePath }): readonly unknown[][] =>
      isPathIgnoredHandle.callsMatching([filePath]),

    calculateConfigForFileReturns: ({ filePath, config }): void => {
      calculateConfigHandle.calledWith([filePath]).resolves(config);
    },
    calculateConfigForFileRejects: ({ filePath, error }): void => {
      calculateConfigHandle.calledWith([filePath]).rejects(error);
    },
    getCalculateConfigForFileCallsFor: ({ filePath }): readonly unknown[][] =>
      calculateConfigHandle.callsMatching([filePath]),
  };
};
