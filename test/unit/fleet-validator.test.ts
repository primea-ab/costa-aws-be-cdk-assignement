import { validate } from '../../src/validation/fleet-validator.js';
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

describe('fleet-validator', () => {
  describe('fleetIdentifier', () => {
    it('accepts a valid event', () => {
      expect(() => validate(validEvent)).not.toThrow();
    });

    it('rejects an event with an empty fleetIdentifier', () => {
      const event = { ...validEvent, fleetBaseDataUpdateEvent: { ...validEvent.fleetBaseDataUpdateEvent, fleetIdentifier: '' } };
      expect(() => validate(event)).toThrow('fleetIdentifier is required');
    });

    it('rejects an event with a whitespace-only fleetIdentifier', () => {
      const event = { ...validEvent, fleetBaseDataUpdateEvent: { ...validEvent.fleetBaseDataUpdateEvent, fleetIdentifier: '   ' } };
      expect(() => validate(event)).toThrow('fleetIdentifier is required');
    });

    it('rejects an event with a null fleetIdentifier (possible at runtime from raw JSON)', () => {
      const event = { ...validEvent, fleetBaseDataUpdateEvent: { ...validEvent.fleetBaseDataUpdateEvent, fleetIdentifier: null as any } };
      expect(() => validate(event)).toThrow('fleetIdentifier is required');
    });

    it('rejects an event with a non-string fleetIdentifier (NoSQL injection guard)', () => {
      const event = { ...validEvent, fleetBaseDataUpdateEvent: { ...validEvent.fleetBaseDataUpdateEvent, fleetIdentifier: { $gt: '' } as any } };
      expect(() => validate(event)).toThrow('fleetIdentifier is required');
    });
  });

  describe('type', () => {
    it('rejects an event with an empty type', () => {
      const event = { ...validEvent, type: '' };
      expect(() => validate(event)).toThrow('type is required');
    });

    it('rejects an event with a whitespace-only type', () => {
      const event = { ...validEvent, type: '   ' };
      expect(() => validate(event)).toThrow('type is required');
    });

    it('rejects an event with a null type (possible at runtime from raw JSON)', () => {
      const event = { ...validEvent, type: null as any };
      expect(() => validate(event)).toThrow('type is required');
    });

    it('rejects an event with a non-string type (NoSQL injection guard)', () => {
      const event = { ...validEvent, type: { $gt: '' } as any };
      expect(() => validate(event)).toThrow('type is required');
    });
  });

  describe('nullable fields', () => {
    it('accepts an event where all nullable fields are null', () => {
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
      expect(() => validate(event)).not.toThrow();
    });
  });
});
