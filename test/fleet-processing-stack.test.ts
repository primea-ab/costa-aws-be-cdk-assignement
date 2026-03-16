import * as cdk from 'aws-cdk-lib/core';
import { Template } from 'aws-cdk-lib/assertions';
import { FleetProcessingStack } from '../lib/fleet-processing-stack.js';

function buildTemplate(): Template {
  const app = new cdk.App();
  const stack = new FleetProcessingStack(app, 'TestStack', {
    mongodbUri: 'mongodb://localhost:27017/fleet',
  });
  return Template.fromStack(stack);
}

describe('FleetProcessingStack', () => {
  it('creates a custom EventBus named fleet-event-bus', () => {
    buildTemplate().hasResourceProperties('AWS::Events::EventBus', {
      Name: 'fleet-event-bus',
    });
  });

  it('creates a Lambda function with the correct runtime and MONGODB_URI env var', () => {
    buildTemplate().hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs22.x',
      Environment: {
        Variables: {
          MONGODB_URI: 'mongodb://localhost:27017/fleet',
        },
      },
    });
  });

  it('creates an EventBridge rule that filters on source and detail-type', () => {
    buildTemplate().hasResourceProperties('AWS::Events::Rule', {
      EventPattern: {
        source: ['fleet.updates'],
        'detail-type': ['FleetBaseDataUpdate'],
      },
    });
  });

  it('matches the infrastructure snapshot', () => {
    const template = buildTemplate().toJSON();
    // Strip S3Key (Lambda bundle hash), it changes with every source edit.
    const normalized = JSON.parse(JSON.stringify(template, (key, value) =>
      key === 'S3Key' ? '[asset-hash]' : value
    ));
    expect(normalized).toMatchSnapshot();
  });
});
