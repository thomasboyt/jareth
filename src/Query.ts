import { Handle } from './Handle';

interface UnknownMap {
  [key: string]: unknown;
}

class QueryError extends Error {
  originalMessage: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(pgErr: Error, query: string) {
    const message = `Error executing query: ${pgErr.message}`;
    super(message);
    this.originalMessage = pgErr.message;
    // TODO: maybe some day have some additional debug info...
    // TODO: log query?
  }
}
/**
 * A query is bound to a `Handle` that's used for execution.
 */
export class Query<T> {
  private handle: Handle;
  private queryString: string;
  private queryArguments: object;
  private rowMapper: (row: UnknownMap) => T;

  constructor(
    handle: Handle,
    queryString: string,
    queryArguments: object,
    rowMapper: (row: UnknownMap) => T
  ) {
    this.handle = handle;
    this.queryString = queryString;
    this.queryArguments = queryArguments;
    this.rowMapper = rowMapper;
  }

  async one(): Promise<T> {
    const row = await this.handle
      .getPgpTask()
      .one(this.queryString, this.queryArguments)
      .catch((err) => {
        throw new QueryError(err, this.queryString);
      });
    return this.rowMapper(row);
  }

  async oneOrNone(): Promise<T | null> {
    const row = await this.handle
      .getPgpTask()
      .oneOrNone(this.queryString, this.queryArguments)
      .catch((err) => {
        throw new QueryError(err, this.queryString);
      });

    if (!row) {
      return null;
    }

    return this.rowMapper(row);
  }

  async many(): Promise<T[]> {
    const rows = await this.handle
      .getPgpTask()
      .many(this.queryString, this.queryArguments)
      .catch((err) => {
        throw new QueryError(err, this.queryString);
      });

    return rows.map((row) => this.rowMapper(row));
  }

  async manyOrNone(): Promise<T[]> {
    const rows = await this.handle
      .getPgpTask()
      .manyOrNone(this.queryString, this.queryArguments)
      .catch((err) => {
        throw new QueryError(err, this.queryString);
      });

    return rows.map((row) => this.rowMapper(row));
  }

  async none(): Promise<void> {
    await this.handle
      .getPgpTask()
      .none(this.queryString, this.queryArguments)
      .catch((err) => {
        throw new QueryError(err, this.queryString);
      });
  }
}
