import { StorageFolder } from './upload-file.dto';
export declare class RenameFileDto {
    folder: StorageFolder;
    oldFileName: string;
    newFileName: string;
}
export declare class DeleteFileDto {
    folder: StorageFolder;
    fileName: string;
}
export declare class ListFilesDto {
    folder: StorageFolder;
}
export declare class GetFileDto {
    folder: StorageFolder;
    fileName: string;
}
