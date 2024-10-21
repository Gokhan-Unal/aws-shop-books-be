import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

const TableName = 'Products';

export class AwsDynoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productTable = new dynamodb.Table(this, 'Products', {
      tableName: TableName,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
    });

    const addProductLambda = new lambda.Function(this, 'addProduct', {
      runtime: lambda.Runtime.NODEJS_16_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'handlers/seedData.seedData',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src')),
    });

    productTable.grantWriteData(addProductLambda);
  }
}
