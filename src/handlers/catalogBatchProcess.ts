import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'crypto';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dbClient = new DynamoDBClient({ region: 'eu-central-1' });

const snsClient = new SNSClient({ region: 'eu-central-1' });

export async function catalogBatchProcess(event: any) {
  console.log('EVENT', event);
  console.log('Received Event:', JSON.stringify(event, null, 2));
  if (!event.Records || event.Records.length === 0) {
    console.error('No records found in the event');
    return;
  }
  try {
    const records = event.Records.map((record: any) => JSON.parse(record.body));
    console.log('recordsInfo', records);

    for (const record of records) {
      const id = record.id || randomUUID();
      const productParams = {
        TableName: 'Products',
        Item: {
          id: { S: id },
          title: { S: record.title },
          description: { S: record.description || 'No description' },
          price: { N: String(record.price) },
        },
      };
      console.log('dbClient', dbClient);
      console.log('productParams', productParams);
      await dbClient.send(new PutItemCommand(productParams));

      const stockParams = {
        TableName: 'Stock',
        Item: {
          product_id: { S: id },
          count: { N: String(record.count) },
        },
      };
      console.log('stockParams', stockParams);
      await dbClient.send(new PutItemCommand(stockParams));

      console.log('Successfully processed product:', record.id);

      const publishParams = {
        TopicArn: 'arn:aws:sqs:eu-central-1:783764578704:createProductTopic',
        Message: `New product created: ${JSON.stringify(record)}`,
        Subject: 'New Product Notification',
      };
      console.log('publishParams', publishParams);
      await snsClient.send(new PublishCommand(publishParams));
      console.log('SNS notification sent for product:', record.id);
    }
  } catch (error) {
    console.error('Error processing products:', error);
    throw error;
  }
}
