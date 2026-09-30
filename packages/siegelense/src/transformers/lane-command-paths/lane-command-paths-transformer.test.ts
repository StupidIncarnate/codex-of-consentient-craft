import { LaneProcessStub } from '../../contracts/lane-process/lane-process.stub';
import { LaneSpecStub } from '../../contracts/lane-spec/lane-spec.stub';
import { laneCommandPathsTransformer } from './lane-command-paths-transformer';

describe('laneCommandPathsTransformer', () => {
  describe('a vite preview process', () => {
    it('VALID: {sh -c "npx vite preview --config ... --outDir packages/web/dist"} => returns both repo-relative paths', () => {
      const spec = LaneSpecStub({
        processes: [
          LaneProcessStub({
            name: 'web',
            command: 'sh',
            args: [
              '-c',
              'npx vite preview --config packages/web/vite.config.ts --strictPort --outDir packages/web/dist',
            ],
            portRole: 'web',
            logFileName: 'web-server.log',
          }),
        ],
      });

      expect(laneCommandPathsTransformer({ spec })).toStrictEqual([
        'packages/web/vite.config.ts',
        'packages/web/dist',
      ]);
    });
  });

  describe('flag values and normalisation', () => {
    it('VALID: {--outDir=./dist/app/} => returns the value half with ./ and the trailing / trimmed', () => {
      const spec = LaneSpecStub({
        processes: [LaneProcessStub({ command: 'serve', args: ['--outDir=./dist/app/'] })],
      });

      expect(laneCommandPathsTransformer({ spec })).toStrictEqual(['dist/app']);
    });

    it('VALID: {one folder named by two processes} => returns it once', () => {
      const spec = LaneSpecStub({
        processes: [
          LaneProcessStub({ name: 'api', command: 'serve', args: ['web/dist'] }),
          LaneProcessStub({
            name: 'web',
            command: 'serve',
            args: ['./web/dist'],
            portRole: 'web',
            logFileName: 'web-server.log',
          }),
        ],
      });

      expect(laneCommandPathsTransformer({ spec })).toStrictEqual(['web/dist']);
    });
  });

  describe('tokens git cannot answer for', () => {
    it('EMPTY: {absolute, .., npm scope, {token}, $VAR, quoted, bare words} => returns no paths', () => {
      const spec = LaneSpecStub({
        processes: [
          LaneProcessStub({
            command: 'sh',
            args: [
              '-c',
              'npm run dev:no-watch --workspace=@dungeonmaster/server /abs/dist ../other/dist {webWorkspace}/dist $OUT/dist "quoted/dist"',
            ],
          }),
        ],
      });

      expect(laneCommandPathsTransformer({ spec })).toStrictEqual([]);
    });
  });
});
