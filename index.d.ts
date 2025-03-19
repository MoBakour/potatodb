declare module "potatodb" {
    // INTERFACES & TYPES
    export interface RootOptions {
        rootPath?: string;
        rootName?: string;
    }

    export interface FarmOptions {
        _id?: boolean;
        timestamps?: boolean;
    }

    interface WithId {
        _id?: string;
    }

    interface WithTimestamps {
        createdAt?: number;
        updatedAt?: number;
    }

    export interface PreFindInterceptorOptions {
        recent?: boolean;
        skip?: number;
    }

    export interface PostFindInterceptorOptions {
        limit?: number;
        sort?: Object;
        select?: Object;
        populate?: Object;
    }

    export interface PostUpdateInterceptorOptions {
        sort?: Object;
        select?: Object;
        populate?: Object;
    }

    export type FindOptions = PreFindInterceptorOptions &
        PostFindInterceptorOptions;

    export type UpdateOptions = PostUpdateInterceptorOptions & {
        updated?: boolean;
    };

    export type DeleteOptions = { select?: Object };

    // FUNCTIONS
    export function setRoot(options: RootOptions): void;

    export function createDatabase(
        dbName: string,
        overwrite?: boolean
    ): PotatoDB;

    // CLASSES

    export class PotatoDB {
        public dbRoot: string;
        public dbPath: string;
        public dbName: string;
        public farms: string[];
        public overwrite: boolean;

        constructor(dbName: string, overwrite: boolean);

        public createFarm<T>(
            farmName: string,
            options?: { _id?: true; timestamps?: false }
        ): Farm<T & WithId>;

        public createFarm<T>(
            farmName: string,
            options?: { _id?: true; timestamps?: true }
        ): Farm<T & WithId & WithTimestamps>;

        public createFarm<T>(
            farmName: string,
            options?: { _id?: false; timestamps?: false }
        ): Farm<T>;

        public createFarm<T>(
            farmName: string,
            options?: { _id?: false; timestamps?: true }
        ): Farm<T & WithTimestamps>;

        public dropDatabase(): void;
    }

    export class PotatoArray extends Array {
        sort(sorter?: ((a: any, b: any) => number) | Function): this;
    }

    export class PotatoId {
        public _id: string;
    }

    export class PotatoTimestamps {
        public createdAt: number;
        public updatedAt: number;
    }

    export class PotatoError extends Error {
        public name: "PotatoError";
    }

    export class Farm<T> {
        public farmName: string;
        public farmPath: string;
        public dbName: string;
        public _id: boolean;
        public timestamps: boolean;

        constructor(
            farmName: string,
            farmPath: string,
            dbName: string,
            _id: boolean,
            timestamps: boolean
        );

        private static nestedUpdate(
            object: Object,
            path: string,
            val: any
        ): void;

        private static transform(test: Object | Function): Function;

        private static validateQuery(
            caller: string,
            test: Object | Function
        ): Object;

        private getData(): Promise<Object[]>;

        private static preInterceptor(
            data: Object[],
            options?: PreFindInterceptorOptions
        ): Object[];

        private static postInterceptor(
            caller: string,
            result: Object | Object[],
            options?: PostFindInterceptorOptions | PostUpdateInterceptorOptions
        ): Promise<Object | Object[]>;

        public dropFarm(): void;

        public countPotatoes(): Promise<number>;

        private insertLogic(
            caller: "insertOne" | "insertMany",
            newData: T | T[]
        ): Promise<T | T[]>;

        public insertOne(newData: T): Promise<T>;

        public insertMany(newData: T[]): Promise<T[]>;

        private findLogic(
            caller: "findOne" | "findMany",
            test?: Object | Function,
            options?: FindOptions
        ): Promise<T | T[] | null>;

        public findOne(
            test?: Object | Function,
            options?: FindOptions
        ): Promise<T | null>;

        public findMany(
            test?: Object | Function,
            options?: FindOptions
        ): Promise<T[]>;

        private updateLogic(
            caller: "updateOne" | "updateMany",
            test: Object | Function,
            update: Object | Function,
            options?: UpdateOptions
        ): Promise<T | T[] | null>;

        public updateOne(
            test: Object | Function,
            update: Object | Function,
            options?: UpdateOptions
        ): Promise<T | null>;

        public updateMany(
            test: Object | Function,
            update: Object | Function,
            options?: UpdateOptions
        ): Promise<T[]>;

        private deleteLogic(
            caller: "deleteOne" | "deleteMany",
            test?: Object | Function,
            options?: DeleteOptions
        ): Promise<T | T[] | null>;

        public deleteOne(
            test?: Object | Function,
            options?: DeleteOptions
        ): Promise<T | null>;

        public deleteMany(
            test?: Object | Function,
            options?: DeleteOptions
        ): Promise<T[]>;

        public exists(test: Object | Function): Promise<boolean>;

        public sampleOne(): Promise<T | null>;

        public sampleMany(count: number): Promise<T[]>;

        public sampleManyUnique(count: number): Promise<T[]>;
    }
}
