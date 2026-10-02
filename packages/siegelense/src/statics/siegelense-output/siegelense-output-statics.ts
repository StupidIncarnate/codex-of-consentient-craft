/**
 * PURPOSE: The output knobs every `dungeonmaster siegelense <call>` responder shares — the JSON
 * indentation the CLI writes to stdout, the process exit codes, and the flag tokens the argv parsers
 * and the `--help` renderer both read, so `--json`/`--help`/`-h` are spelled once rather than hard-coded
 * again in each of the seven responders and their parsers.
 *
 * USAGE:
 * siegelenseOutputStatics.json.indentSpaces;
 * // Returns 2
 *
 * siegelenseOutputStatics.flags.json;
 * // Returns '--json'
 *
 * siegelenseOutputStatics.exitCodes.runFailed;
 * // Returns 2
 */

export const siegelenseOutputStatics = {
  json: {
    indentSpaces: 2,
  },
  flags: {
    json: '--json',
    help: '--help',
    helpShort: '-h',
  },
  exitCodes: {
    success: 0,
    refusal: 1,
    runFailed: 2,
  },
} as const;
