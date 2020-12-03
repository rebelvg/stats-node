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

    switch (location) {
      case 'Kharkiv': {
        await streamsCollection.updateMany(
          { userId: null, ip },
          { $set: { userId: new ObjectId(REBEL_ID) } },
        );

        break;
      }
      case 'private range': {
        await streamsCollection.updateMany(
          { userId: null, ip },
          { $set: { userId: new ObjectId(REBEL_ID) } },
        );

        break;
      }
      case 'reserved range': {
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

  await ipsCollection.updateMany(
    {
      $or: [
        {
          'api.message': 'private range',
        },
        {
          'api.message': 'reserved range',
        },
      ],
    },
    {
      $set: {
        isLocked: true,
        'api.as': 'local_network',
        'api.city': 'Kharkiv',
        'api.country': 'Ukraine',
        'api.countryCode': 'UA',
        'api.isp': 'local_network',
        'api.lat': 0,
        'api.lon': 0,
        'api.org': 'local_network',
        'api.region': '63',
        'api.regionName': `Kharkivs'ka Oblast'`,
        'api.status': 'success',
        'api.timezone': 'Europe/Kiev',
        'api.zip': '',
      },
    },
  );

  await mongoClient.close();
})();
