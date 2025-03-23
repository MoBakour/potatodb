declare module "potatodb" {
    export type GenericObject = Record<string, any>;

    // QUERY AND UPDATE TYPES

    export type TestFunction = (potato: GenericObject) => boolean;
    export type Test = GenericObject | TestFunction;
    export type UpdateFunction = (potato: GenericObject) => GenericObject;
    export type Update = GenericObject | UpdateFunction;
    export type Sorter = GenericObject | ((a: any, b: any) => number);

    // CONFIG TYPES

    export interface RootOptions {
        rootPath?: string;
        rootName?: string;
    }

    export interface DatabaseOptions {
        overwrite?: boolean;
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

    // METHOD TYPES
    export interface InsertOneOptions {
        select?: GenericObject;
        populate?: GenericObject;
    }

    export interface InsertManyOptions {
        sort?: Sorter;
        select?: GenericObject;
        populate?: GenericObject;
    }

    export interface FindOneOptions {
        skip?: number;
        recent?: boolean;
        select?: GenericObject;
        populate?: GenericObject;
    }

    export interface FindManyOptions {
        limit?: number;
        skip?: number;
        recent?: boolean;
        sort?: Sorter;
        select?: GenericObject;
        populate?: GenericObject;
    }

    export interface UpdateOneOptions {
        select?: GenericObject;
        populate?: GenericObject;
        updated?: boolean;
    }

    export interface UpdateManyOptions {
        sort?: Sorter;
        select?: GenericObject;
        populate?: GenericObject;
        updated?: boolean;
    }

    export interface DeleteOneOptions {
        select?: GenericObject;
        populate?: GenericObject;
    }

    export interface DeleteManyOptions {
        sort?: Sorter;
        select?: GenericObject;
        populate?: GenericObject;
    }

    // FUNCTIONS
    export function setRoot(options: RootOptions): void;

    export function createDatabase(
        dbName: string,
        options?: DatabaseOptions
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
        sort(sorter?: ((a: any, b: any) => number) | GenericObject): this;
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

        public insertOne(newData: T): Promise<T>;

        public insertMany(newData: T[]): Promise<T[]>;

        public findOne(
            test?: Test,
            options?: FindOneOptions
        ): Promise<T | null>;

        public findMany(test?: Test, options?: FindManyOptions): Promise<T[]>;

        public updateOne(
            test: Test,
            update: Update,
            options?: UpdateOneOptions
        ): Promise<T | null>;

        public updateMany(
            test: Test,
            update: Update,
            options?: UpdateManyOptions
        ): Promise<T[]>;

        public deleteOne(
            test?: Test,
            options?: DeleteOneOptions
        ): Promise<T | null>;

        public deleteMany(
            test?: Test,
            options?: DeleteManyOptions
        ): Promise<T[]>;

        public exists(test: Test): Promise<boolean>;

        public countPotatoes(test?: Test): Promise<number>;

        public sampleOne(): Promise<T | null>;

        public sampleMany(count: number): Promise<T[]>;

        public sampleManyUnique(count: number): Promise<T[]>;

        public dropFarm(): void;
    }
}
