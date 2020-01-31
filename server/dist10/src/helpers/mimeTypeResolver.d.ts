export interface MimeTypeDefinition {
    fileExtensions: string[];
    mimeType: string;
    description: string;
}
export declare class MimeTypeResolver {
    constructor();
    static definitions: MimeTypeDefinition[];
    static unknownDefinition: MimeTypeDefinition;
    static resolveMimeType(filename: string): string;
}
