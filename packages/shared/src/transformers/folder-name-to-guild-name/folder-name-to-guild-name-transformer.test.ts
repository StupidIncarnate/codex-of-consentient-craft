import { folderNameToGuildNameTransformer } from './folder-name-to-guild-name-transformer';
import { PathSegmentStub } from '../../contracts/path-segment/path-segment.stub';

describe('folderNameToGuildNameTransformer', () => {
  describe('hyphenated names', () => {
    it("VALID: {folderName: 'codex-of-consentient-craft'} => returns 'Codex of Consentient Craft'", () => {
      const folderName = PathSegmentStub({ value: 'codex-of-consentient-craft' });

      const result = folderNameToGuildNameTransformer({ folderName });

      expect(result).toBe('Codex of Consentient Craft');
    });

    it("EDGE: {folderName: 'the-best-app'} => returns 'The Best App'", () => {
      const folderName = PathSegmentStub({ value: 'the-best-app' });

      const result = folderNameToGuildNameTransformer({ folderName });

      expect(result).toBe('The Best App');
    });

    it("VALID: {folderName: 'app-and-the-best-thing'} => returns 'App and the Best Thing'", () => {
      const folderName = PathSegmentStub({ value: 'app-and-the-best-thing' });

      const result = folderNameToGuildNameTransformer({ folderName });

      expect(result).toBe('App and the Best Thing');
    });
  });

  describe('underscore names', () => {
    it("VALID: {folderName: 'my_cool_project'} => returns 'My Cool Project'", () => {
      const folderName = PathSegmentStub({ value: 'my_cool_project' });

      const result = folderNameToGuildNameTransformer({ folderName });

      expect(result).toBe('My Cool Project');
    });
  });

  describe('camelCase names', () => {
    it("VALID: {folderName: 'myAwesomeApp'} => returns 'My Awesome App'", () => {
      const folderName = PathSegmentStub({ value: 'myAwesomeApp' });

      const result = folderNameToGuildNameTransformer({ folderName });

      expect(result).toBe('My Awesome App');
    });
  });

  describe('dotted names', () => {
    it("VALID: {folderName: 'foo.bar.baz'} => returns 'Foo Bar Baz'", () => {
      const folderName = PathSegmentStub({ value: 'foo.bar.baz' });

      const result = folderNameToGuildNameTransformer({ folderName });

      expect(result).toBe('Foo Bar Baz');
    });
  });

  describe('single word names', () => {
    it("EDGE: {folderName: 'singlefolder'} => returns 'Singlefolder'", () => {
      const folderName = PathSegmentStub({ value: 'singlefolder' });

      const result = folderNameToGuildNameTransformer({ folderName });

      expect(result).toBe('Singlefolder');
    });
  });

  describe('boundary separators', () => {
    it("EDGE: {folderName: '-my-app-'} => returns 'My App' (leading/trailing separators produce empty segments that are dropped)", () => {
      const folderName = PathSegmentStub({ value: '-my-app-' });

      const result = folderNameToGuildNameTransformer({ folderName });

      expect(result).toBe('My App');
    });
  });
});
