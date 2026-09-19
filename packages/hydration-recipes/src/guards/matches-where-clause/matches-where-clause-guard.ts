/**
 * PURPOSE: Answers whether a record matches every key `filter({ where })` named, so a `query`
 * route can enumerate every row when `where` carries no keys and narrow to the matching ones
 * when it does. Reach for this over a route hand-rolling its own comparison — every `query`
 * route in this package (guild, operation) narrows the same way, over records of different
 * shapes.
 *
 * USAGE:
 * matchesWhereClauseGuard({ record: { role: 'ward', status: 'pending' }, where: { role: 'ward' } });
 * // Returns true
 */
export const matchesWhereClauseGuard = ({
  record,
  where,
}: {
  record?: Record<string, unknown>;
  where?: Record<string, unknown>;
}): boolean => {
  if (!record) {
    return false;
  }

  return Object.entries(where ?? {}).every(([key, value]) => record[key] === value);
};
