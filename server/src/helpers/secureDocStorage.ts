import { inject } from '@loopback/core';
import { Config } from '../config';

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

//const AWS = require('ibm-cos-sdk');
import { S3, AWSError } from 'aws-sdk';
import { AnyARecord } from 'dns';

const SHA3 = require('sha3');
const uuid62 = require('uuid62');
 


export class SecureDocumentStorage {

    private objectStore : S3;
    private keyStore : S3;
    private environmentFolder : string = ((process.env.ENVIRONMENT) ? process.env.ENVIRONMENT : 'local') + '/';
    


    constructor() {
        let objectStoreS3Config : S3.ClientConfiguration = {
            endpoint: Config.cos.endpoint,
            accessKeyId: Config.cos.accessKeyID,
            secretAccessKey: Config.cos.secretAccessKey
        };

        this.objectStore = new S3(objectStoreS3Config);

        let keyStoreS3Config : S3.ClientConfiguration = {
            endpoint: Config.cos.endpoint,
            accessKeyId: Config.cos.accessKeyID,
            secretAccessKey: Config.cos.secretAccessKey
        };

        this.keyStore = new S3(keyStoreS3Config);
    }

    public async retrieveBinaryDataFromStorage(documentID: string, originalDataHash:string, liveBucket:boolean=true) : Promise<Buffer> {
        let base64Data : string = await this.retrieveBase64DataFromStorage(documentID, originalDataHash, liveBucket);
        return Buffer.from(base64Data, 'base64');
    }

    public retrieveBase64DataFromStorage(documentID:string, originalDataHash:string, liveBucket:boolean=true) : Promise<string> {
        const bucketName : string = (liveBucket) ? Config.cos.liveDocsBucketName : Config.cos.archiveDocsBucketName;
        const fullDocumentID : string = this.environmentFolder + documentID;
        console.log(`Retrieving item from bucket: ${bucketName}, key: ${fullDocumentID}`);

        return new Promise((resolve, reject) => {
            return this.objectStore.getObject({
                Bucket: bucketName, 
                Key: fullDocumentID
            }, async (err:AWSError, data:S3.GetObjectOutput)=>{
                if (err) {
                    console.log(err);
                    console.error(`ERROR: Failed to retrieve a document from SecureStorage: ${err.code} - ${err.message}\n`);
                    reject(`ERROR: Failed to retrieve a document from SecureStorage: ${err.code} - ${err.message}\n`);
                    return;
                }

                if (data === null || data === undefined || data.Body === undefined) {
                    reject(`ERROR: Requested object was not found in storage. ObjectID: ${fullDocumentID}`);
                } else {
                    let encryptedBase64Data : string = data.Body.toString();
                    let decryptedBase64Data : string = await this.decryptData(documentID, originalDataHash, encryptedBase64Data);
                    resolve(decryptedBase64Data);
                }    
            });
        })
    }

    public sendFileToStorage(documentID:string, filePath:string, liveBucket:boolean=true) : Promise<string> {
        let fileBuffer : Buffer = fs.readFileSync(filePath);
        return this.sendBinaryDataToStorage(documentID, fileBuffer, liveBucket);
    }

    public sendBinaryDataToStorage(documentID:string, binaryData:Buffer, liveBucket:boolean=true) : Promise<string> {
        let base64Data : string = binaryData.toString('base64');
        return this.sendBase64DataToStorage(documentID, base64Data, liveBucket);
    }

