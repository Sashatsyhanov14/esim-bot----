const fs = require('fs');
const path = require('path');
const QrCode = require('qrcode-reader');
const Jimp = require('jimp');

const buffer = fs.readFileSync(path.join(__dirname, 'payment_qr.jpg'));

Jimp.read(buffer, function(err, image) {
    if (err) {
        console.error('Error reading image:', err);
        return;
    }
    const qr = new QrCode();
    qr.callback = function(err, value) {
        if (err) {
            console.error('Error decoding QR:', err);
            return;
        }
        console.log('--- QR CONTENT START ---');
        console.log(value.result);
        console.log('--- QR CONTENT END ---');
    };
    qr.decode(image.bitmap);
});
