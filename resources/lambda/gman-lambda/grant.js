const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('1234567890abcdef', 8);

exports.handler = async (event) => {
    const body = JSON.parse(event.body);
    const inputText = body.inputText;
    const fileKey = body.fileKey;
    const bucketName = process.env.BUCKET_NAME;
    const tableName = process.env.TABLE_NAME;
    try {
        const fileContent = await s3.getObject({
            Bucket: bucketName,
            Key: fileKey,
          }).promise().then(data => data.Body.toString('utf-8'));
      
        const updatedContent = `${fileContent}\n${inputText}`;
        await s3.putObject({
            Bucket: bucketName,
            Key: fileKey,
            Body: updatedContent,
          }).promise();

          const params = {
            TableName: tableName,
            Item: {
              id: event.requestContext.requestId, 
              inputText: inputText,
              filePath: `s3://${bucketName}/${fileKey}`,
            },
          };
          await dynamoDB.put(params).promise();
          return {
            statusCode: 200,
            body: JSON.stringify({ message: "File updated and data saved to DynamoDB", filePath: `s3://${bucketName}/${fileKey}` }),
          };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An error occurred processing your request" }),
        };
        }
    };