// s3.js
require('dotenv').config(); // .env에서 AWS 키를 불러온다는 가정
const { S3Client } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
    region: process.env.AWS_REGION,  // ex) 'ap-northeast-2'
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

module.exports = s3;