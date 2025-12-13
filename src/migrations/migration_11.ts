import _ from 'lodash';

import { Db } from 'mongodb';

export async function up(mongoClient: Db): Promise<void> {
  const usersCollection = mongoClient.collection<{
    name: string;
  }>('users');

  const userRecords = await usersCollection.find().toArray();

  for (const userRecord of userRecords) {
    const firstName = userRecord.name.split(' ')[0] ?? 'NO_DISPLAY_NAME';

    await usersCollection.updateOne(
      {
        _id: userRecord._id,
      },
      {
        $set: {
          name: firstName,
        },
        $unset: {
          emails: '',
        },
      },
    );
  }
}
