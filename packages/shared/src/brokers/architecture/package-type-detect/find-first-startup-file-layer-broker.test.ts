import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';
import { findFirstStartupFileLayerBrokerProxy } from './find-first-startup-file-layer-broker.proxy';
import { findFirstStartupFileLayerBroker } from './find-first-startup-file-layer-broker';

describe('findFirstStartupFileLayerBroker', () => {
  it('VALID: {startup dir with start-app.ts} => returns file name', () => {
    const proxy = findFirstStartupFileLayerBrokerProxy();
    proxy.setupFiles({ fileNames: ['start-app.ts', 'other-file.ts'] });

    const result = findFirstStartupFileLayerBroker({
      startupDirPath: AbsoluteFilePathStub({ value: '/project/src/startup' }),
    });

    expect(result).toBe(FileNameStub({ value: 'start-app.ts' }));
  });

  it('EMPTY: {empty startup dir} => returns undefined', () => {
    const proxy = findFirstStartupFileLayerBrokerProxy();
    proxy.setupEmpty();

    const result = findFirstStartupFileLayerBroker({
      startupDirPath: AbsoluteFilePathStub({ value: '/project/src/startup' }),
    });

    expect(result).toBe(undefined);
  });

  it('INVALID: {dir with no matching files} => returns undefined', () => {
    const proxy = findFirstStartupFileLayerBrokerProxy();
    proxy.setupFiles({ fileNames: ['other-file.ts', 'helper.ts'] });

    const result = findFirstStartupFileLayerBroker({
      startupDirPath: AbsoluteFilePathStub({ value: '/project/src/startup' }),
    });

    expect(result).toBe(undefined);
  });
});
