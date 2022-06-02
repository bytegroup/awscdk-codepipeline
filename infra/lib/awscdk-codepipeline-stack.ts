import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {PipelineStack} from "./pipeline.stack";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwscdkCodepipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    new PipelineStack(this, 'CodePipelineDeployToS3', {
      env: props.env,
      stackName: props.stackName,
    });
  }
}
