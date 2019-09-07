var AWS = require('aws-sdk');
var request = require('request');
const axios = require('axios');
var fs = require('fs');
const http = require('http');
https = require('https');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvWriter = createCsvWriter({
    path: 'log-s3.csv',
    header: [
        { id: 'etag', title: 'ETag' },
        { id: 'filename', title: 'File' },
        { id: 'status', title: 'Status' },
        { id: 'error', title: 'Error' }
    ],
    append: true
});
const config_data = AWS.config.loadFromPath('./config.json');

var s3 = new AWS.S3();

function put_from_url(url, bucket, key, callback) {
    request({
        url: url,
        encoding: null
    }, function (err, res, body) {
        if (err)
            return callback(err, res);

        s3.putObject({
            Bucket: bucket,
            Key: key,
            ContentType: res.headers['content-type'],
            ContentLength: res.headers['content-length'],
            Body: body // buffer
        }, callback);
    })
}

for (let j = 0; j < 68; j++) {
    setTimeout(function () {
        var url = `http://staging.vistarooms.com/api/property-image?page=${j}`;
        axios.get(url).then(function (response) {

            for (let i = 0; i < response.data.length; i++) {
                const element = response.data[i];
                let filename = element.photo.split("/").slice(-1)[0]
                put_from_url(element.photo, 'vistarooms-backup', `gallery/${filename}`, function (error, res) {
                    if (error)
                        throw error;
                    console.log(res)
                    csvWriter
                        .writeRecords([{
                            etag: res.ETag,
                            filename: filename,
                            status: error ? true : false,
                            error: error ? error : 'NA',
                        }])
                        .then(() => console.log('The CSV file was written successfully'));
                    console.log('Uploaded data successfully!');
                });

            }

        }).catch(function (error) {
            console.log(error);
        })
    }, 2000*j)


}
