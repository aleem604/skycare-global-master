import { Binding, Booter } from '@loopback/boot';
import { ApplicationConfig } from '@loopback/core';
import { Provider } from '@loopback/context';
import { RestApplication } from '@loopback/rest';
import { Class } from '@loopback/service-proxy';
import { HttpServer } from '@loopback/http-server';
import { Repository } from '@loopback/repository';
import { DataSource } from 'loopback-datasource-juggler';
import { WebSocketServer } from './websocket.server';
declare const ServerApplication_base: (new (...args: any[]) => {
    [x: string]: any;
    projectRoot: string;
    bootOptions?: import("@loopback/boot").BootOptions | undefined;
    boot(): Promise<void>;
    booters(...booterCls: import("@loopback/core").Constructor<Booter>[]): Binding<any>[];
    component(component: import("@loopback/core").Constructor<{}>): void;
    mountComponentBooters(component: import("@loopback/core").Constructor<{}>): void;
}) & (new (...args: any[]) => {
    [x: string]: any;
    serviceProvider<S>(provider: Class<Provider<S>>, name?: string | undefined): Binding<S>;
    component(component: Class<unknown>, name?: string | undefined): void;
    mountComponentServices(component: Class<unknown>): void;
}) & (new (...args: any[]) => {
    [x: string]: any;
    repository<R extends Repository<any>>(repoClass: import("@loopback/repository").Class<R>, name?: string | undefined): Binding<R>;
    getRepository<R_1 extends Repository<any>>(repo: import("@loopback/repository").Class<R_1>): Promise<R_1>;
    dataSource<D extends DataSource>(dataSource: D | import("@loopback/repository").Class<D>, name?: string | undefined): Binding<D>;
    component(component: import("@loopback/repository").Class<unknown>, name?: string | undefined): void;
    mountComponentRepositories(component: import("@loopback/repository").Class<unknown>): void;
    migrateSchema(options?: import("@loopback/repository").SchemaMigrationOptions | undefined): Promise<void>;
}) & typeof RestApplication;
export declare class ServerApplication extends ServerApplication_base {
    httpServer: HttpServer;
    wsServer: WebSocketServer;
    constructor(options?: ApplicationConfig);
    configureRESTServer(options: ApplicationConfig): void;
    configureWSServer(options: ApplicationConfig): void;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export {};
