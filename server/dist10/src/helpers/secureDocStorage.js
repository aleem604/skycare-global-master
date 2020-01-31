"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const fs = require("fs");
const crypto = require("crypto");
//const AWS = require('ibm-cos-sdk');
const aws_sdk_1 = require("aws-sdk");
const SHA3 = require('sha3');
const uuid62 = require('uuid62');
class SecureDocumentStorage {
    constructor() {
        this.environmentFolder = ((process.env.ENVIRONMENT) ? process.env.ENVIRONMENT : 'local') + '/';
        let objectStoreS3Config = {
            endpoint: config_1.Config.cos.endpoint,
            accessKeyId: config_1.Config.cos.accessKeyID,
            secretAccessKey: config_1.Config.cos.secretAccessKey
        };
        this.objectStore = new aws_sdk_1.S3(objectStoreS3Config);
        let keyStoreS3Config = {
            endpoint: config_1.Config.cos.endpoint,
            accessKeyId: config_1.Config.cos.accessKeyID,
            secretAccessKey: config_1.Config.cos.secretAccessKey
        };
        this.keyStore = new aws_sdk_1.S3(keyStoreS3Config);
    }
    async retrieveBinaryDataFromStorage(documentID, originalDataHash, liveBucket = true) {
        let base64Data = await this.retrieveBase64DataFromStorage(documentID, originalDataHash, liveBucket);
        return Buffer.from(base64Data, 'base64');
    }
    retrieveBase64DataFromStorage(documentID, originalDataHash, liveBucket = true) {
        const bucketName = (liveBucket) ? config_1.Config.cos.liveDocsBucketName : config_1.Config.cos.archiveDocsBucketName;
        const fullDocumentID = this.environmentFolder + documentID;
        console.log(`Retrieving item from bucket: ${bucketName}, key: ${fullDocumentID}`);
        return new Promise((resolve, reject) => {
            return this.objectStore.getObject({
                Bucket: bucketName,
                Key: fullDocumentID
            }, async (err, data) => {
                if (err) {
                    console.log(err);
                    console.error(`ERROR: Failed to retrieve a document from SecureStorage: ${err.code} - ${err.message}\n`);
                    reject(`ERROR: Failed to retrieve a document from SecureStorage: ${err.code} - ${err.message}\n`);
                    return;
                }
                if (data === null || data === undefined || data.Body === undefined) {
                    reject(`ERROR: Requested object was not found in storage. ObjectID: ${fullDocumentID}`);
                }
                else {
                    let encryptedBase64Data = data.Body.toString();
                    let decryptedBase64Data = await this.decryptData(documentID, originalDataHash, encryptedBase64Data);
                    resolve(decryptedBase64Data);
                }
            });
        });
    }
    sendFileToStorage(documentID, filePath, liveBucket = true) {
        let fileBuffer = fs.readFileSync(filePath);
        return this.sendBinaryDataToStorage(documentID, fileBuffer, liveBucket);
    }
    sendBinaryDataToStorage(documentID, binaryData, liveBucket = true) {
        let base64Data = binaryData.toString('base64');
        return this.sendBase64DataToStorage(documentID, base64Data, liveBucket);
    }
    async sendBase64DataToStorage(documentID, base64Data, liveBucket = true) {
        const bucketName = (liveBucket) ? config_1.Config.cos.liveDocsBucketName : config_1.Config.cos.archiveDocsBucketName;
        const fullDocumentID = this.environmentFolder + documentID;
        let objectHash = this.computeHashForData(base64Data);
        let encryptedData = await this.encryptData(documentID, base64Data);
        console.log(`Sending an object to Storage: ${fullDocumentID}, hash: ${objectHash}`);
        return new Promise((resolve, reject) => {
            this.objectStore.putObject({
                Bucket: bucketName,
                Key: fullDocumentID,
                Body: encryptedData
            }, (err, data) => {
                if (err) {
                    console.log(err);
                    console.error(`ERROR: Failed to put the file in SecureStorage: ${err.code} - ${err.message}\n`);
                    reject(`ERROR: Failed to put the file in SecureStorage: ${err.code} - ${err.message}\n`);
                    return;
                }
                if (data === null || data === undefined || data.ETag === undefined) {
                    reject(`ERROR: Requested object was not written to storage. ObjectID: ${fullDocumentID}`);
                }
                else {
                    console.log(`Object ${fullDocumentID} created!`);
                    resolve(objectHash);
                }
            });
        });
    }
    computeHashForData(data) {
        let hash = new SHA3.SHA3Hash(512);
        hash.update(data);
        return hash.digest('hex');
    }
    deleteDataFromStorage(documentID, liveBucket = true) {
        const bucketName = (liveBucket) ? config_1.Config.cos.liveDocsBucketName : config_1.Config.cos.archiveDocsBucketName;
        const fullDocumentID = this.environmentFolder + documentID;
        console.log(`Deleting object from storage: ${fullDocumentID}`);
        return new Promise((resolve, reject) => {
            this.objectStore.deleteObject({
                Bucket: bucketName,
                Key: fullDocumentID
            }, (err, data) => {
                if (err) {
                    console.log(err);
                    console.error(`ERROR: Failed to delete the requested file in SecureStorage: ${err.code} - ${err.message}\n`);
                    reject(`ERROR: Failed to delete the requested file in SecureStorage: ${err.code} - ${err.message}\n`);
                    return;
                }
                else {
                    console.log(`Object ${fullDocumentID} deleted!`);
                    resolve(true);
                }
            });
        });
    }
    async encryptData(objectID, unencryptedBase64Data) {
        let encryptionKey = '';
        try {
            encryptionKey = await this.getEncryptionKeyAsync(objectID);
            if (encryptionKey == undefined) {
                encryptionKey = await this.createEncryptionKeyAsync(objectID);
            }
        }
        catch (e) {
            encryptionKey = await this.createEncryptionKeyAsync(objectID);
        }
        let bufferedData = Buffer.from(unencryptedBase64Data, 'base64');
        let cipher = crypto.createCipher(config_1.Config.cos.encryptionAlgorithm, encryptionKey);
        let crypted = cipher.update(bufferedData, 'base64', 'base64');
        crypted += cipher.final('base64');
        return crypted;
    }
    async decryptData(objectID, originalDataHash, encryptedBase64Data) {
        const encryptionKey = await this.getEncryptionKeyAsync(objectID);
        let decipher = crypto.createDecipher(config_1.Config.cos.encryptionAlgorithm, encryptionKey);
        let decrypted = decipher.update(encryptedBase64Data, 'base64').toString('base64');
        decrypted += decipher.final('base64');
        // Data integrity check
        const currentDataHash = this.computeHashForData(decrypted);
        if (currentDataHash != originalDataHash) {
            throw new Error(`ERROR: Decryption failed for object. OriginalDataHash: ${originalDataHash}, CurrentDataHash: ${currentDataHash}`);
        }
        return decrypted;
    }
    getEncryptionKeyX(objectID) {
        const keyStore = JSON.parse(fs.readFileSync(config_1.Config.cos.keyStorePath, { encoding: 'utf8' }));
        return keyStore[objectID];
    }
    createEncryptionKeyX(objectID) {
        if (!fs.existsSync(config_1.Config.cos.keyStorePath)) {
            fs.writeFileSync(config_1.Config.cos.keyStorePath, '{"keys":"values"}', { encoding: 'utf8' });
        }
        const keyStore = JSON.parse(fs.readFileSync(config_1.Config.cos.keyStorePath, { encoding: 'utf8' }));
        if (keyStore[objectID] == undefined) {
            const encryptionKey = uuid62.v4();
            keyStore[objectID] = encryptionKey;
            fs.writeFileSync(config_1.Config.cos.keyStorePath, JSON.stringify(keyStore), { encoding: 'utf8' });
            return encryptionKey;
        }
        else {
            return keyStore[objectID];
        }
    }
    getEncryptionKeyAsync(objectID) {
        return new Promise(async (resolve, reject) => {
            let keyStore = await this.getKeyStoreFile();
            if (Object.keys(keyStore).findIndex((v, i, l) => { return v == objectID; }) == -1) {
                reject(`ERROR: Could not locate the encryption key in the keystore: ${objectID}`);
            }
            else {
                resolve(keyStore[objectID]);
            }
        });
    }
    async createEncryptionKeyAsync(objectID) {
        let keyStore = await this.getKeyStoreFile();
        if (keyStore[objectID] == undefined) {
            const encryptionKey = uuid62.v4();
            keyStore[objectID] = encryptionKey;
            let newKeyWasSaved = await this.writeKeyStoreFile(keyStore);
            if (newKeyWasSaved) {
                return encryptionKey;
            }
            else {
                throw new Error('ERROR: Failed to create a new encryption key and save it');
            }
        }
        else {
            return keyStore[objectID];
        }
    }
    async getKeyStoreFile() {
        const bucketName = config_1.Config.cos.keyStoreBucket;
        const fileName = this.environmentFolder + config_1.Config.cos.keyStoreFile;
        console.log(`Retrieving encryption key file from bucket: ${bucketName}, file: ${fileName}`);
        return new Promise((resolve, reject) => {
            return this.keyStore.getObject({
                Bucket: bucketName,
                Key: fileName
            }, (err, data) => {
                if ((err !== undefined && err !== null) || (data === null || data === undefined || data.Body === undefined)) {
                    if (err) {
                        console.log(err);
                        console.error(`ERROR: Failed to retrieve the encryption key file from SecureStorage: ${err.code} - ${err.message}\n`);
                    }
                    resolve(JSON.parse('{"keys":"values"}'));
                }
                else {
                    resolve(JSON.parse(data.Body.toString()));
                }
            });
        });
    }
    async writeKeyStoreFile(keyStore) {
        const bucketName = config_1.Config.cos.keyStoreBucket;
        const fileName = this.environmentFolder + config_1.Config.cos.keyStoreFile;
        const fileData = JSON.stringify(keyStore);
        console.log(`Saving the encryption key file to bucket: ${bucketName}, file: ${fileName}`);
        return new Promise((resolve, reject) => {
            this.objectStore.putObject({
                Bucket: bucketName,
                Key: fileName,
                Body: fileData
            }, (err, data) => {
                if (err) {
                    console.log(err);
                    console.error(`ERROR: Failed to put the file in SecureStorage: ${err.code} - ${err.message}\n`);
                    resolve(false);
                }
                if (data === null || data === undefined || data.ETag === undefined) {
                    console.log(`ERROR: Encryption key file was not written to SecureStorage. Filename: ${fileName}`);
                    resolve(false);
                }
                else {
                    console.log(`Encryption key file ${fileName} was saved!`);
                    resolve(true);
                }
            });
        });
    }
}
exports.SecureDocumentStorage = SecureDocumentStorage;
//# sourceMappingURL=secureDocStorage.js.map