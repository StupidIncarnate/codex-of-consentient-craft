import { folderConstraintsInitBroker } from './folder-constraints-init-broker';
import { folderConstraintsStatics } from '../../../statics/folder-constraints/folder-constraints-statics';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

describe('folderConstraintsInitBroker (integration: real constraint files on disk)', () => {
  it('VALID: {real statics/folder-constraints directory} => every mapped file loads non-empty with the folder-structure heading, under a folder type the shared folder config knows', async () => {
    const { folderConstraints } = await folderConstraintsInitBroker();

    const loaded = [...folderConstraints.entries()].map(([folderType, content]) => ({
      folderType,
      nonEmpty: String(content).trim().length > 0,
      hasFolderStructureHeading: /^\*\*FOLDER STRUCTURE:\*\*$/mu.test(String(content)),
      inFolderConfig: Object.keys(folderConfigStatics).some((key) => key === folderType),
    }));

    expect(loaded).toStrictEqual(
      Object.keys(folderConstraintsStatics).map((folderType) => ({
        folderType,
        nonEmpty: true,
        hasFolderStructureHeading: true,
        inFolderConfig: true,
      })),
    );
  });
});
