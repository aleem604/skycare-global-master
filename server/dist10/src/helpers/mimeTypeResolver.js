"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MimeTypeResolver {
    constructor() { }
    static resolveMimeType(filename) {
        // Extract the file extension from the filename
        let fileExtensionStartIndex = filename.lastIndexOf('.');
        if (fileExtensionStartIndex == -1) {
            return MimeTypeResolver.unknownDefinition.mimeType;
        }
        let fileExtension = filename.substr(fileExtensionStartIndex).toLowerCase();
        // Search the known definitions for the file extension
        let discoveredMimeTypeIndex = MimeTypeResolver.definitions.findIndex((value, index, list) => {
            return value.fileExtensions.some((exValue, exIndex, exList) => exValue == fileExtension);
        });
        if (discoveredMimeTypeIndex > -1) {
            return MimeTypeResolver.definitions[discoveredMimeTypeIndex].mimeType;
        }
        else {
            // If we didn't find anything use the unknown definition
            return MimeTypeResolver.unknownDefinition.mimeType;
        }
    }
}
MimeTypeResolver.definitions = [
    {
        fileExtensions: ['.aac'],
        mimeType: 'audio/aac',
        description: 'AAC audio'
    }, {
        fileExtensions: ['.abw'],
        mimeType: 'application/x-abiword',
        description: 'AbiWord document'
    }, {
        fileExtensions: ['.arc'],
        mimeType: 'application/octet-stream',
        description: 'Archive document (multiple files embedded)'
    }, {
        fileExtensions: ['.avi'],
        mimeType: 'video/x-msvideo',
        description: 'AVI: Audio Video Interleave'
    }, {
        fileExtensions: ['.azw'],
        mimeType: 'application/vnd.amazon.ebook',
        description: 'Amazon Kindle eBook format'
    }, {
        fileExtensions: ['.bin'],
        mimeType: 'application/octet-stream',
        description: 'Any kind of binary data'
    }, {
        fileExtensions: ['.bmp'],
        mimeType: 'image/bmp',
        description: 'Windows OS/2 Bitmap Graphics'
    }, {
        fileExtensions: ['.bz'],
        mimeType: 'application/x-bzip',
        description: 'BZip archive'
    }, {
        fileExtensions: ['.bz2'],
        mimeType: 'application/x-bzip2',
        description: 'BZip2 archive'
    }, {
        fileExtensions: ['.csh'],
        mimeType: 'application/x-csh',
        description: 'C-Shell script'
    }, {
        fileExtensions: ['.css'],
        mimeType: 'text/css',
        description: 'Cascading Style Sheets (CSS)'
    }, {
        fileExtensions: ['.csv'],
        mimeType: 'text/csv',
        description: 'Comma-separated values (CSV)'
    }, {
        fileExtensions: ['.doc'],
        mimeType: 'application/msword',
        description: 'Microsoft Word'
    }, {
        fileExtensions: ['.docx'],
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        description: 'Microsoft Word (OpenXML)'
    }, {
        fileExtensions: ['.eot'],
        mimeType: 'application/vnd.ms-fontobject',
        description: 'MS Embedded OpenType fonts'
    }, {
        fileExtensions: ['.epub'],
        mimeType: 'application/epub+zip',
        description: 'Electronic publication (EPUB)'
    }, {
        fileExtensions: ['.es'],
        mimeType: 'application/ecmascript',
        description: 'ECMAScript (IANA Specification) (RFC 4329 Section 8.2)'
    }, {
        fileExtensions: ['.gif'],
        mimeType: 'image/gif',
        description: 'Graphics Interchange Format (GIF)'
    }, {
        fileExtensions: ['.htm', '.html'],
        mimeType: 'text/html',
        description: 'HyperText Markup Language (HTML)'
    }, {
        fileExtensions: ['.ico'],
        mimeType: 'image/x-icon',
        description: 'Icon format'
    }, {
        fileExtensions: ['.ics'],
        mimeType: 'text/calendar',
        description: 'iCalendar format'
    }, {
        fileExtensions: ['.jar'],
        mimeType: 'application/java-archive',
        description: 'Java Archive (JAR)'
    }, {
        fileExtensions: ['.jpeg', '.jpg'],
        mimeType: 'image/jpeg',
        description: 'JPEG images'
    }, {
        fileExtensions: ['.js'],
        mimeType: 'application/javascript',
        description: 'JavaScript (IANA Specification) (RFC 4329 Section 8.2)'
    }, {
        fileExtensions: ['.json'],
        mimeType: 'application/json',
        description: 'JSON format'
    }, {
        fileExtensions: ['.mid', '.midi'],
        mimeType: 'audio/midi',
        description: 'Musical Instrument Digital Interface (MIDI)'
    }, {
        fileExtensions: ['.mpeg', '.mpg', '.mp4', '.mpv'],
        mimeType: 'video/mpeg',
        description: 'MPEG Video'
    }, {
        fileExtensions: ['.mpkg'],
        mimeType: 'application/vnd.apple.installer+xml',
        description: 'Apple Installer Package'
    }, {
        fileExtensions: ['.odp'],
        mimeType: 'application/vnd.oasis.opendocument.presentation',
        description: 'OpenDocument presentation document'
    }, {
        fileExtensions: ['.ods'],
        mimeType: 'application/vnd.oasis.opendocument.spreadsheet',
        description: 'OpenDocument spreadsheet document'
    }, {
        fileExtensions: ['.odt'],
        mimeType: 'application/vnd.oasis.opendocument.text',
        description: 'OpenDocument text document'
    }, {
        fileExtensions: ['.oga'],
        mimeType: 'audio/ogg',
        description: 'OGG audio'
    }, {
        fileExtensions: ['.ogv'],
        mimeType: 'video/ogg',
        description: 'OGG video'
    }, {
        fileExtensions: ['.ogx'],
        mimeType: 'application/ogg',
        description: 'OGG'
    }, {
        fileExtensions: ['.otf'],
        mimeType: 'font/otf',
        description: 'OpenType font'
    }, {
        fileExtensions: ['.png'],
        mimeType: 'image/png',
        description: 'Portable Network Graphics'
    }, {
        fileExtensions: ['.pdf'],
        mimeType: 'application/pdf',
        description: 'Adobe Portable Document Format (PDF)'
    }, {
        fileExtensions: ['.ppt'],
        mimeType: 'application/vnd.ms-powerpoint',
        description: 'Microsoft PowerPoint'
    }, {
        fileExtensions: ['.pptx'],
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        description: 'Microsoft PowerPoint (OpenXML)'
    }, {
        fileExtensions: ['.rar'],
        mimeType: 'application/x-rar-compressed',
        description: 'RAR archive'
    }, {
        fileExtensions: ['.rtf'],
        mimeType: 'application/rtf',
        description: 'Rich Text Format (RTF)'
    }, {
        fileExtensions: ['.sh'],
        mimeType: 'application/x-sh',
        description: 'Bourne shell script'
    }, {
        fileExtensions: ['.svg'],
        mimeType: 'image/svg+xml',
        description: 'Scalable Vector Graphics (SVG)'
    }, {
        fileExtensions: ['.swf'],
        mimeType: 'application/x-shockwave-flash',
        description: 'Small web format (SWF) or Adobe Flash document'
    }, {
        fileExtensions: ['.tar'],
        mimeType: 'application/x-tar',
        description: 'Tape Archive (TAR)'
    }, {
        fileExtensions: ['.tif', '.tiff'],
        mimeType: 'image/tiff',
        description: 'Tagged Image File Format (TIFF)'
    }, {
        fileExtensions: ['.ts'],
        mimeType: 'application/typescript',
        description: 'Typescript file'
    }, {
        fileExtensions: ['.ttf'],
        mimeType: 'font/ttf',
        description: 'TrueType Font'
    }, {
        fileExtensions: ['.txt'],
        mimeType: 'text/plain',
        description: 'Text, (generally ASCII or ISO 8859-n)'
    }, {
        fileExtensions: ['.vsd'],
        mimeType: 'application/vnd.visio',
        description: 'Microsoft Visio'
    }, {
        fileExtensions: ['.wav'],
        mimeType: 'audio/wav',
        description: 'Waveform Audio Format'
    }, {
        fileExtensions: ['.weba'],
        mimeType: 'audio/webm',
        description: 'WEBM audio'
    }, {
        fileExtensions: ['.webm'],
        mimeType: 'video/webm',
        description: 'WEBM video'
    }, {
        fileExtensions: ['.webp'],
        mimeType: 'image/webp',
        description: 'WEBP image'
    }, {
        fileExtensions: ['.woff'],
        mimeType: 'font/woff',
        description: 'Web Open Font Format (WOFF)'
    }, {
        fileExtensions: ['.woff2'],
        mimeType: 'font/woff2',
        description: 'Web Open Font Format (WOFF)'
    }, {
        fileExtensions: ['.xhtml'],
        mimeType: 'application/xhtml+xml',
        description: 'XHTML'
    }, {
        fileExtensions: ['.xls'],
        mimeType: 'application/vnd.ms-excel',
        description: 'Microsoft Excel'
    }, {
        fileExtensions: ['.xlsx'],
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        description: 'Microsoft Excel (OpenXML)'
    }, {
        fileExtensions: ['.xml'],
        mimeType: 'application/xml',
        description: 'XML'
    }, {
        fileExtensions: ['.xul'],
        mimeType: 'application/vnd.mozilla.xul+xml',
        description: 'XUL'
    }, {
        fileExtensions: ['.zip'],
        mimeType: 'application/zip',
        description: 'ZIP archive'
    }, {
        fileExtensions: ['.3gp'],
        mimeType: 'audio/3gpp',
        description: '3GPP audio/video container'
    }, {
        fileExtensions: ['.3g2'],
        mimeType: 'audio/3gpp2',
        description: '3GPP2 audio/video container'
    }, {
        fileExtensions: ['.7z'],
        mimeType: 'application/x-7z-compressed',
        description: '7-zip archive'
    }
];
MimeTypeResolver.unknownDefinition = {
    fileExtensions: [''],
    mimeType: 'application/octet-stream',
    description: 'Generic Binary Data'
};
exports.MimeTypeResolver = MimeTypeResolver;
//# sourceMappingURL=mimeTypeResolver.js.map