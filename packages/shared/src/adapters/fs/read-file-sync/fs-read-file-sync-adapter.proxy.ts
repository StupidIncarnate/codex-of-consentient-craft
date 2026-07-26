import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const fsReadFileSyncAdapterProxy = (): {
  returns: (params: { filePath: AbsoluteFilePath; content: ContentText }) => void;
  throws: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  implementation: (params: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const handle = registerMock({ fn: readFileSync });

  // Composing proxies (e.g. architectureBootTreeBrokerProxy, packageSectionBuildLayerBrokerProxy)
  // instantiate several sibling proxies over this same fs mock purely so their code paths don't
  // crash on files the test never describes. This lowest-specificity fallback keeps that working:
  // a call to a path nobody staged returns '' instead of throwing, while a path-specific
  // `returns`/`throws`/`implementation` staged below always outranks it (higher specificity, or
  // later at a tie). Known lint gap: @dungeonmaster/enforce-proxy-patterns does not yet recognize
  // `handle.calledWith(...).returns(...)` as legitimate constructor-level mock setup (it only
  // recognizes the old `handle.mockReturnValue(...)` shape) — a fix is tracked separately.
  handle.calledWith([]).returns('' as never);

  return {
    returns: ({
      filePath,
      content,
    }: {
      filePath: AbsoluteFilePath;
      content: ContentText;
    }): void => {
      handle.calledWith([filePath]).returns(content as never);
    },
    throws: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      handle.calledWith([filePath]).throws(error);
    },
    implementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      handle.calledWith([]).implement(fn as never);
    },
  };
};
