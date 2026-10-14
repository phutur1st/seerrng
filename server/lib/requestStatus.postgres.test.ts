import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { DataSource, getMetadataArgsStorage } from 'typeorm';

type EntityConstructor = new (...args: never[]) => unknown;

const postgresUrl = process.env.SEERR_TEST_POSTGRES_URL;
const postgresTest = postgresUrl ? test : test.skip;

postgresTest(
  'PostgreSQL request-status counts resolve the latest status event aliases',
  async () => {
    const originalDbType = process.env.DB_TYPE;
    process.env.DB_TYPE = 'postgres';

    let dataSource: DataSource | undefined;
    let queryRunner: ReturnType<DataSource['createQueryRunner']> | undefined;

    try {
      const { getRequestStatusCounts } =
        await import('@server/lib/requestStatus');
      const entityDirectory = join(process.cwd(), 'server/entity');
      const entityFiles = (await readdir(entityDirectory)).filter(
        (file) => file.endsWith('.ts') && !file.endsWith('.test.ts')
      );
      for (const file of entityFiles) {
        await import(join(entityDirectory, file));
      }

      const entityTargets = Array.from(
        new Set(
          getMetadataArgsStorage()
            .tables.map(({ target }) => target)
            .filter(
              (target): target is EntityConstructor =>
                typeof target === 'function'
            )
        )
      );
      dataSource = await new DataSource({
        type: 'postgres',
        url: postgresUrl,
        entities: entityTargets,
        synchronize: false,
      }).initialize();
      queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      await queryRunner.query(
        `CREATE TEMPORARY TABLE media_request (
          id integer PRIMARY KEY,
          status integer NOT NULL,
          type varchar NOT NULL,
          is4k boolean NOT NULL,
          "mediaId" integer NOT NULL,
          "requestedById" integer NOT NULL
        )`
      );
      await queryRunner.query(
        `CREATE TEMPORARY TABLE media (
          id integer PRIMARY KEY,
          status integer NOT NULL,
          "status4k" integer NOT NULL
        )`
      );
      await queryRunner.query(
        'CREATE TEMPORARY TABLE "user" (id integer PRIMARY KEY)'
      );
      await queryRunner.query(
        `CREATE TEMPORARY TABLE media_request_status_event (
          id integer PRIMARY KEY,
          "requestId" integer NOT NULL,
          stage varchar NOT NULL
        )`
      );
      await queryRunner.query(
        `INSERT INTO media (id, status, "status4k") VALUES (30, 3, 1)`
      );
      await queryRunner.query('INSERT INTO "user" (id) VALUES (20)');
      await queryRunner.query(
        `INSERT INTO media_request (
          id, status, type, is4k, "mediaId", "requestedById"
        ) VALUES (10, 2, 'movie', false, 30, 20)`
      );
      await queryRunner.query(
        `INSERT INTO media_request_status_event (id, "requestId", stage)
         VALUES (40, 10, 'downloading')`
      );

      const counts = await getRequestStatusCounts({}, queryRunner.manager);

      assert.equal(counts.total, 1);
      assert.equal(counts.active, 1);
      assert.equal(counts.completed, 0);
    } finally {
      if (queryRunner?.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      if (queryRunner?.isReleased === false) {
        await queryRunner.release();
      }
      if (dataSource?.isInitialized) {
        await dataSource.destroy();
      }
      if (originalDbType === undefined) {
        delete process.env.DB_TYPE;
      } else {
        process.env.DB_TYPE = originalDbType;
      }
    }
  }
);
