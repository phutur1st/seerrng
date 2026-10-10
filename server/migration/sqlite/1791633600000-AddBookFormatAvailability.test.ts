import { AddBookFormatAvailability1791633600000 as PostgresMigration } from '@server/migration/postgres/1791633600000-AddBookFormatAvailability';
import assert from 'node:assert/strict';
import test from 'node:test';
import { DataSource } from 'typeorm';
import { AddBookFormatAvailability1791633600000 as SqliteMigration } from './1791633600000-AddBookFormatAvailability';

for (const [name, Migration] of [
  ['sqlite', SqliteMigration],
  ['postgres portable SQL', PostgresMigration],
] as const) {
  test(`${name} migration preserves existing media without inventing format availability`, async () => {
    const db = new DataSource({ type: 'better-sqlite3', database: ':memory:' });
    await db.initialize();
    const runner = db.createQueryRunner();
    try {
      await runner.query(
        'CREATE TABLE media (id integer PRIMARY KEY, status integer, externalServiceId integer, audiobookExternalServiceId integer)'
      );
      await runner.query('INSERT INTO media VALUES (1, 5, 303, 303)');
      const migration = new Migration();
      await migration.up(runner);
      assert.deepEqual(await runner.query('SELECT * FROM media'), [
        {
          id: 1,
          status: 5,
          externalServiceId: 303,
          audiobookExternalServiceId: 303,
          ebookAvailable: null,
          audiobookAvailable: null,
        },
      ]);
      await migration.down(runner);
      assert.deepEqual(await runner.query('SELECT * FROM media'), [
        {
          id: 1,
          status: 5,
          externalServiceId: 303,
          audiobookExternalServiceId: 303,
        },
      ]);
    } finally {
      await runner.release();
      await db.destroy();
    }
  });
}
