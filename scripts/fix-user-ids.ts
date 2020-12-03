import { ObjectId } from 'mongodb';

import { connectMongoDriver, MongoCollections } from '../mongo';

const REBEL_ID = '5a3a62c866fa07792cfcee67';
const PYRO_ID = '5a3fb3f666fa07792cfceec2';
const CREATURE_ID = '5b3a731ac284a806572fede5';
const SLOW_ID = '5a3d93f066fa07792cfcee9c';
const BOBER_ID = '5a7430e79b6aa006b6546f81';

(async () => {
  const mongoClient = await connectMongoDriver();

  const streamsCollection = MongoCollections.getCollection('streams');
  const ipsCollection = MongoCollections.getCollection('ips');

  const ipsNoUserId = await streamsCollection.distinct('ip', { userId: null });

  console.log(ipsNoUserId.length);

  for (const ip of ipsNoUserId) {
    const ipRecord = await ipsCollection.findOne({ ip });

    const location = ipRecord.api.city || ipRecord.api.message;

    console.log(location);

    switch (location) {
      case 'Kharkiv' || 'private range' || 'reserved range': {
        await streamsCollection.updateMany(
          { userId: null, ip },
          { $set: { userId: new ObjectId(REBEL_ID) } },
        );

        break;
      }
      case 'Odesa': {
        await streamsCollection.updateMany(
          { userId: null, ip },
          { $set: { userId: new ObjectId(PYRO_ID) } },
        );

        break;
      }
      case 'Gomel': {
        await streamsCollection.updateMany(
          { userId: null, ip },
          { $set: { userId: new ObjectId(CREATURE_ID) } },
        );

        break;
      }
      case 'Moscow': {
        await streamsCollection.updateMany(
          { userId: null, ip },
          { $set: { userId: new ObjectId(SLOW_ID) } },
        );

        break;
      }
      case 'Balashikha': {
        await streamsCollection.updateMany(
          { userId: null, ip },
          { $set: { userId: new ObjectId(BOBER_ID) } },
        );

        break;
      }
      default: {
        break;
      }
    }
  }

  await mongoClient.close();
})();
