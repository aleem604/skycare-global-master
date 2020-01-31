
export interface Filter { 
    where?: any;
    fields?: any;
    offset?: number;
    limit?: number;
    skip?: number;
    order?: Array<string>;
}