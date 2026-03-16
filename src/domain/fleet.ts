/** The incoming EventBridge event payload for a fleet base data update. */
export interface FleetBaseDataUpdateEvent {
  timeStamp: string;
  type: string;
  fleetBaseDataUpdateEvent: {
    fleetIdentifier: string;
    fleetName: string | null;
    fleetOwner: string | null;
    numberOfVehiclesInFleet: number | null;
    fleetStatus: string | null;
  };
}

/**
 * The domain entity persisted to MongoDB.
 * The compound _id {id, type} uniquely identifies a fleet across event types.
 */
export interface FleetDocument {
  _id: {
    id: string;
    type: string;
  };
  baseData: {
    fleetName: string | null;
    fleetOwner: string | null;
    numberOfVehiclesInFleet: number | null;
    fleetStatus: string | null;
  };
  documentLastUpdatedTimeStamp: string;
}
