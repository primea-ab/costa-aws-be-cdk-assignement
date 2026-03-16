import { handler } from '../../src/handlers/fleet-event-handler.js';
import { EventBridgeEvent } from 'aws-lambda';
import { FleetBaseDataUpdateEvent } from '../../src/domain/fleet.js';

// Mock the repository so this test has no external dependencies.
jest.mock('../../src/repository/fleet-repository.js', () => ({
  upsertFleetDocument: jest.fn().mockResolvedValue(undefined),
  _resetClientForTesting: jest.fn(),
}));

const TEST_MONGODB_URI = 'mongodb://secret-user:secret-password@localhost:27017/fleet';

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
    detail,
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

describe('fleet-handler security', () => {
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env.MONGODB_URI = TEST_MONGODB_URI;
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('does not log the MongoDB URI on a successful event', async () => {
    await handler(makeEvent(validDetail));

    const allLogOutput = [
      ...logSpy.mock.calls.flat(),
      ...errorSpy.mock.calls.flat(),
    ].join(' ');

    expect(allLogOutput).not.toContain(TEST_MONGODB_URI);
    expect(allLogOutput).not.toContain('secret-password');
  });

  it('does not log the MongoDB URI when validation fails', async () => {
    const invalidDetail = {
      ...validDetail,
      fleetBaseDataUpdateEvent: { ...validDetail.fleetBaseDataUpdateEvent, fleetIdentifier: '' },
    };

    await handler(makeEvent(invalidDetail));

    const allLogOutput = [
      ...logSpy.mock.calls.flat(),
      ...errorSpy.mock.calls.flat(),
    ].join(' ');

    expect(allLogOutput).not.toContain(TEST_MONGODB_URI);
    expect(allLogOutput).not.toContain('secret-password');
  });
});
