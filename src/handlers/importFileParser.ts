import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import csvParser from 'csv-parser';
import { promisify } from 'util';
import { pipeline, Writable } from 'stream';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const s3Client = new S3Client({ region: 'eu-central-1' });
const sqsClient = new SQSClient({ region: 'eu-central-1' });
const pipelineAsync = promisify(pipeline);

async function moveFile(bucketName: string, objectKey: string, destinationKey: string) {
  await s3Client.send(
    new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: `${bucketName}/${objectKey}`,
      Key: destinationKey,
    })
  );
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    })
  );
}

const sendRecordToSQS = async (record: any, queueUrl: string) => {
  const params = {
    MessageBody: JSON.stringify(record),
    QueueUrl: queueUrl,
  };
  console.log('paramsImpportParsMessage', params);
  await sqsClient.send(new SendMessageCommand(params));
};

const processCsv = async (bucketName: string, objectKey: string, queueUrl: string) => {
  const getObjectParams = {
    Bucket: bucketName,
    Key: objectKey,
  };

  try {
    const data = await s3Client.send(new GetObjectCommand(getObjectParams));
    await pipelineAsync(
      data.Body as any,
      csvParser(),
      new Writable({
        objectMode: true,
        write: async (chunk, encoding, callback) => {
          try {
            await sendRecordToSQS(chunk, queueUrl);
            callback();
          } catch (error: any) {
            callback(error);
          }
        },
      })
    );

    console.log(`Successfully processed ${objectKey}`);
  } catch (err) {
    console.error('Error processing file', err);
    throw err;
  }
};

export const importFileParser = async (event: any) => {
  const queryUrl = 'https://sqs.eu-central-1.amazonaws.com/783764578704/catalogItemsQueue';
  for (const record of event.Records) {
    const bucketName = record.s3.bucket.name;
    const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    try {
      await processCsv(bucketName, objectKey, queryUrl);

      console.log(`CSV file ${objectKey} has been processed`);

      const destinationKey = objectKey.replace('uploaded/', 'parsed/');
      await moveFile(bucketName, objectKey, destinationKey);
      console.log(`File moved from ${objectKey} to ${destinationKey}`);
    } catch (error) {
      console.error('Error processing/moving file:', error);
      throw error;
    }
  }
};
