export class SwaggerDefinitions {
    setUpDefinitions() {
        /**
         * @swagger
         * definitions:
         *   FILE_TYPE:
         *     type: Object
         *     properties:
         *       originalImage:
         *         type: string
         *       modifiedImage:
         *         type: string
         *       imageJSON:
         *         type: string
         */
        /**
         * @swagger
         * definitions:
         *   IdMessage:
         *     type: object
         *     properties:
         *       id:
         *         type: number
         */
        /**
         * @swagger
         *
         * definitions:
         *   TimeMessage:
         *     type: object
         *     properties:
         *       time:
         *         type: number
         */
        /**
         * @swagger
         *
         * definitions:
         *   FileTypeMessage:
         *     type: object
         *     properties:
         *       type:
         *         type: FILE_TYPE
         */
        /**
         * @swagger
         *
         * definitions:
         *   GameModeMessage:
         *     type: object
         *     properties:
         *       gameMode:
         *         type: GAME_MODE
         */
        /**
         * @swagger
         *
         * definitions:
         *   ValidityMessage:
         *     type: object
         *     properties:
         *       valid:
         *         type: boolean
         */
        /**
         * @swagger
         *
         * definitions:
         *   UsernameMessage:
         *     type: object
         *     properties:
         *       username:
         *         type: string
         *       id:
         *         type: number
         */
        /**
         * @swagger
         *
         * definitions:
         *   UsernameMessageWithTime:
         *     type: object
         *     properties:
         *       username:
         *         type: string
         *       id:
         *         type: number
         *       time:
         *         type: number
         */
        /**
         * @swagger
         *
         * definitions:
         *   UsernameMessageWithGameMode:
         *     type: object
         *     properties:
         *       username:
         *         type: string
         *       id:
         *         type: number
         *       gameMode:
         *         type: GAME_MODE
         */
        /**
         * @swagger
         *
         * definitions:
         *   UsernameMessageWithTimeAndGameMode:
         *     type: object
         *     properties:
         *       username:
         *         type: string
         *       id:
         *         type: number
         *       time:
         *         type: number
         *       gameMode:
         *         type: GAME_MODE
         */
        /**
         * @swagger
         *
         * definitions:
         *   UsernameMessageWithGameModeAndActivity:
         *     type: object
         *     properties:
         *       username:
         *         type: string
         *       id:
         *         type: number
         *       active:
         *         type: boolean
         *       gameMode:
         *         type: GAME_MODE
         */
        /**
         * @swagger
         *
         * definitions:
         *   UsernameMessageWithTimeGameModeAndActivity:
         *     type: object
         *     properties:
         *       username:
         *         type: string
         *       id:
         *         type: number
         *       time:
         *         type: number
         *       active:
         *         type: boolean
         *       gameMode:
         *         type: GAME_MODE
         */
        /**
         * @swagger
         *
         * definitions:
         *   ValidMoveResponseMessage:
         *     type: object
         *     properties:
         *       valid:
         *         type: boolean
         *       difference:
         *         type: Difference
         */
        /**
         * @swagger
         *
         * definitions:
         *   StorageMessageWithId:
         *     type: object
         *     properties:
         *       id:
         *         type: number
         */
        /**
         * @swagger
         *
         * definitions:
         *   StorageMessageWithType:
         *     type: object
         *     properties:
         *       type:
         *         type: FILE_TYPE
         */
        /**
         * @swagger
         *
         * definitions:
         *   StorageMessageWithIdAndType:
         *     type: object
         *     properties:
         *       id:
         *         type: number
         *       type:
         *         type: FILE_TYPE
         */
        /**
         * @swagger
         *
         * definitions:
         *   StorageMessageWithIdTypeAndData:
         *     type: object
         *     properties:
         *       id:
         *         type: number
         *       type:
         *         type: FILE_TYPE
         *       data:
         *         type: string
         */
        /**
         * @swagger
         *
         * definitions:
         *   StorageMessageNewGame:
         *     type: object
         *     properties:
         *       originalImageData:
         *         type: string
         *       modifiedImageData:
         *         type: string
         *       imageJSON:
         *         type: string
         */
        /**
         * @swagger
         *
         * definitions:
         *   ValidIdsMessage:
         *     type: object
         *     properties:
         *       validIds:
         *         type: number[]
         */
        /**
         * @swagger
         *
         * definitions:
         *   AllUsernamesMessage:
         *     type: object
         *     properties:
         *       usernames:
         *         type: UsernamesObject[]
         */
        /**
         * @swagger
         *
         * definitions:
         *   IsUsernameAvailableMessage:
         *     type: object
         *     properties:
         *       valid:
         *         type: boolean
         */
    }
}
