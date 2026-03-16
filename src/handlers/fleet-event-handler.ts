import { EventBridgeEvent } from 'aws-lambda';
import { FleetBaseDataUpdateEvent } from '../domain/fleet.js';
import { validate } from '../validation/fleet-validator.js';
import { transform } from '../transformation/fleet-transformer.js';
import { upsertFleetDocument } from '../repository/fleet-repository.js';

export async function handler(
  event: EventBridgeEvent<'FleetBaseDataUpdate', FleetBaseDataUpdateEvent>
): Promise<void> {
  const payload = event.detail;

  try {
    validate(payload);
  } catch (err) {
    console.error('Validation error — event dropped:', err);
    return;
  }

  const document = transform(payload);
  await upsertFleetDocument(document);

  console.log('Fleet document upserted:', JSON.stringify(document._id));
}
