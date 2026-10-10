import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookFormatAvailability1791633600000 implements MigrationInterface {
  name = 'AddBookFormatAvailability1791633600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Existing service IDs do not prove a file exists. Scans populate these.
    await queryRunner.query(
      `ALTER TABLE "media" ADD COLUMN "ebookAvailable" boolean`
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD COLUMN "audiobookAvailable" boolean`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media" DROP COLUMN "audiobookAvailable"`
    );
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "ebookAvailable"`);
  }
}
