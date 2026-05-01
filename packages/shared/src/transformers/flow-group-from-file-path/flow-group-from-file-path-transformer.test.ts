import { flowGroupFromFilePathTransformer } from './flow-group-from-file-path-transformer';
import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';

describe('flowGroupFromFilePathTransformer', () => {
  it('VALID: {flows/quest/quest-flow.ts} => returns quest', () => {
    const result = flowGroupFromFilePathTransformer({
      filePath: AbsoluteFilePathStub({
        value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
      }),
    });

    expect(String(result)).toBe('quest');
  });

  it('VALID: {flows/health/health-flow.ts} => returns health', () => {
    const result = flowGroupFromFilePathTransformer({
      filePath: AbsoluteFilePathStub({
        value: '/repo/packages/server/src/flows/health/health-flow.ts',
      }),
    });

    expect(String(result)).toBe('health');
  });

  it('VALID: {flows/guild/guild-flow.ts} => returns guild', () => {
    const result = flowGroupFromFilePathTransformer({
      filePath: AbsoluteFilePathStub({
        value: '/repo/packages/server/src/flows/guild/guild-flow.ts',
      }),
    });

    expect(String(result)).toBe('guild');
  });

  it('EDGE: {path with no flows segment} => returns empty string', () => {
    const result = flowGroupFromFilePathTransformer({
      filePath: AbsoluteFilePathStub({
        value: '/repo/packages/server/src/responders/quest/start/quest-start-responder.ts',
      }),
    });

    expect(String(result)).toBe('');
  });
});
