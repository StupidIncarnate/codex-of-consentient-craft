/**
 * PURPOSE: Represents an error when no package.json is found searching up the directory tree
 *
 * USAGE:
 * throw new ProjectRootNotFoundError({startPath: '/path/to/file.js'});
 * // Throws error indicating no project root found starting from the given path
 */
export class ProjectRootNotFoundError extends Error {
  public constructor({ startPath }: { startPath: string }) {
    super(
      `No package.json found starting from ${startPath}. Searched up the directory tree but no project root was found.`,
    );
    this.name = 'ProjectRootNotFoundError';
  }
}
