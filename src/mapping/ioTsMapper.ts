import * as t from 'io-ts';
import { isLeft } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { mapCamelCase } from './mapCamelCase';

// io-ts types are really complicated, so:
/* eslint-disable @typescript-eslint/no-explicit-any */

// This may not be wide enough
type IoTypeC = t.TypeC<any> | t.IntersectionC<any>;

export class JarethDecodeError extends Error {
  isJarethDecodeError = true;
}

export function decodeOrThrow<T extends IoTypeC>(
  codec: T,
  obj: any
): t.TypeOf<T> {
  const result = t.exact(codec).decode(obj);

  if (isLeft(result)) {
    // TODO: This could provide a much more specific error than just wrapping
    // io-ts default PathReporter
    const report = PathReporter.report(result).join('\n');
    throw new JarethDecodeError(report);
  }

  return result.right;
}

// TODO: probably shouldn't map camel case by default...
export function mapDecode<T extends IoTypeC>(codec: T) {
  return (row: any): t.TypeOf<T> => decodeOrThrow(codec, mapCamelCase(row));
}
