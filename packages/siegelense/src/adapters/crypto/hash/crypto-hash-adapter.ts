/**
 * PURPOSE: Wraps node's `crypto` module for a caller that already holds the exact string it wants
 * digested — `lane-spec-hash-broker` is that caller, and this is where its `createHash` call
 * legally lives: a transformer's allowed imports are `contracts`/`statics`/`errors`/`guards`/
 * `transformers`, never a node builtin, so the module import has to sit in an adapter. Reach for
 * this over hand-rolling `createHash` at a call site whenever the input is already a flat string;
 * it does no canonicalization of its own; that is `lane-spec-canonical-json-transformer`'s job, done
 * BEFORE the string reaches here.
 *
 * USAGE:
 * cryptoHashAdapter({ content: ContentTextStub({ value: '{"a":1}' }) });
 * // Returns the sha256 hex digest of that exact string, as a ContentText
 */

import { createHash } from 'crypto';

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

const HASH_ALGORITHM = 'sha256';

export const cryptoHashAdapter = ({ content }: { content: ContentText }): ContentText =>
  contentTextContract.parse(createHash(HASH_ALGORITHM).update(String(content)).digest('hex'));
