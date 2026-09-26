/**
 * PURPOSE: Tells whether an identifier is an object-literal property KEY — `{stdout: 1}`, where
 * `stdout` names a property, and `{stdout}` shorthand alike. Neither is checked: a real ESLint AST
 * gives the key and the value SEPARATE node objects even for shorthand (never the same reference,
 * confirmed against a real parse — an assumption this file's first version got wrong), and
 * TypeScript's checker resolves BOTH shorthand positions to the object literal's own property
 * declaration (not the outer binding `{stdout}` reads), so a shorthand reference to a banned global
 * is a known gap this rule does not yet catch — closing it needs
 * `checker.getShorthandAssignmentValueSymbol()`, which platform-globals-ban does not call.
 *
 * USAGE:
 * isObjectLiteralKeyLabelLayerBroker({ node });
 * // Returns true for the `stdout` key in `{stdout: 1}` (skip it as a reference)
 */
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const isObjectLiteralKeyLabelLayerBroker = ({ node }: { node: Tsestree }): boolean =>
  node.parent?.type === 'Property' && node.parent.key === node;
