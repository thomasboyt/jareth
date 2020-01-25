import * as t from 'io-ts';
import * as path from 'path';
import * as fs from 'fs';
import * as pg from 'pg';

import Jareth, { mapDecode } from '../src';

const dbUrl = 'postgres://postgres:@localhost:5434/jareth_test';

async function resetDb(): Promise<void> {
  const sql = fs.readFileSync(path.join(__dirname, './fixture/db.sql'), {
    encoding: 'utf8',
  });
  const client = new pg.Client(dbUrl);
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

beforeEach(async () => {
  await resetDb();
});

interface Params {
  name: string;
}

describe('Jareth', () => {
  let jareth: Jareth;

  beforeEach(() => {
    jareth = new Jareth(dbUrl);
  });

  afterEach(async () => {
    await jareth.getPgpDb().$pool.end();
  });

  it('can run a select query', async () => {
    const result = await jareth.withHandle(async (handle) => {
      const query = handle.createQuery(
        'SELECT id, name FROM users',
        {},
        (row) => row
      );
      const rows = await query.many();
      return rows;
    });

    expect(result).toStrictEqual([
      { id: 1, name: 'jeff' },
      { id: 2, name: 'vinny' },
      { id: 3, name: 'brad' },
    ]);
  });

  it('uses query parameters', async () => {
    const params: Params = { name: 'jeff' };

    const result = await jareth.withHandle(async (handle) => {
      const query = handle.createQuery(
        'SELECT id, name FROM users WHERE name=${name}',
        params,
        (row) => row
      );
      const row = await query.one();
      return row;
    });

    expect(result).toStrictEqual({ id: 1, name: 'jeff' });
  });

  it('throws for missing query parameters', async () => {
    const promise = jareth.withHandle(async (handle) => {
      const query = handle.createQuery(
        'SELECT id, name FROM users WHERE name=${name}',
        {},
        (row) => row
      );
      await query.one();
    });
    await expect(promise).rejects.toHaveProperty(
      'originalMessage',
      "Property 'name' doesn't exist."
    );
  });

  it('maps rows using passed mapper', async () => {
    const result = await jareth.withHandle(async (handle) => {
      const query = handle.createQuery(
        'SELECT id, name FROM users WHERE name=${name}',
        { name: 'jeff' },
        (row) => row.name
      );
      const row = await query.one();
      return row;
    });

    expect(result).toBe('jeff');
  });

  it('returns validated io-ts codecs', async () => {
    const UserCodec = t.type({
      id: t.number,
      name: t.string,
    });

    // XXX: make sure result has the right static type in typescript here
    const result = await jareth.withHandle(async (handle) => {
      const query = handle.createQuery(
        'SELECT id, name FROM users WHERE name=${name}',
        { name: 'jeff' },
        mapDecode(UserCodec)
      );
      const row = await query.one();
      return row;
    });

    expect(result).toStrictEqual({ id: 1, name: 'jeff' });
  });

  it('throws for invalid io-ts codecs', async () => {
    const InvalidUserCodec = t.type({
      id: t.number,
      whoops: t.string,
    });

    const promise = jareth.withHandle(async (handle) => {
      const query = handle.createQuery(
        'SELECT id, name FROM users WHERE name=${name}',
        { name: 'jeff' },
        mapDecode(InvalidUserCodec)
      );
      const row = await query.one();
      return row;
    });

    await expect(promise).rejects.toHaveProperty(
      'message',
      'Invalid value undefined supplied to : {| id: number, whoops: string |}/whoops: string'
    );
  });

  it('camelCases column names', async () => {
    const UserCodec = t.type({
      id: t.number,
      name: t.string,
      maniaplanetName: t.string,
    });

    const result = await jareth.withHandle(async (handle) => {
      const query = handle.createQuery(
        "SELECT id, name, maniaplanet_name FROM users WHERE name='jeff'",
        {},
        mapDecode(UserCodec)
      );
      return query.one();
    });

    expect(result).toStrictEqual({
      id: 1,
      name: 'jeff',
      maniaplanetName: 'MonsterDunk',
    });
  });
});
