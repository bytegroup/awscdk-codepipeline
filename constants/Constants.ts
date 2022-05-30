import {Environment} from "aws-cdk-lib";

export const AWS_ENV: Environment = {
    account: '361854753178',
    region: 'ap-northeast-1'
}

export const githubConfig = {
    owner: 'bytegroup',
    repo: 'ecs-nestjs-demo',
    branch: 'master',
    secreteManagerTokenName:'github-token-cicd-pipeline-demo',
    secreteManagerTokenArn:'arn:aws:secretsmanager:ap-northeast-1:361854753178:secret:github-token-cicd-pipeline-demo-JFTHB7',
}

export const APP = 'mine-map-app-server';

export const TAGS = {
    'Author': "Mizanur",
}

export const CONTAINER_PORT = 3000;
export const VPC_NAME = "toggle-staging-vpc";
export const VPC_ID = "vpc-00f205a96f9862cb2";/*toggle-staging-vpc*/
export const DEPLOY_IMAGE_FILE="docker_image_definition.json";