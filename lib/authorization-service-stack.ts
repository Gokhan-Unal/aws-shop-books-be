import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import * as path from 'path';

export class AuthServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const authorizationLambda = new lambda.Function(this, 'AuthorizationLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'handlers/basicAuthorizer.basicAuthorizer',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src')),
      environment: {
        CREDENTIALS: process.env.GOKHAN_UNAL || '',
      },
    });
  }
}
