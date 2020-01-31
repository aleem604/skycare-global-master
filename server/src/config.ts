export class Config {

    constructor() {}

    public static email : any = {
        "newCaseMessage": {
            "templateID": "d-4ca42a4e48da44f19b7332597112593a",
            "fromEmail": "quote@skycareglobal.com"
        },
        "newCaseAssigned": {
            "templateID": "d-8ba3c13e3cc646e7b245bd067a543bd4",
            "fromEmail": "quote@skycareglobal.com",
            "linkBaseURL": "/case/view/"
        },
        "newUserInvitation": {
            "templateID": "d-c38cc3fba12341368620dadde4188f40",
            "fromEmail": "quote@skycareglobal.com",
            "linkBaseURL": "/auth/setupUser/"
        },
        "credentialReset": {
            "templateID": "d-4aa8f244807d4e20850c0cbbcfbb47ab",
            "fromEmail": "quote@skycareglobal.com",
            "linkBaseURL": "/auth/reset/"
        },
        "limitedCaseAccess": {
            "templateID": "d-3161d90d5a004181a0e448fffe06e832",
            "fromEmail": "quote@skycareglobal.com",
            "linkBaseURL": "/case/limitedView/"
        },
        "statusChangeNotification": {
            "templateID": "d-c6d8ee247df44ff48d69e650e0756e7f",
            "fromEmail": "quote@skycareglobal.com"
        }
    }

    public static jwt : any = {
        issuer: "skycare-dev.bluemix.net",
        algorithm: "HS256",
        audience: "skycare-users",
        encryptingKey: "lksdfjlksdjflkjsdlfkjsdlkfjwerjw82380323brb23nb5,24nb52,3m4n2m234,3,,23mnbjk2h34kjh232l3k4jlk234j"
    }


    public static nexmo2FA : any = {
        brand: 'SkyCare Global',
        keyPrefix: 'PHONE-'
    }


    public static cos : any = {
        endpoint: 's3.us-east-2.amazonaws.com',
        accessKeyID: 'AKIAYHE4V2AP7WQGHYJO',
        secretAccessKey: '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',

        liveDocsBucketName: 'skycare-files',
        archiveDocsBucketName: '',

        encryptionAlgorithm: 'aes-256-ctr',

        keyStoreBucket: 'skycare-keys',
        keyStoreFile: 'keys.json'
    }


    public static flightaware : any = {
        user : 'mrmoneychanger',
        key : '00764abf7b5fed4511d7b586da77ba6da1c0b3b8'
    }

}

