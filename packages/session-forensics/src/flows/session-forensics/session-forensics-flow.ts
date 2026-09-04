/**
 * PURPOSE: Routes a raw CLI argv array to the digest command it names. `DigestRunResponder` expects
 * an already-validated command and target. This flow does that validation, so a caller holding only
 * `process.argv.slice(2)` can call it directly. Reach for this flow instead of calling the
 * responder directly whenever the caller starts from raw argv rather than an already-validated
 * command and target.
 *
 * USAGE:
 * SessionForensicsFlow({ argv: ['summary', 'abc-123'] });
 * // Returns the rendered ContentText for the `summary` command. Returns a usage block when argv
 * // names no valid command, or omits the target.
 */
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

import { DigestRunResponder } from '../../responders/digest/run/digest-run-responder';
import { digestCommandContract } from '../../contracts/digest-command/digest-command-contract';

const USAGE_BLOCK = contentTextContract.parse(
  ['usage: session-forensics <command> <target>', ...digestCommandContract.unwrap().options].join(
    '\n',
  ),
);

export const SessionForensicsFlow = ({ argv }: { argv: readonly string[] }): ContentText => {
  const parsedCommand = digestCommandContract.safeParse(argv[0]);
  const [, target] = argv;

  if (!parsedCommand.success || target === undefined) {
    return USAGE_BLOCK;
  }

  return DigestRunResponder({ command: parsedCommand.data, target });
};
