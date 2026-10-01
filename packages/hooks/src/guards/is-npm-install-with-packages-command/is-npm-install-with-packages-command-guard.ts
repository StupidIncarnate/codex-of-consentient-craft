/**
 * PURPOSE: Reports whether a Bash command line adds at least one npm package to the project: an
 * `npm install` (or any alias npm accepts for it) naming a package, in any `&&`/`;`/`||`/`|` segment
 * of the line. A bare `npm install` answers false, because npm's own root `postinstall` already
 * covers it; so does a global, `--no-save` or dry-run install, which writes no dependency. Flag
 * values (`-w packages/app`) and shell redirections (`2>&1`, `> log`) are never read as packages.
 *
 * USAGE:
 * isNpmInstallWithPackagesCommandGuard({ command: 'cd app && npm i -D left-pad -w packages/web' });
 * // Returns true
 */

import { npmInstallCommandStatics } from '../../statics/npm-install-command/npm-install-command-statics';

const LINE_CONTINUATION = /\\\n/gu;
const SEGMENT_SEPARATOR = /&&|\|\||[;|\n]/u;
const SUBSHELL_PARENS = /[()]/gu;
const WHITESPACE = /\s+/u;
const SURROUNDING_QUOTES = /^['"]|['"]$/gu;
const ENV_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/u;
const REDIRECTION = /^(?:\d+|&)?(?:>>?|<)(?<target>.*)$/u;

export const isNpmInstallWithPackagesCommandGuard = ({
  command,
}: {
  command?: string;
}): boolean => {
  if (command === undefined) {
    return false;
  }

  return command
    .replace(LINE_CONTINUATION, ' ')
    .split(SEGMENT_SEPARATOR)
    .some((segment) => {
      const tokens = segment
        .replace(SUBSHELL_PARENS, ' ')
        .trim()
        .split(WHITESPACE)
        .map((token) => token.replace(SURROUNDING_QUOTES, ''))
        .filter((token) => token.length > 0 && token !== '&');

      const programIndex = tokens.findIndex((token) => !ENV_ASSIGNMENT.test(token));
      const program = tokens[programIndex];

      if (
        program === undefined ||
        (program !== npmInstallCommandStatics.program.name &&
          !program.endsWith(`/${npmInstallCommandStatics.program.name}`))
      ) {
        return false;
      }

      const positionals: string[] = [];
      const flags: string[] = [];
      let pendingValueFlag: string | null = null;
      let skipRedirectTarget = false;

      for (const token of tokens.slice(programIndex + 1)) {
        if (skipRedirectTarget) {
          skipRedirectTarget = false;
          continue;
        }

        if (pendingValueFlag !== null) {
          flags.push(`${pendingValueFlag}=${token}`);
          pendingValueFlag = null;
          continue;
        }

        const redirection = REDIRECTION.exec(token);

        if (redirection !== null) {
          skipRedirectTarget = redirection.groups?.target === '';
          continue;
        }

        if (token.startsWith('-')) {
          flags.push(token);
          pendingValueFlag = npmInstallCommandStatics.valueFlags.some((flag) => flag === token)
            ? token
            : null;
          continue;
        }

        positionals.push(token);
      }

      const [subcommand, ...packages] = positionals;

      const isInstall = npmInstallCommandStatics.subcommands.some((alias) => alias === subcommand);
      const writesNoDependency = flags.some((flag) =>
        npmInstallCommandStatics.noDependencyFlags.some((noDependency) => noDependency === flag),
      );

      return isInstall && packages.length > 0 && !writesNoDependency;
    });
};
