import { as as pgpFormatters } from 'pg-promise';

import { Handle } from './Handle';

interface UnknownMap {
  [key: string]: unknown;
}

/**
 * A query is bound to a `Handle` that's used for execution.
 */
export class Query<T> {
  private handle: Handle;
  private queryString: string;
  private rowMapper: (row: UnknownMap) => T;

  constructor(
    handle: Handle,
    queryStr: string,
    queryArguments: UnknownMap,
    rowMapper: (row: UnknownMap) => T
  ) {
    this.handle = handle;
    this.queryString = pgpFormatters.format(queryStr, queryArguments);
    this.rowMapper = rowMapper;
  }

  async one(): Promise<T> {
    const row = await this.handle.getPgpTask().one(this.queryString);
    return this.rowMapper(row);
  }

  async oneOrNone(): Promise<T | null> {
    const row = await this.handle.getPgpTask().oneOrNone(this.queryString);

    if (!row) {
      return null;
    }

    return this.rowMapper(row);
  }

  async many(): Promise<T[]> {
    const rows = await this.handle.getPgpTask().many(this.queryString);
    return rows.map((row) => this.rowMapper(row));
  }

  async manyOrNone(): Promise<T[]> {
    const rows = await this.handle.getPgpTask().manyOrNone(this.queryString);
    return rows.map((row) => this.rowMapper(row));
  }

  async none(): Promise<null> {
    return this.handle.getPgpTask().none(this.queryString);
  }
}
