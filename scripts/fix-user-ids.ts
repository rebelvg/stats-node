import { ObjectId } from 'mongodb';

import { connectMongoDriver, MongoCollections } from '../src/mongo';
import { IStreamModel } from '../src/models/stream';
import { IIPModel } from '../src/models/ip';

const REBEL_ID = '5a3a62c866fa07792cfcee67';
// const PYRO_ID = '5a3fb3f666fa07792cfceec2';
// const CREATURE_ID = '5b3a731ac284a806572fede5';
// const SLOW_ID = '5a3d93f066fa07792cfcee9c';
// const BOBER_ID = '5a7430e79b6aa006b6546f81';
// const OCTOCAT_ID = '5a6f7bc948f63728881611e0';

(async () => {
  const mongoClient = await connectMongoDriver();

  const streamsCollection = MongoCollections.getCollection<IStreamModel>(
    'streams',
  );
  const ipsCollection = MongoCollections.getCollection<IIPModel>('ips');

  const ipsNoUserId = await streamsCollection.distinct('ip', { userId: null });

  console.log(ipsNoUserId.length);

  for (const ip of ipsNoUserId) {
    const ipRecord = await ipsCollection.findOne({ ip });

    const location = ipRecord.api.city || ipRecord.api.message;
    // const isp = ipRecord.api.isp;

    switch (location) {
      case 'Kharkiv': {
        await streamsCollection.updateMany(
          { userId: null, ip },
          { $set: { userId: new ObjectId(REBEL_ID) } },
        );

        console.log(ip);

        break;
      }
      case 'private range': {
        await streamsCollection.updateMany(
          { userId: null, ip },
          { $set: { userId: new ObjectId(REBEL_ID) } },
        );

        console.log(ip);

        break;
      }
      case 'reserved range': {
        await streamsCollection.updateMany(
          { userId: null, ip },
          { $set: { userId: new ObjectId(REBEL_ID) } },
        );

        console.log(ip);

        break;
      }
      // case 'Odesa': {
      //   await streamsCollection.updateMany(
      //     { userId: null, ip },
      //     { $set: { userId: new ObjectId(PYRO_ID) } },
      //   );

      //   break;
      // }
      // case 'Gomel': {
      //   await streamsCollection.updateMany(
      //     { userId: null, ip },
      //     { $set: { userId: new ObjectId(CREATURE_ID) } },
      //   );

      //   break;
      // }
      // case 'Moscow': {
      //   if (isp.toLowerCase().includes('mediaseti')) {
      //     await streamsCollection.updateMany(
      //       { userId: null, ip },
      //       { $set: { userId: new ObjectId(SLOW_ID) } },
      //     );
      //   }

      //   if (isp.toLowerCase().includes('telegraph')) {
      //     await streamsCollection.updateMany(
      //       { userId: null, ip },
      //       { $set: { userId: new ObjectId(BOBER_ID) } },
      //     );
      //   }

      //   if (isp.toLowerCase().includes('2com')) {
      //     await streamsCollection.updateMany(
      //       { userId: null, ip },
      //       { $set: { userId: new ObjectId(OCTOCAT_ID) } },
      //     );
      //   }

      //   if (ip.includes('109.229')) {
      //     await streamsCollection.updateMany(
      //       { userId: null, ip },
      //       { $set: { userId: new ObjectId(SLOW_ID) } },
      //     );
      //   }

      //   break;
      // }
      // case 'Shcherbinka': {
      //   await streamsCollection.updateMany(
      //     { userId: null, ip },
      //     { $set: { userId: new ObjectId(SLOW_ID) } },
      //   );

      //   break;
      // }
      // case 'Balashikha': {
      //   await streamsCollection.updateMany(
      //     { userId: null, ip },
      //     { $set: { userId: new ObjectId(BOBER_ID) } },
      //   );

      //   break;
      // }
      default: {
        break;
      }
    }
  }

  await mongoClient.close();
})();
