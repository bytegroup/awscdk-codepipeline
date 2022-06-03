import {BuildSpec} from "aws-cdk-lib/aws-codebuild";
import {DEPLOY_IMAGE_FILE, HOST_BUCKET} from "./Constants";

export class BuildCommands {
    public getBuildSpec() {
        return BuildSpec.fromObject({
            version: '0.2',
            /*env: {
                shell: 'bash'
            },*/
            phases: {
                install: {
                    "runtime-versions": {
                        "nodejs": 10,
                    }
                },
                commands: [
                    "echo not installing anything else",
                ],
                pre_build: {
                    commands: [
                        'echo Installing source dependencies...',
                        'yarn install',
                        'aws --version',
                    ],
                },
                build: {
                    commands: [
                        'echo Build started on `date`',
                        'echo Compiling the mine map app client code',
                        'yarn lint',
                        'yarn build',
                    ],
                },
                post_build: {
                    commands: [
                        'echo Build completed on `date`',
                        'echo Push build package to bucket',
                        'aws s3 sync out s3://'+HOST_BUCKET+'/',
                    ]
                }
            },
            /*artifacts: {
                files: [DEPLOY_IMAGE_FILE]
            },*/
        });
    }
}