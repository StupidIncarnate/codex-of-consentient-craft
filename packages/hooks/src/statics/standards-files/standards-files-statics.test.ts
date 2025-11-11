import { standardsFilesStatics } from './standards-files-statics';

describe('standardsFilesStatics', () => {
  it('VALID: array => contains expected standards files', () => {
    expect(standardsFilesStatics).toStrictEqual(['coding-standards.md', 'testing-standards.md']);
  });
});
