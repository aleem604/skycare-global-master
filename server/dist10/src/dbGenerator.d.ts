import { DataSource } from '@loopback/repository';
import { ServerApplication } from './index';
export declare function createDB(app: ServerApplication): Promise<void>;
export declare function finishCreatingDB(app: ServerApplication, ds: DataSource, repository: any, modelName: string): Promise<void>;
export declare function updateDB(app: ServerApplication): Promise<void>;
