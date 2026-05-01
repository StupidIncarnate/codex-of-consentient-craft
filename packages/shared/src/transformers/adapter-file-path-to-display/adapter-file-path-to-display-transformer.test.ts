import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';
import { adapterFilePathToDisplayTransformer } from './adapter-file-path-to-display-transformer';

describe('adapterFilePathToDisplayTransformer', () => {
  it('VALID: {same package} => returns bare adapters/<vendor>/<sub> slash-path', () => {
    const result = adapterFilePathToDisplayTransformer({
      filePath: AbsoluteFilePathStub({
        value:
          '/repo/packages/server/src/adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.ts',
      }),
      renderingFilePath: AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      }),
    });

    expect(result).toBe(ContentTextStub({ value: 'adapters/orchestrator/get-quest' }));
  });

  it('VALID: {cross package} => prepends referenced package name', () => {
    const result = adapterFilePathToDisplayTransformer({
      filePath: AbsoluteFilePathStub({
        value: '/repo/packages/web/src/adapters/fetch/post/fetch-post-adapter.ts',
      }),
      renderingFilePath: AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      }),
    });

    expect(result).toBe(ContentTextStub({ value: 'web/adapters/fetch/post' }));
  });

  it('VALID: {single-segment adapter folder} => returns adapters/<vendor>', () => {
    const result = adapterFilePathToDisplayTransformer({
      filePath: AbsoluteFilePathStub({
        value: '/repo/packages/server/src/adapters/hono/serve-adapter.ts',
      }),
      renderingFilePath: AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      }),
    });

    expect(result).toBe(ContentTextStub({ value: 'adapters/hono' }));
  });

  it('INVALID: {file path outside packages/<pkg>/src/} => throws out-of-bounds error', () => {
    expect(() =>
      adapterFilePathToDisplayTransformer({
        filePath: AbsoluteFilePathStub({ value: '/somewhere/else/file.ts' }),
        renderingFilePath: AbsoluteFilePathStub({
          value: '/repo/packages/server/src/startup/start-server.ts',
        }),
      }),
    ).toThrow('adapterFilePathToDisplayTransformer');
  });

  it('INVALID: {rendering path outside packages/<pkg>/src/} => throws out-of-bounds error', () => {
    expect(() =>
      adapterFilePathToDisplayTransformer({
        filePath: AbsoluteFilePathStub({
          value: '/repo/packages/server/src/adapters/orchestrator/get-quest/x-adapter.ts',
        }),
        renderingFilePath: AbsoluteFilePathStub({ value: '/somewhere/else.ts' }),
      }),
    ).toThrow('adapterFilePathToDisplayTransformer');
  });
});
