import { Handle } from './Handle';
import { SQLQueryError } from './errors/SQLQueryError';

interface UnknownMap {
  [key: string]: unknown;
}

type RowMapper<T> = (row: UnknownMap) => T;

/**
 * A query is bound to a `Handle` that's used for execution.
 */
export class Query {
  private handle: Handle;
  private queryString: string;

  constructor(handle: Handle, queryString: string) {
    this.handle = handle;
    this.queryString = queryString;
  }

  async one<T>(params: object, rowMapper: RowMapper<T>): Promise<T> {
    const row = await this.handle
      .getPgpTask()
      .one(this.queryString, params)
      .catch((err) => {
        throw new SQLQueryError(err, this.queryString);
      });
    return rowMapper(row);
  }

  async oneOrNone<T>(
    params: object,
    rowMapper: RowMapper<T>
  ): Promise<T | null> {
    const row = await this.handle
      .getPgpTask()
      .oneOrNone(this.queryString, params)
      .catch((err) => {
        throw new SQLQueryError(err, this.queryString);
      });

    if (!row) {
      return null;
    }

    return rowMapper(row);
  }

  async many<T>(params: object, rowMapper: RowMapper<T>): Promise<T[]> {
    const rows = await this.handle
      .getPgpTask()
      .many(this.queryString, params)
      .catch((err) => {
        throw new SQLQueryError(err, this.queryString);
      });

    return rows.map((row) => rowMapper(row));
  }

  async manyOrNone<T>(params: object, rowMapper: RowMapper<T>): Promise<T[]> {
    const rows = await this.handle
      .getPgpTask()
      .manyOrNone(this.queryString, params)
      .catch((err) => {
        throw new SQLQueryError(err, this.queryString);
      });

    return rows.map((row) => rowMapper(row));
  }

  async none(params: object): Promise<void> {
    await this.handle
      .getPgpTask()
      .none(this.queryString, params)
      .catch((err) => {
        throw new SQLQueryError(err, this.queryString);
      });
  }
}