    public async sendBase64DataToStorage(documentID:string, base64Data:string, liveBucket:boolean=true) : Promise<string> {
        const bucketName : string = (liveBucket) ? Config.cos.liveDocsBucketName : Config.cos.archiveDocsBucketName;
        const fullDocumentID : string = this.environmentFolder + documentID;
        let objectHash : string = this.computeHashForData(base64Data);
        let encryptedData : string = await this.encryptData(documentID, base64Data);
        console.log(`Sending an object to Storage: ${fullDocumentID}, hash: ${objectHash}`);

        return new Promise<string>((resolve, reject) => {
            this.objectStore.putObject({
                Bucket: bucketName, 
                Key: fullDocumentID, 
                Body: encryptedData
            }, (err: AWSError, data: S3.PutObjectOutput)=>{
                if (err) {
                    console.log(err);
                    console.error(`ERROR: Failed to put the file in SecureStorage: ${err.code} - ${err.message}\n`);
                    reject(`ERROR: Failed to put the file in SecureStorage: ${err.code} - ${err.message}\n`);
                    return;
                }

                if (data === null || data === undefined || data.ETag === undefined) {
                    reject(`ERROR: Requested object was not written to storage. ObjectID: ${fullDocumentID}`);
                } else {
                    console.log(`Object ${fullDocumentID} created!`);
                    resolve(objectHash);
                }    
            });
        })
    }

    public computeHashForData(data:string) : string {
        let hash = new SHA3.SHA3Hash(512);
        hash.update(data);
        return hash.digest('hex');
    }

    public deleteDataFromStorage(documentID:string, liveBucket:boolean=true) : Promise<boolean> {
        const bucketName : string = (liveBucket) ? Config.cos.liveDocsBucketName : Config.cos.archiveDocsBucketName;
        const fullDocumentID : string = this.environmentFolder + documentID;
        console.log(`Deleting object from storage: ${fullDocumentID}`);

        return new Promise<boolean>((resolve, reject) => {
            this.objectStore.deleteObject({
                Bucket: bucketName,
                Key: fullDocumentID
            }, (err: AWSError, data: S3.DeleteObjectOutput)=>{
                if (err) {
                    console.log(err);
                    console.error(`ERROR: Failed to delete the requested file in SecureStorage: ${err.code} - ${err.message}\n`);
                    reject(`ERROR: Failed to delete the requested file in SecureStorage: ${err.code} - ${err.message}\n`);
                    return;
                } else {
                    console.log(`Object ${fullDocumentID} deleted!`);
                    resolve(true);
                }    
            });
        });
    }

    private async encryptData(objectID:string, unencryptedBase64Data:string) : Promise<string> {
        let encryptionKey : string = '';        
        try{
            encryptionKey = await this.getEncryptionKeyAsync(objectID);

            if (encryptionKey == undefined) {
                encryptionKey = await this.createEncryptionKeyAsync(objectID);
            }
        }catch(e){
            encryptionKey = await this.createEncryptionKeyAsync(objectID);
        }

        let bufferedData = Buffer.from(unencryptedBase64Data, 'base64');
        let cipher = crypto.createCipher(Config.cos.encryptionAlgorithm, encryptionKey);
        let crypted = cipher.update(bufferedData, 'base64', 'base64');
        crypted += cipher.final('base64');
        return crypted;
    }
    
    private async decryptData(objectID:string, originalDataHash:string, encryptedBase64Data:string) : Promise<string> {
        const encryptionKey : string = await this.getEncryptionKeyAsync(objectID);
        let decipher = crypto.createDecipher(Config.cos.encryptionAlgorithm, encryptionKey);
        let decrypted : string = decipher.update(encryptedBase64Data, 'base64').toString('base64');
        decrypted += decipher.final('base64');

        // Data integrity check
        const currentDataHash : string = this.computeHashForData(decrypted);
        if (currentDataHash != originalDataHash) {
            throw new Error(`ERROR: Decryption failed for object. OriginalDataHash: ${originalDataHash}, CurrentDataHash: ${currentDataHash}`);
        }
        return decrypted;
    }


    
    private getEncryptionKeyX(objectID:string) : string {
        const keyStore = JSON.parse(fs.readFileSync(Config.cos.keyStorePath, { encoding: 'utf8'}));
        return keyStore[objectID];
    }

