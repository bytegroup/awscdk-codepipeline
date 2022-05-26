import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {CodePipeline, CodePipelineSource, ShellStep} from "aws-cdk-lib/pipelines";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwscdkCodepipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new CodePipeline(this, "Pipeline", {
      pipelineName: "CicdPipelineDemo",
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.gitHub('https://github.com/bytegroup/awscdk-codepipeline', 'master'),
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth'
        ]
      }),
    });
  }
}
