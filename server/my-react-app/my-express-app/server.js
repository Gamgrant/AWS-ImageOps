const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const path = require('path');
const { nanoid } = require('nanoid');

const app = express();
const port = process.env.PORT || 3001;
const region = process.env.AWS_REGION || 'us-east-1';

AWS.config.update({ region });

app.use(cors({
  origin: 'http://localhost:3000'  // Allow only the frontend to make requests
}));

app.use(express.static(path.join(__dirname, '..', 'my-react-app', 'build')));

app.get('/generate-presigned-url', async (req, res) => {
  const { contentType } = req.query;
  const bucketName = process.env.S3_BUCKET_NAME;
  const uniqueFileName = `file-${nanoid()}.txt`; // Adjust the extension based on contentType if necessary

  try {
      const s3 = new AWS.S3();
      const params = {
          Bucket: bucketName,
          Key: uniqueFileName,
          Expires: 3600,
          ContentType: contentType || 'application/octet-stream',
          ACL: 'private',
      };
      const presignedUrl = await s3.getSignedUrlPromise('putObject', params);
      res.status(200).json({ presignedUrl });
  } catch (error) {
      console.error('Error generating presigned URL:', error);
      res.status(500).json({ error: 'Failed to generate presigned URL' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'my-react-app', 'build', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
