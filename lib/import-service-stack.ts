import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

import * as path from 'path';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'uploaded', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const importProductsFileLambda = new lambda.Function(this, 'ImportProductsFileLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'handlers/importProductsFile.importProductsFile',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src')),
    });

    const importFileParserLambda = new lambda.Function(this, 'ImportFileParserLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'handlers/importProductsFile.importProductsFile',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src')),
    });

    const api = new apigateway.RestApi(this, 'ImportApi', {
      restApiName: 'Import Service',
      description: 'Import Service API',
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: ['https://d1psre7xuwrpjr.cloudfront.net', 'http://localhost:3000'],
        allowMethods: ['GET', 'OPTIONS'],
      },
    });

    const importProductsFileLambdaIntegration = new apigateway.LambdaIntegration(importProductsFileLambda, {
      requestTemplates: {
        'application/json': `{}`,
      },
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'https://d1psre7xuwrpjr.cloudfront.net'",
            'method.response.header.Access-Control-Allow-Methods': "'GET, OPTIONS'",
            'method.response.header.Access-Control-Allow-Headers': "'*'",
          },
        },
      ],
      proxy: true,
    });

    const importResource = api.root.addResource('import');

    importResource.addMethod('GET', importProductsFileLambdaIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Headers': true,
          },
        },
      ],
    });
  }
}
