export declare enum StorageFolder {
    AVATARS = "avatars",
    SPACE_LOGOS = "space-logos",
    SPACE_BANNERS = "space-banners"
}
export declare class UploadFileDto {
    folder: StorageFolder;
    fileName?: string;
    contentType?: string;
}
export declare class GetPresignedUrlDto {
    folder: StorageFolder;
    fileName: string;
    contentType?: string;
}
