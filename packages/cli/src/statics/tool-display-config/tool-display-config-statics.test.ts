import { toolDisplayConfigStatics } from './tool-display-config-statics';

describe('toolDisplayConfigStatics', () => {
  describe('structure', () => {
    it('VALID: {limits} => has expected limit values', () => {
      expect(toolDisplayConfigStatics.limits).toStrictEqual({
        maxLineLength: 500,
        maxValueLength: 200,
        maxParams: 3,
      });
    });

    it('VALID: {formatting} => has expected formatting values', () => {
      expect(toolDisplayConfigStatics.formatting).toStrictEqual({
        ellipsis: '...',
      });
    });

    it('VALID: {priorityKeys} => has expected ordered priority keys', () => {
      expect(toolDisplayConfigStatics.priorityKeys.ordered).toStrictEqual([
        'file_path',
        'path',
        'pattern',
        'query',
        'url',
        'prompt',
        'command',
        'action',
      ]);
    });
  });

  describe('values', () => {
    it('VALID: {maxLineLength} => is 500 characters', () => {
      expect(toolDisplayConfigStatics.limits.maxLineLength).toBe(500);
    });

    it('VALID: {maxValueLength} => is 200 characters', () => {
      expect(toolDisplayConfigStatics.limits.maxValueLength).toBe(200);
    });

    it('VALID: {maxParams} => is 3 parameters', () => {
      expect(toolDisplayConfigStatics.limits.maxParams).toBe(3);
    });

    it('VALID: {ellipsis} => is "..."', () => {
      expect(toolDisplayConfigStatics.formatting.ellipsis).toBe('...');
    });

    it('VALID: {priorityKeys.ordered length} => has 8 priority keys', () => {
      expect(toolDisplayConfigStatics.priorityKeys.ordered).toHaveLength(8);
    });

    it('VALID: {priorityKeys first} => file_path is highest priority', () => {
      expect(toolDisplayConfigStatics.priorityKeys.ordered[0]).toBe('file_path');
    });
  });
});
