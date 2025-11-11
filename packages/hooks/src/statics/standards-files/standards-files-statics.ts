/**
 * PURPOSE: Defines the list of standards markdown files to load from @questmaestro/standards
 *
 * USAGE:
 * import { standardsFilesStatics } from './statics/standards-files/standards-files-statics';
 * standardsFilesStatics.forEach(file => console.log(file));
 * // Iterates through: ['coding-standards.md', 'testing-standards.md']
 */
export const standardsFilesStatics = ['coding-standards.md', 'testing-standards.md'] as const;
