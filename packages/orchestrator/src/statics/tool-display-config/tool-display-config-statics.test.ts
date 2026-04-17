import { toolDisplayConfigStatics } from './tool-display-config-statics';

describe('toolDisplayConfigStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(toolDisplayConfigStatics).toStrictEqual({
      limits: {
        maxLineLength: 500,
        maxValueLength: 200,
        maxParams: 3,
      },
      formatting: {
        ellipsis: '...',
      },
      priorityKeys: {
        ordered: ['filePath', 'path', 'pattern', 'query', 'url', 'prompt', 'command', 'action'],
      },
    });
  });
});
