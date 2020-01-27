export class SQLQueryError extends Error {
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
