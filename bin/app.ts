#!/usr/bin/env node
import 'dotenv/config';
import * as cdk from 'aws-cdk-lib/core';
import { FleetProcessingStack } from '../lib/fleet-processing-stack.js';

const app = new cdk.App();

new FleetProcessingStack(app, 'FleetProcessingStack', {
  env: {
    account: process.env.AWS_ACCOUNT || '000000000000',
    region: process.env.AWS_REGION || 'eu-west-1',
  },
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fleet',
});
