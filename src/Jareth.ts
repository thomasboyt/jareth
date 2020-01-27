import pgp from 'pg-promise';
import { IDatabase } from 'pg-promise';

import { Handle } from './Handle';
import { IClient } from 'pg-promise/typescript/pg-subset';

export class Jareth {
  private db: IDatabase<unknown, IClient>;

  constructor(dbUrl: string) {
    this.db = pgp()(dbUrl);
  }

  withHandle<T>(cb: (handle: Handle) => Promise<T>): Promise<T> {
    return this.db.task((t) => {
      const handle = new Handle(t);
      return cb(handle);
    });
  }

  withTransaction<T>(cb: (handle: Handle) => Promise<T>): Promise<T> {
    return this.db.tx((txn) => {
      const handle = new Handle(txn);
      return cb(handle);
    });
  }

  getPgpDb(): pgp.IDatabase<unknown, IClient> {
    return this.db;
  }
}
