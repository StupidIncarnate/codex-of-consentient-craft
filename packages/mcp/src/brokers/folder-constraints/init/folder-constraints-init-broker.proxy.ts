/**
 * PURPOSE: Test setup helper for folder constraints init broker. The gateway's `readFileProxy`
 * ships no real-disk passthrough the way the old local adapter proxy did, so every one of the 14
 * constraint files the broker looks up is staged explicitly here, addressed by its own real
 * resolved path. Each file's content is the literal opening line every constraint file on disk
 * starts with, plus — for the five folder types folder-constraints-init-broker.test.ts asserts
 * content on — that file's own real section header, copied verbatim from disk.
 *
 * USAGE:
 * folderConstraintsInitBrokerProxy();
 * await folderConstraintsInitBroker();
 * // Every constraint file this broker looks up resolves to its staged excerpt
 */
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { pathResolveAdapterProxy } from '../../../adapters/path/resolve/path-resolve-adapter.proxy';
import { pathResolveAdapter } from '../../../adapters/path/resolve/path-resolve-adapter';
import { folderConstraintsStatics } from '../../../statics/folder-constraints/folder-constraints-statics';
import type { FolderTypeWithConstraints } from '../../../statics/folder-constraints/folder-constraints-statics';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

type ContentText = ReturnType<typeof ContentTextStub>;

// Every constraint markdown file on disk opens with this exact line.
const FOLDER_STRUCTURE_HEADING = ContentTextStub({ value: '**FOLDER STRUCTURE:**' });

// The one real section-header line each content-asserting test in
// folder-constraints-init-broker.test.ts checks for, copied verbatim from its constraint file.
const SECTION_HEADING_BY_FOLDER_TYPE: Partial<Record<FolderTypeWithConstraints, ContentText>> = {
  adapters: ContentTextStub({ value: '**TRANSLATION BOUNDARY:**' }),
  brokers: ContentTextStub({ value: '**PROXY PATTERN:**' }),
  guards: ContentTextStub({ value: '**OBJECT ARGUMENTS FOR STATICS:**' }),
  contracts: ContentTextStub({ value: '**CRITICAL - TEST IMPORTS:**' }),
  statics: ContentTextStub({ value: '**CRITICAL RULES:**' }),
};

export const folderConstraintsInitBrokerProxy = (): Record<PropertyKey, never> => {
  pathResolveAdapterProxy();
  const fileGateway = readFileProxy();

  const constraintsDir = pathResolveAdapter({
    paths: [__dirname, '../../../statics/folder-constraints'],
  });

  for (const [folderType, filename] of Object.entries(folderConstraintsStatics)) {
    const filepath = pathResolveAdapter({ paths: [constraintsDir, filename] });
    const sectionHeading = SECTION_HEADING_BY_FOLDER_TYPE[folderType as FolderTypeWithConstraints];
    const contents = sectionHeading
      ? ContentTextStub({ value: `${FOLDER_STRUCTURE_HEADING}\n${sectionHeading}` })
      : FOLDER_STRUCTURE_HEADING;
    fileGateway.returns({ path: filepath, contents });
  }

  return {};
};
