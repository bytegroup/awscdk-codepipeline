#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {APP, AWS_ENV, githubConfig, STAGING_WEB_CONFIG} from "../constants/Constants";
import {PipelineStack} from "../lib/pipeline.stack";
import {Tags} from "aws-cdk-lib";
import {S3DeployStack} from "../lib/s3.deploy.stack";

const app = new cdk.App();

const webConfigStack = new S3DeployStack(app, APP+'-web-stack', {
    env: AWS_ENV,
    stackName: APP+'-web-stack',
    webConfig: STAGING_WEB_CONFIG,
});

new PipelineStack(app, APP+'-pipeline-stack', {
    env: AWS_ENV,
    distribution: webConfigStack.distribution,
    buildBucket: webConfigStack.buildBucket,
});

Tags.of(app).add("owner", githubConfig.owner);

/*start().catch(error => {
    console.log(error)
    process.exit(1)
})*/
/*
new AwscdkCodepipelineStack(app, 'AwscdkCodepipelineStack', {
  /!* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. *!/

  /!* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. *!/
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /!* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. *!/
  // env: { account: '123456789012', region: 'us-east-1' },

  /!* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html *!/
});*/
