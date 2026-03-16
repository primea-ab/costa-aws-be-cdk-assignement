# Costa Fleet Processor

An event-driven AWS CDK application that receives Fleet Base Data Update events via Amazon EventBridge, validates and transforms them, and persists the result to MongoDB.

## Architecture

```
EventBridge (fleet-event-bus)
    └── Rule: source=fleet.updates, detail-type=FleetBaseDataUpdate
            └── Lambda (fleet-event-handler)
                    ├── Validate  (fleetIdentifier + type required)
                    ├── Transform (map to domain entity)
                    └── MongoDB   (upsert by compound _id)

Dead Letter Queue (SQS) ← catches events that fail after 2 retries
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Docker](https://www.docker.com/) with Docker Compose
- AWS CLI: used to send test events

## Running locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

The default `.env` values work out of the box for local development — no changes needed.

### 3. Start LocalStack and MongoDB

```bash
docker-compose up -d
```

Wait a few seconds, then verify LocalStack is ready:

```bash
curl http://localhost:4566/_localstack/health
```

### 4. Bootstrap CDK (first time only)

```bash
npm run bootstrap:local
```

Creates the CDK infrastructure prerequisites in LocalStack. Only needed once.

### 5. Deploy

```bash
npm run deploy:local -- --require-approval never
```

Runs `build → unit tests → synth → deploy` in sequence. Aborts if any step fails.

### 6. Send a test event

```bash
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION=us-east-1 \
aws --endpoint-url=http://localhost:4566 events put-events \
--entries '[{
  "Source": "fleet.updates",
  "DetailType": "FleetBaseDataUpdate",
  "EventBusName": "fleet-event-bus",
  "Detail": "{\"timeStamp\":\"2026-02-26T12:34:56Z\",\"type\":\"FLEET\",\"fleetBaseDataUpdateEvent\":{\"fleetIdentifier\":\"12345678910\",\"fleetName\":\"Super Happy Fleet\",\"fleetOwner\":\"Super Happy Owner\",\"numberOfVehiclesInFleet\":100,\"fleetStatus\":\"operational\"}}"
}]'
```

### 7. Verify the result in MongoDB

```bash
docker compose exec mongodb \
  mongosh fleet --eval "JSON.stringify(db.fleets.find().toArray(), null, 2)"
```

Expected output:

```json
[
  {
    "_id": { "id": "12345678910", "type": "FLEET" },
    "baseData": {
      "fleetName": "Super Happy Fleet",
      "fleetOwner": "Super Happy Owner",
      "numberOfVehiclesInFleet": 100,
      "fleetStatus": "operational"
    },
    "documentLastUpdatedTimeStamp": "..."
  }
]
```

## Running tests

Docker must be running for integration tests (Testcontainers starts its own MongoDB automatically).

```bash
# Unit tests — no external dependencies, runs in milliseconds
npm run test:unit

# CDK snapshot tests — verifies infrastructure hasn't changed unexpectedly
npm run test:snapshot

# Integration tests — requires Docker, spins up a real MongoDB via Testcontainers
npm run test:integration

# All tests (unit + snapshot + integration)
npm test
```

After completing steps 1–7 above, run `npm test` to execute the full test suite and verify everything works end to end.

## Deploying to real AWS

1. Set real values in `.env`:
   ```
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/fleet
   AWS_ACCOUNT=<your-account-id>
   AWS_REGION=eu-west-1
   ```
2. Configure AWS credentials (`aws configure` or environment variables)
3. Bootstrap once: `cdk bootstrap`
4. Deploy: `npm run deploy:aws -- --require-approval never`

