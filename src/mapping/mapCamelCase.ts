import camelcaseKeys from 'camelcase-keys';

interface UnknownMap {
  [key: string]: unknown;
}

export function mapCamelCase(row: UnknownMap): UnknownMap {
  return camelcaseKeys(row, { deep: false });
}
