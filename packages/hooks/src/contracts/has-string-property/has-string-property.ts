/**
 * Type predicate that checks if an object has a specific property with a string value.
 *
 * @param params - The parameters object
 * @param params.obj - The object to check
 * @param params.property - The property name to check for
 * @returns True if the object has the property and its value is a string
 */
export const hasStringProperty = (params: {
  obj: unknown;
  property: string;
}): params is { obj: Record<string, string>; property: string } => {
  const { obj, property } = params;
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  return property in obj && typeof Reflect.get(obj, property) === 'string';
};
