#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwscdkCodepipelineStack } from '../lib/awscdk-codepipeline-stack';
import {
    githubConfig,
} from "../constants/Constants";
import {Tags} from "aws-cdk-lib";

const stackName = 'minemap-client-pipeline-stack';
const app = new cdk.App();

new AwscdkCodepipelineStack(app, stackName, {
    stackName,
    env: { account: '361854753178', region: 'ap-northeast-1' },
});
Tags.of(app).add("owner", githubConfig.owner);
