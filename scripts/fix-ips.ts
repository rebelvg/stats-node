import { connectMongoDriver, MongoCollections } from '../mongo';

(async () => {
  const mongoClient = await connectMongoDriver();

  const ipsCollection = MongoCollections.getCollection('ips');

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
        'api.city': 'Local Network',
        'api.country': 'Ukraine',
        'api.countryCode': 'UA',
        'api.isp': 'local_network',
        'api.lat': 0,
        'api.lon': 0,
        'api.org': 'local_network',
        'api.region': '63',
        'api.regionName': 'Local Network',
        'api.status': 'success',
        'api.timezone': 'Europe/Kiev',
        'api.zip': '',
      },
    },
  );

  await mongoClient.close();
})();
