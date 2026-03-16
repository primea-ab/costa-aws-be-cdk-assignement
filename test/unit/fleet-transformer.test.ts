import { transform } from '../../src/transformation/fleet-transformer.js';
import { FleetBaseDataUpdateEvent } from '../../src/domain/fleet.js';

const validEvent: FleetBaseDataUpdateEvent = {
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

describe('fleet-transformer', () => {
  it('maps fleetIdentifier to _id.id', () => {
    const doc = transform(validEvent);
    expect(doc._id.id).toBe('12345678910');
  });

  it('maps type to _id.type', () => {
    const doc = transform(validEvent);
    expect(doc._id.type).toBe('FLEET');
  });

  it('maps all baseData fields correctly', () => {
    const doc = transform(validEvent);
    expect(doc.baseData).toEqual({
      fleetName: 'Super Happy Fleet',
      fleetOwner: 'Super Happy Owner',
      numberOfVehiclesInFleet: 100,
      fleetStatus: 'operational',
    });
  });

  it('sets documentLastUpdatedTimeStamp to the current time, not the event timestamp', () => {
    const before = new Date().toISOString();
    const doc = transform(validEvent);
    const after = new Date().toISOString();

    expect(doc.documentLastUpdatedTimeStamp >= before).toBe(true);
    expect(doc.documentLastUpdatedTimeStamp <= after).toBe(true);
    expect(doc.documentLastUpdatedTimeStamp).not.toBe(validEvent.timeStamp);
  });

  it('preserves null values for nullable fields', () => {
    const event: FleetBaseDataUpdateEvent = {
      ...validEvent,
      fleetBaseDataUpdateEvent: {
        fleetIdentifier: '12345678910',
        fleetName: null,
        fleetOwner: null,
        numberOfVehiclesInFleet: null,
        fleetStatus: null,
      },
    };
    const doc = transform(event);
    expect(doc.baseData.fleetName).toBeNull();
    expect(doc.baseData.fleetOwner).toBeNull();
    expect(doc.baseData.numberOfVehiclesInFleet).toBeNull();
    expect(doc.baseData.fleetStatus).toBeNull();
  });
});
