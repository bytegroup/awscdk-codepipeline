#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwscdkCodepipelineStack } from '../lib/awscdk-codepipeline-stack';
import {EcrStack} from "../lib/ecr.stack";
import {APP, AWS_ENV, CONTAINER_PORT, TAGS, VPC_NAME} from "../lib/Constants";
import {ElasticContainerStack} from "../lib/ecs.stack";
import {Vpc} from "aws-cdk-lib/aws-ec2";

const app = new cdk.App();
const ecr = new EcrStack(app, APP+"-ecr-stack", {
    env: AWS_ENV,
    stackName: APP+"-ecr-stack",
    tags: TAGS,
});
const vpc= Vpc.fromLookup(app, VPC_NAME, {
    vpcId: 'vpc-00f205a96f9862cb2',
    vpcName: VPC_NAME,
    isDefault: false,
});
new ElasticContainerStack(app, ElasticContainerStack.name, {
    vpc: vpc,
    repository: ecr.repository,
    tags: TAGS,
})

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
