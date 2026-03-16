import { MongoClient } from 'mongodb';
import { FleetDocument } from '../domain/fleet.js';

// Caching the Promise prevents a race condition where
// a second call could receive an not-yet-connected client before the first
// call's connect() resolves.
let clientPromise: Promise<MongoClient> | null = null;

export async function _resetClientForTesting(): Promise<void> {
  if (clientPromise) {
    const client = await clientPromise;
    await client.close();
    clientPromise = null;
  }
}

function getClient(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = new MongoClient(process.env.MONGODB_URI!).connect();
  }
  return clientPromise;
}

export async function upsertFleetDocument(document: FleetDocument): Promise<void> {
  const mongo = await getClient();
  const collection = mongo.db('fleet').collection('fleets');

  await collection.replaceOne(
    { _id: document._id as any },
    document,
    { upsert: true }
  );
}
