export const isInReadonlyArray = ({
  value,
  array,
}: {
  value: unknown;
  array: readonly string[];
}): boolean => typeof value === 'string' && array.includes(value);
