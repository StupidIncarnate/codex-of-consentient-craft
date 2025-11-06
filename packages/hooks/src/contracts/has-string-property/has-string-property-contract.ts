/**
 * PURPOSE: Type guard checking if object has a specific property with string value
 *
 * USAGE:
 * if (hasStringPropertyContract({ obj: data, property: 'name' })) { const name = data.name; }
 * // Returns true if obj has the property as a string
 */
export const hasStringPropertyContract = ({
  obj,
  property,
}: {
  obj: unknown;
  property: PropertyKey;
}): boolean => {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  return property in obj && typeof Reflect.get(obj, property) === 'string';
};
