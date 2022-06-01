import {Environment} from "aws-cdk-lib";

export const AWS_ENV: Environment = {
    account: '361854753178',
    region: 'ap-northeast-1'
}
export const AWS_PROD_ENV: Environment = {
    account: '716993826013',
    region: 'ap-northeast-1'
}

export const githubConfig = {
    owner: 'toggle-inc',
    repo: 'mine_map_app_server',
    branch: 'master',
    //secreteManagerTokenName:'github-token-cicd-npipeline-demo',
    secreteManagerTokenName:'github-secret-token',
    secreteManagerTokenArn:'arn:aws:secretsmanager:ap-northeast-1:716993826013:secret:github-secret-token-0oR5Qz',
}

export const APP = 'mine-map-app-server';

export const TAGS = {
    'Author': "Mizanur",
}

export const CONTAINER_PORT = 3000;
export const VPC_PROD_NAME = "toggle-vpc";
export const DEPLOY_IMAGE_FILE="docker_image_definition.json";
export const RESOURCE_BUCKET = "codepipeline-resources-cdk";