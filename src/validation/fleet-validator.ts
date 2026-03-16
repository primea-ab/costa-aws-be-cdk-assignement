import { FleetBaseDataUpdateEvent } from '../domain/fleet.js';

export function validate(event: FleetBaseDataUpdateEvent): void {
  const { fleetIdentifier } = event.fleetBaseDataUpdateEvent;
  const { type } = event;

  if (typeof fleetIdentifier !== 'string' || fleetIdentifier.trim() === '') {
    throw new Error('Validation failed: fleetIdentifier is required');
  }

  if (typeof type !== 'string' || type.trim() === '') {
    throw new Error('Validation failed: type is required');
  }
}
