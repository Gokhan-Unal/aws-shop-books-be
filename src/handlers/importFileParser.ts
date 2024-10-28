import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import csvParser from 'csv-parser';
import { promisify } from 'util';
import { pipeline, Writable } from 'stream';

const s3Client = new S3Client({ region: 'eu-central-1' });
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

const processCsv = async (bucketName: string, objectKey: string) => {
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
        write(chunk, encoding, callback) {
          console.log(chunk);
          callback();
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
  for (const record of event.Records) {
    const bucketName = record.s3.bucket.name;
    const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    try {
      await processCsv(bucketName, objectKey);

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
