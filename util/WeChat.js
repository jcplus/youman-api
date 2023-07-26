const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const xml2js = require('xml2js');
const WechatPayLib = require('wechatpay-node-v3');
require('dotenv').config();

const APP_URL = process.env.APP_URL;
const WECHAT_APP_ID = process.env.WECHAT_APP_ID;
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET;
const WECHAT_PAY_API_KEY_V3 = process.env.WECHAT_PAY_API_KEY_V3;
const WECHAT_MERCHANT_ID = process.env.WECHAT_MERCHANT_ID;
const WECHAT_MERCHANT_CERT_SERIAL = process.env.WECHAT_MERCHANT_CERT_SERIAL;
const POINT_TO_CNY_CONVERSION_RATE = process.env.CNY_TO_POINT_CONVERSION_RATE;
const POINT_TO_CNY_FEE_RATE = process.env.POINT_TO_CNY_FEE_RATE;

const API_CLIENT_CERTIFICATE = fs.readFileSync('./ssh/apiclient_cert.pem');
const API_CLIENT_PRIVATE_KEY = fs.readFileSync('./ssh/apiclient_key.pem');

const wxPay = new WechatPayLib({
    appid: WECHAT_APP_ID,
    mchid: WECHAT_MERCHANT_ID,
    publicKey: API_CLIENT_CERTIFICATE,
    privateKey: API_CLIENT_PRIVATE_KEY,
});

/**
 * Cash out the points
 *
 * @param openId
 * @param transactionId
 * @param amount
 */
const cashOut = async (openId, transactionId, amount) => {
    const url = 'https://api.mch.weixin.qq.com/v3/transfer/batches';
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = {
        appid: process.env.WECHAT_APP_ID,
        out_batch_no: transactionId,
        batch_name: '提现',
        batch_remark: '佣金提现',
        total_amount: amount,
        total_num: 1,
        transfer_detail_list: [
            {
                out_detail_no: transactionId,
                transfer_amount: amount,
                transfer_remark: '佣金提现',
                openid: openId,
            },
        ],
    };

    try {
        const signature = wxPay.getSignature('POST', nonce, timestamp, '/v3/transfer/batches', payload);
        const authorization = wxPay.getAuthorization(nonce, timestamp, signature);

        const result = await request
            .post(url)
            .send(payload)
            .set({
                'Accept': 'application/json',
                'Authorization': authorization,
                'Content-Type': 'application/json',
                'Wechatpay-Serial': WECHAT_MERCHANT_CERT_SERIAL,
            });
        console.log(result);
    } catch (error) {
        console.error(error);
    }
};

/**
 * Convert points to CNY cents
 *
 * @param {number} points
 * @returns {number}
 */
const convertPointToCny = function (points) {
    return Math.round(points * POINT_TO_CNY_CONVERSION_RATE);
};

/**
 *
 * @param params
 * @param key
 * @returns {string}
 */
const createTransferSign = function (params, key) {
    let string = '';

    Object.keys(params).sort().forEach((k) => {
        if (params[k] !== undefined && params[k] !== '' && k !== 'sign') {
            string += `${k}=${params[k]}&`;
        }
    });

    string += `key=${key}`;

    return crypto
        .createHash('md5')
        .update(string)
        .digest('hex')
        .toUpperCase();
};

/**
 * Create a signature for WeChat Payment authorisation header
 *
 * @param {string} method
 * @param {string} url
 * @param {object} payload
 * @returns {string}
 */
const createPayAuthHeader = function (method, url, payload) {
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payloadStr = JSON.stringify(payload);
    const message = `${method}\n${url}\n${timestamp}\n${nonce}\n${payloadStr}\n`;
    const sign = crypto.createSign('RSA-SHA256');

    sign.update(message);
    const signature = sign.sign(API_CLIENT_PRIVATE_KEY, 'base64');
    return `WECHATPAY2-SHA256-RSA2048 mchid="${WECHAT_MERCHANT_ID}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${API_CLIENT_PRIVATE_KEY}"`;
};

/**
 * Create XML object
 *
 * @param {object} data
 * @returns {*}
 */
const createXml = function (data) {
    let builder = new xml2js.Builder();
    return builder.buildObject(data);
};


/**
 * Decrypt data transferred in
 *
 * @param {string} encryptedData
 * @param {string} iv
 * @param {string} sessionKey
 * @returns {object}
 */
const decryptData = function (encryptedData, iv, sessionKey) {
    const decoded = crypto.createDecipheriv('aes-128-cbc', Buffer.from(sessionKey, 'base64'), Buffer.from(iv, 'base64'));
    decoded.setAutoPadding(true)
    let decrypted = decoded.update(Buffer.from(encryptedData, 'base64'), 'binary', 'utf8');
    decrypted += decoded.final('utf8');
    return JSON.parse(decrypted);
};

const pay = async function (data) {
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = {
        ...data,
        appid: WECHAT_APP_ID,
        mchid: WECHAT_MERCHANT_ID,
        notify_url: `${APP_URL}wechat/order-notify-callback`,
    };

    // Get the signature and authorization
    const signature = wxPay.getSignature('POST', nonce, timestamp, '/v3/pay/transactions/jsapi', payload);
    const authorization = wxPay.getAuthorization(nonce, timestamp, signature);

    const result = await axios.post('https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi', payload, {
        headers: {
            'Accept': 'application/json',
            'Authorization': authorization,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
        },
    });

    if (!result.body || !result.body.prepay_id) {
        throw new Error(result);
    }

    const prepayId = result.body.prepay_id;
    const packageStr = `prepay_id=${prepayId}`;
    const signStr = `${WECHAT_APP_ID}\n${timestamp}\n${nonce}\n${packageStr}\n`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signStr);
    const paySign = sign.sign(API_CLIENT_PRIVATE_KEY, 'base64');
    return {
        timeStamp: timestamp,
        nonceStr: nonce,
        package: packageStr,
        signType: 'RSA',
        paySign: paySign
    };
};

module.exports = {
    cashOut,
    convertPointToCny,
    createPayAuthHeader,
    createTransferSign,
    createXml,
    decryptData,
    pay,
};