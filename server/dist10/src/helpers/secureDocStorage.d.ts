/// <reference types="node" />
export declare class SecureDocumentStorage {
    private objectStore;
    private keyStore;
    private environmentFolder;
    constructor();
    retrieveBinaryDataFromStorage(documentID: string, originalDataHash: string, liveBucket?: boolean): Promise<Buffer>;
    retrieveBase64DataFromStorage(documentID: string, originalDataHash: string, liveBucket?: boolean): Promise<string>;
    sendFileToStorage(documentID: string, filePath: string, liveBucket?: boolean): Promise<string>;
    sendBinaryDataToStorage(documentID: string, binaryData: Buffer, liveBucket?: boolean): Promise<string>;
    sendBase64DataToStorage(documentID: string, base64Data: string, liveBucket?: boolean): Promise<string>;
    computeHashForData(data: string): string;
    deleteDataFromStorage(documentID: string, liveBucket?: boolean): Promise<boolean>;
    private encryptData;
    private decryptData;
    private getEncryptionKeyX;
    private createEncryptionKeyX;
    private getEncryptionKeyAsync;
    private createEncryptionKeyAsync;
    private getKeyStoreFile;
    private writeKeyStoreFile;
}
