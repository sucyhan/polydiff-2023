import { FILE_TYPE } from './constants';
import { Difference, UsernamesObject } from './interfaces';

export interface IdMessage {
    id: number;
}
export interface TimeMessage {
    time: number;
}

export interface FileTypeMessage {
    type: FILE_TYPE;
}

export interface ValidityMessage {
    valid: boolean;
}

export interface UsernameMessage {
    username: string;
    id: number;
}

export interface UsernameMessageWithTime extends UsernameMessage, TimeMessage {}

export interface ValidMoveResponseMessage extends ValidityMessage {
    difference?: Difference;
}

export interface StorageMessageWithId extends IdMessage {}

export interface StorageMessageWithType extends FileTypeMessage {}

export interface StorageMessageWithIdAndType extends StorageMessageWithId, StorageMessageWithType {}

export interface StorageMessageWithIdTypeAndData extends StorageMessageWithIdAndType {
    data: string;
}
export interface StorageMessageNewGame {
    originalImageData: string;
    modifiedImageData: string;
    imageJSON: string;
}

export interface ValidIdsMessage {
    validIds: number[];
}

export interface AllUsernamesMessage {
    usernames: UsernamesObject[];
}

export interface IsUsernameAvailableMessage extends ValidityMessage {}
