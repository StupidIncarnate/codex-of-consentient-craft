import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsQuestImagesPathFindBrokerProxy = (): {
  setupQuestImagesPath: (params: { questImagesPath: FilePath }) => void;
} => {
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports. No composing test anywhere (checked via discover) calls
  // setupQuestImagesPath — every consumer composes this proxy only for enforce-proxy-child-creation
  // — and this file's own test relies on join() staying a genuine passthrough by default to prove
  // the broker really joins on locationsStatics.quest.imagesDir. So the base default is the real
  // implementation via requireActual, exactly like dungeonmaster-home-find-broker.proxy.ts's own
  // join() default; setupQuestImagesPath overrides it for one call only.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  return {
    setupQuestImagesPath: ({ questImagesPath }: { questImagesPath: FilePath }): void => {
      joinHandle.onceFor([]).returns(questImagesPath);
    },
  };
};
