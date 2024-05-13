import * as _ from 'lodash';

import { MongoCollections } from '../src/mongo';
import { IUserModel } from '../src/models/user';

export async function up(): Promise<void> {
  const usersCollection = MongoCollections.getCollection<IUserModel>('users');

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
