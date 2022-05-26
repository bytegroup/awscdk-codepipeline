#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwscdkCodepipelineStack } from '../lib/awscdk-codepipeline-stack';

const app = new cdk.App();
new AwscdkCodepipelineStack(app, 'CicdPipelineDemoStack', {
    env: {
        account: "361854753178",      // replace with your aws account ID
        region: "ap-northeast-1",         // replace with your preferred region
    },
    description: "this just for testing purpose",
    stackName: "cicd-pipeline-demo-stack",
    tags:{
        author: "mizanur",
        purpose: "demo test",
    }
});