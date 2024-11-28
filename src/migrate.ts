import * as fs from 'fs';
import * as mongoose from 'mongoose';
import * as path from 'path';

import { connectMongoDriver, connectMongoose, MongoCollections } from './mongo';

async function migrate() {
  console.log('running_migrations');

  const mongoClient = await connectMongoDriver();

  await connectMongoose();

  const { Migrations } = MongoCollections;

  const files = fs
    .readdirSync('./src/migrations')
    .sort((firstElement, secondElement) => {
      const [, firstId] = firstElement.split('_');
      const [, secondId] = secondElement.split('_');

      return parseInt(firstId) - parseInt(secondId);
    });

  const migrationNames: string[] = await Migrations.distinct('name', {});

  for (const fileName of files) {
    if (migrationNames.includes(fileName)) {
      console.log('skipping_migration', fileName);

      continue;
    }

    console.log('running_migration', fileName);

    const { up } = await import(path.resolve(`./src/migrations/${fileName}`));

    await up(mongoClient.db());

    await Migrations.insertOne({
      name: fileName,
      timeCreated: new Date(),
    });

    console.log('migration_done', fileName);
  }

  await mongoClient.close();

  await mongoose.disconnect();

  console.log('migrations_done');
}

process.on('unhandledRejection', (reason, p) => {
  throw reason;
});

(async () => {
  await migrate();
})();
