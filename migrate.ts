import * as fs from 'fs';

import { connectMongoDriver, MongoCollections } from './mongo';

async function migrate() {
  const mongoClient = await connectMongoDriver();

  const { Migrations } = MongoCollections;

  const files = fs.readdirSync('./migrations');

  const migrationNames: string[] = await Migrations.distinct('name', {});

  for (const fileName of files) {
    if (migrationNames.includes(fileName)) {
      continue;
    }

    const { up } = await import(`./migrations/${fileName}`);

    await up();

    await Migrations.insertOne({
      name: fileName,
      timeCreated: new Date(),
    });

    console.log(`${fileName} migration done.`);
  }

  await mongoClient.close();
}

process.on('unhandledRejection', (reason, p) => {
  throw reason;
});

(async () => {
  await migrate();
})();