    private createEncryptionKeyX(objectID:string) : string {
        if (!fs.existsSync(Config.cos.keyStorePath)) {
            fs.writeFileSync(Config.cos.keyStorePath, '{"keys":"values"}', { encoding: 'utf8' });
        }

        const keyStore = JSON.parse(fs.readFileSync(Config.cos.keyStorePath, { encoding: 'utf8'}));
        
        if (keyStore[objectID] == undefined) {
            const encryptionKey : string = uuid62.v4();
            keyStore[objectID] = encryptionKey;

            fs.writeFileSync(Config.cos.keyStorePath, JSON.stringify(keyStore), { encoding: 'utf8' });

            return encryptionKey;
        } else {
            return keyStore[objectID];
        }
    }



    private getEncryptionKeyAsync(objectID:string) : Promise<string> {
        return new Promise<string>( async (resolve, reject) => {
            let keyStore : any = await this.getKeyStoreFile();
            
            if (Object.keys(keyStore).findIndex((v,i,l)=>{return v == objectID;}) == -1) {
                reject(`ERROR: Could not locate the encryption key in the keystore: ${objectID}`);
            } else {
                resolve(keyStore[objectID]);
            }
        });
    }

    private async createEncryptionKeyAsync(objectID:string) : Promise<string> {
        let keyStore : any = await this.getKeyStoreFile();
        
        if (keyStore[objectID] == undefined) {
            const encryptionKey : string = uuid62.v4();
            keyStore[objectID] = encryptionKey;

            let newKeyWasSaved : boolean = await this.writeKeyStoreFile(keyStore);

            if (newKeyWasSaved) {
                return encryptionKey;
            } else {
                throw new Error('ERROR: Failed to create a new encryption key and save it');
            }
        } else {
            return keyStore[objectID];
        }
    }

    private async getKeyStoreFile() : Promise<any> {
        const bucketName : string = Config.cos.keyStoreBucket;
        const fileName : string = this.environmentFolder + Config.cos.keyStoreFile;
        console.log(`Retrieving encryption key file from bucket: ${bucketName}, file: ${fileName}`);

        return new Promise<any>( (resolve, reject) => {
            return this.keyStore.getObject({
                Bucket: bucketName, 
                Key: fileName
            }, (err:AWSError, data:S3.GetObjectOutput)=>{
                if ((err !== undefined && err !== null) || (data === null || data === undefined || data.Body === undefined)) {
                    if (err) {
                        console.log(err);
                        console.error(`ERROR: Failed to retrieve the encryption key file from SecureStorage: ${err.code} - ${err.message}\n`);
                    }                    
                    resolve(JSON.parse('{"keys":"values"}'))
                } else {
                    resolve(JSON.parse(data.Body.toString()));
                }    
            });
        });
    }

    private async writeKeyStoreFile(keyStore : any) : Promise<boolean> {
        const bucketName : string = Config.cos.keyStoreBucket;
        const fileName : string = this.environmentFolder + Config.cos.keyStoreFile;
        const fileData : string = JSON.stringify(keyStore);
        console.log(`Saving the encryption key file to bucket: ${bucketName}, file: ${fileName}`);

        return new Promise<boolean>((resolve, reject) => {
            this.objectStore.putObject({
                Bucket: bucketName, 
                Key: fileName, 
                Body: fileData
            }, (err: AWSError, data: S3.PutObjectOutput)=>{
                if (err) {
                    console.log(err);
                    console.error(`ERROR: Failed to put the file in SecureStorage: ${err.code} - ${err.message}\n`);
                    resolve(false);
                }

                if (data === null || data === undefined || data.ETag === undefined) {
                    console.log(`ERROR: Encryption key file was not written to SecureStorage. Filename: ${fileName}`);
                    resolve(false);
                } else {
                    console.log(`Encryption key file ${fileName} was saved!`);
                    resolve(true);
                }    
            });
        });
    }

}