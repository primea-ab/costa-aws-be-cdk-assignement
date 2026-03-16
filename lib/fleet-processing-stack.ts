import * as cdk from 'aws-cdk-lib/core';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaRuntime from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as path from 'path';
import { Construct } from 'constructs';

interface FleetProcessingStackProps extends cdk.StackProps {
  mongodbUri: string;
}

export class FleetProcessingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FleetProcessingStackProps) {
    super(scope, id, props);

    const deadLetterQueue = new sqs.Queue(this, 'FleetEventDLQ', {
      queueName: 'fleet-event-dlq',
      retentionPeriod: cdk.Duration.days(14),
    });

    const eventBus = new events.EventBus(this, 'FleetEventBus', {
      eventBusName: 'fleet-event-bus',
    });

    const fleetHandler = new lambda.NodejsFunction(this, 'FleetEventHandler', {
      entry: path.join(__dirname, '../src/handlers/fleet-event-handler.ts'),
      handler: 'handler',
      runtime: lambdaRuntime.Runtime.NODEJS_22_X,
      environment: {
        MONGODB_URI: props.mongodbUri,
      },
      // 512MB reducing cold start time.
      memorySize: 512,
      timeout: cdk.Duration.seconds(15),
      deadLetterQueue,
    });

    new events.Rule(this, 'FleetUpdateRule', {
      eventBus,
      eventPattern: {
        source: ['fleet.updates'],
        detailType: ['FleetBaseDataUpdate'],
      },
      targets: [
        new targets.LambdaFunction(fleetHandler, {
          deadLetterQueue,
          // 2 retries is sufficient for a low-frequency system.
          retryAttempts: 2,
        }),
      ],
    });
  }
}
