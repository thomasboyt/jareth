import { ITask } from 'pg-promise';
import { Query } from './Query';

/**
 * A `Handle` is an open connection from the pg-promise connection pool. It is
 * equivalent to a "Task" in pg-promise.
 *
 * `Handle.withTransaction()` spawns a new `Handle` using a pg-promise
 * transaction (which has the same interface as a Task).
 */
export class Handle {
  private task: ITask<unknown>;

  constructor(task: ITask<unknown>) {
    this.task = task;
  }

  createQuery(queryStr: string): Query {
    return new Query(this, queryStr);
  }

  getPgpTask(): ITask<unknown> {
    return this.task;
  }

  withTransaction<T>(cb: (handle: Handle) => Promise<T>): Promise<T> {
    return this.task.tx((txn) => {
      const handle = new Handle(txn);
      return cb(handle);
    });
  }
}
