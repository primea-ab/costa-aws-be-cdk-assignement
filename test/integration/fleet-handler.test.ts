import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';
import { MongoClient } from 'mongodb';
import { EventBridgeEvent } from 'aws-lambda';
import { FleetBaseDataUpdateEvent } from '../../src/domain/fleet.js';
import { _resetClientForTesting } from '../../src/repository/fleet-repository.js';

// Testcontainers starts a real MongoDB Docker container — allow enough time.
jest.setTimeout(60000);

function makeEvent(detail: FleetBaseDataUpdateEvent): EventBridgeEvent<'FleetBaseDataUpdate', FleetBaseDataUpdateEvent> {
  return {
    version: '0',
    id: 'test-event-id',
    source: 'fleet.updates',
    account: '000000000000',
    time: '2026-02-26T12:34:56Z',
    region: 'eu-west-1',
    resources: [],
    'detail-type': 'FleetBaseDataUpdate',
    detail: detail,
  };
}

const validDetail: FleetBaseDataUpdateEvent = {
  timeStamp: '2026-02-26T12:34:56Z',
  type: 'FLEET',
  fleetBaseDataUpdateEvent: {
    fleetIdentifier: '12345678910',
    fleetName: 'Super Happy Fleet',
    fleetOwner: 'Super Happy Owner',
    numberOfVehiclesInFleet: 100,
    fleetStatus: 'operational',
  },
};

describe('fleet-handler (integration)', () => {
  let container: StartedMongoDBContainer;
  let mongoClient: MongoClient;

  beforeAll(async () => {
    container = await new MongoDBContainer('mongo:7').start();
    process.env.MONGODB_URI = container.getConnectionString() + '/?directConnection=true';
  });

  afterAll(async () => {
    await _resetClientForTesting();
    await mongoClient?.close();
    await container?.stop();
  });

  beforeEach(async () => {
    // Close and reset the cached connection so each test gets a fresh client pointed at the container.
    await _resetClientForTesting();
    mongoClient = await MongoClient.connect(process.env.MONGODB_URI!);
    await mongoClient.db('fleet').collection('fleets').deleteMany({});
  });

  afterEach(async () => {
    await mongoClient?.close();
  });

  it('persists a valid fleet event to MongoDB', async () => {
    const { handler } = await import('../../src/handlers/fleet-event-handler.js');
    await handler(makeEvent(validDetail));

    const doc = await mongoClient.db('fleet').collection('fleets').findOne({
      '_id.id': '12345678910',
      '_id.type': 'FLEET',
    });

    expect(doc).not.toBeNull();
    expect(doc!.baseData.fleetName).toBe('Super Happy Fleet');
    expect(doc!.baseData.numberOfVehiclesInFleet).toBe(100);
  });

  it('does not persist an event with an empty fleetIdentifier', async () => {
    const { handler } = await import('../../src/handlers/fleet-event-handler.js');
    const invalidDetail = {
      ...validDetail,
      fleetBaseDataUpdateEvent: { ...validDetail.fleetBaseDataUpdateEvent, fleetIdentifier: '' },
    };

    await handler(makeEvent(invalidDetail));

    const count = await mongoClient.db('fleet').collection('fleets').countDocuments();
    expect(count).toBe(0);
  });

  it('does not persist an event with a null type', async () => {
    const { handler } = await import('../../src/handlers/fleet-event-handler.js');
    const invalidDetail = { ...validDetail, type: null as any };

    await handler(makeEvent(invalidDetail));

    const count = await mongoClient.db('fleet').collection('fleets').countDocuments();
    expect(count).toBe(0);
  });

  it('upserts on redelivery — no duplicates', async () => {
    const { handler } = await import('../../src/handlers/fleet-event-handler.js');
    await handler(makeEvent(validDetail));
    await handler(makeEvent(validDetail));

    const count = await mongoClient.db('fleet').collection('fleets').countDocuments();
    expect(count).toBe(1);
  });

  it('overwrites existing data when the same fleet is updated', async () => {
    const { handler } = await import('../../src/handlers/fleet-event-handler.js');

    await handler(makeEvent(validDetail));

    const updatedDetail: FleetBaseDataUpdateEvent = {
      ...validDetail,
      fleetBaseDataUpdateEvent: {
        ...validDetail.fleetBaseDataUpdateEvent,
        fleetName: 'Renamed Fleet',
        numberOfVehiclesInFleet: 250,
        fleetStatus: 'maintenance',
      },
    };
    await handler(makeEvent(updatedDetail));

    const doc = await mongoClient.db('fleet').collection('fleets').findOne({ '_id.id': '12345678910' });
    expect(doc!.baseData.fleetName).toBe('Renamed Fleet');
    expect(doc!.baseData.numberOfVehiclesInFleet).toBe(250);
    expect(doc!.baseData.fleetStatus).toBe('maintenance');
  });

  it('stores two different fleets as separate documents', async () => {
    const { handler } = await import('../../src/handlers/fleet-event-handler.js');

    const secondFleet: FleetBaseDataUpdateEvent = {
      ...validDetail,
      fleetBaseDataUpdateEvent: {
        ...validDetail.fleetBaseDataUpdateEvent,
        fleetIdentifier: '99999999999',
        fleetName: 'Second Fleet',
      },
    };

    await handler(makeEvent(validDetail));
    await handler(makeEvent(secondFleet));

    const count = await mongoClient.db('fleet').collection('fleets').countDocuments();
    expect(count).toBe(2);

    const first = await mongoClient.db('fleet').collection('fleets').findOne({ '_id.id': '12345678910' });
    const second = await mongoClient.db('fleet').collection('fleets').findOne({ '_id.id': '99999999999' });
    expect(first!.baseData.fleetName).toBe('Super Happy Fleet');
    expect(second!.baseData.fleetName).toBe('Second Fleet');
  });

  it('stores null values for nullable fields', async () => {
    const { handler } = await import('../../src/handlers/fleet-event-handler.js');
    const detailWithNulls: FleetBaseDataUpdateEvent = {
      ...validDetail,
      fleetBaseDataUpdateEvent: {
        fleetIdentifier: '12345678910',
        fleetName: null,
        fleetOwner: null,
        numberOfVehiclesInFleet: null,
        fleetStatus: null,
      },
    };

    await handler(makeEvent(detailWithNulls));

    const doc = await mongoClient.db('fleet').collection('fleets').findOne({ '_id.id': '12345678910' });
    expect(doc!.baseData.fleetName).toBeNull();
    expect(doc!.baseData.fleetOwner).toBeNull();
    expect(doc!.baseData.numberOfVehiclesInFleet).toBeNull();
    expect(doc!.baseData.fleetStatus).toBeNull();
  });
});
