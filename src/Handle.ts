import { ITask } from 'pg-promise';
import { Query } from './Query';

interface UnknownMap {
  [key: string]: unknown;
}

/**
 * A `Handle` is an open connection from the pg-promise connection pool. It is
 * equivalent to a "Task" in pg-promise.
 *
 * Eventually I want to expand this to also work for transactions -
 * `Handle.withTransaction()` would spawn a new `Handle` using a pg-promise
 * transaction (which has the same interface as a Task).
 */
export class Handle {
  private task: ITask<unknown>;

  constructor(task: ITask<unknown>) {
    this.task = task;
  }

  createQuery<T>(
    queryStr: string,
    queryArguments: object,
    mapper: (row: UnknownMap) => T
  ): Query<T> {
    return new Query(this, queryStr, queryArguments, mapper);
  }

  getPgpTask(): ITask<unknown> {
    return this.task;
  }

  withTransaction(): void {
    throw new Error('not implemented yet!');
  }
}
