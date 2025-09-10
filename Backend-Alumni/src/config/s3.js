const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,      // من AWS
    secretAccessKey: process.env.AWS_SECRET_KEY,  // من AWS
    region: process.env.AWS_REGION               // المنطقة
});

module.exports = s3;
