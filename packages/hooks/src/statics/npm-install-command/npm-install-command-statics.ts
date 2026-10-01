/**
 * PURPOSE: The npm CLI vocabulary the post-bash hook needs to tell an `npm install <pkg>` that adds
 * a dependency apart from every other npm call. `subcommands` is the alias list `npm help install`
 * prints; `valueFlags` are the install flags whose value is the NEXT token, so that value is never
 * read as a package name; `noDependencyFlags` mark an install that writes no dependency into the
 * project (global, `--no-save`, dry run).
 *
 * USAGE:
 * npmInstallCommandStatics.subcommands.includes('i');
 * // Returns true
 */
export const npmInstallCommandStatics = {
  program: {
    name: 'npm',
  },
  subcommands: [
    'install',
    'add',
    'i',
    'in',
    'ins',
    'inst',
    'insta',
    'instal',
    'isnt',
    'isnta',
    'isntal',
    'isntall',
  ],
  valueFlags: [
    '-w',
    '--workspace',
    '-C',
    '--prefix',
    '--registry',
    '--tag',
    '--cache',
    '--userconfig',
    '--globalconfig',
    '--omit',
    '--include',
    '--install-strategy',
    '--save-prefix',
    '--before',
    '--loglevel',
    '--location',
    '--otp',
    '--scope',
    '--cpu',
    '--os',
    '--libc',
  ],
  noDependencyFlags: ['-g', '--global', '--location=global', '--no-save', '--dry-run'],
} as const;
