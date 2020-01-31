import { Entity, ValueObject } from '@loopback/repository';
import { User } from '.';
export declare class GPSPoint extends ValueObject {
    latitude: number;
    longitude: number;
}
export declare class Escort extends Entity {
    escortID: string;
    name: string;
    userID: string;
    licenseType?: string;
    licenseExpiration?: string;
    alsExpiration?: string;
    passportExpiration?: string;
    passportCountry?: string;
    visaCountry1?: string;
    visaCountry2?: string;
    visaCountry3?: string;
    language1?: string;
    language2?: string;
    language3?: string;
    language4?: string;
    homeAirportCity?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
    availability?: string;
    paymentAccountName?: string;
    paymentBankName?: string;
    paymentBankAddress1?: string;
    paymentBankAddress2?: string;
    paymentBankCity?: string;
    paymentBankRegion?: string;
    paymentBankCountry?: string;
    paymentBankPostalCode?: string;
    paymentUSRoutingNumber?: string;
    paymentIntlRoutingNumber?: string;
    paymentAccountNumber?: string;
    user?: User;
    constructor(data?: Partial<Escort>);
}
