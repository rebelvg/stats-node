import * as fs from 'fs';
import * as mongoose from 'mongoose';

import {
  connectMongoDriver,
  connectMongoose,
  MongoCollections,
} from './src/mongo';

async function migrate() {
  console.log('running_migrations');

  const mongoClient = await connectMongoDriver();

  await connectMongoose();

  const { Migrations } = MongoCollections;

  const files = fs.readdirSync('./migrations');

  const migrationNames: string[] = await Migrations.distinct('name', {});

  for (const fileName of files) {
    if (migrationNames.includes(fileName)) {
      console.log('skipping_migration', fileName);

      continue;
    }

    console.log('running_migration', fileName);

    const { up } = await import(`./migrations/${fileName}`);

    await up();

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
