/**
 * PURPOSE: Names the ROLES measured over verification units, in RELAY ORDER — the order the roles
 * run in. `verificationTrackContract` builds its enum from this list; reach for this file
 * anywhere else a value needs to enumerate that same role set, rather than repeating the names
 * inline.
 *
 * USAGE:
 * verificationTracksStatics.roles;
 * // Returns ['codeweaver', 'flowrider', 'siegemaster'], in relay order
 *
 * A STATICS, NOT A LITERAL. `enforce-contract-usage-in-tests` lets a test import a statics file but
 * never a contract, so this is the only source a test can read the tuple from without hardcoding
 * it — and a hardcoded copy silently skips a role a later change adds.
 */

export const verificationTracksStatics = {
  roles: ['codeweaver', 'flowrider', 'siegemaster'],
} as const;
