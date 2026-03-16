import { FleetBaseDataUpdateEvent, FleetDocument } from '../domain/fleet.js';

export function transform(event: FleetBaseDataUpdateEvent): FleetDocument {
  const { type } = event;
  const { fleetIdentifier, fleetName, fleetOwner, numberOfVehiclesInFleet, fleetStatus } =
    event.fleetBaseDataUpdateEvent;

  return {
    _id: {
      id: fleetIdentifier,
      type,
    },
    baseData: {
      fleetName,
      fleetOwner,
      numberOfVehiclesInFleet,
      fleetStatus,
    },
    // Intentionally using insertion time, not event.timeStamp.
    documentLastUpdatedTimeStamp: new Date().toISOString(),
  };
}
