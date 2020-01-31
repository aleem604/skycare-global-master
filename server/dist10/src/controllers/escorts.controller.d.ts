import { Filter } from '@loopback/repository';
import { UserProfile } from '@loopback/authentication';
import { Escort, EscortLocation, CompanyCase, GPSPoint } from '../models';
import { EscortRepository, UserRepository, CompanyCaseRepository } from '../repositories';
import { Configuration } from '@cloudant/cloudant';
import { Response } from 'express-serve-static-core';
export declare class EscortsController {
    private user;
    private dsConfig;
    escortRepository: EscortRepository;
    userRepository: UserRepository;
    companyCaseRepository: CompanyCaseRepository;
    constructor(user: UserProfile, dsConfig: Configuration, escortRepository: EscortRepository, userRepository: UserRepository, companyCaseRepository: CompanyCaseRepository);
    find(filter?: Filter): Promise<Escort[]>;
    updateById(escortID: string, escort: Escort): Promise<boolean>;
    addEscortTrackingLocation(credentials: string, escortID: string, escortLocation: EscortLocation, response: Response): Promise<boolean>;
    getFlightTrackingCoordinates(flightNumber: string): Promise<GPSPoint>;
    determineTrackingStage(currentCase: CompanyCase): string;
    degreesToRadians(degrees: number): number;
    calculateGPSDistance(origin: GPSPoint, dest: GPSPoint): number;
}
