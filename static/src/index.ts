/// <reference path="../typings/index.d.ts"/>

import 'reflect-metadata';
import 'zone.js/dist/zone';
import {bootstrap} from '@angular/platform-browser-dynamic';
import {HTTP_PROVIDERS} from '@angular/http';
import {Location} from '@angular/common';

import './index.less';
import './app/main.less';
import './app/play.less';
import './app/dashboard.less';
import './app/header.less';
import './app/player.less';

import {enableProdMode, provide} from '@angular/core';
import {UIRouterConfig, UIROUTER_PROVIDERS, UiView} from 'ui-router-ng2';
import {LocationStrategy, PathLocationStrategy, PlatformLocation} from '@angular/common';
import {BrowserPlatformLocation} from '@angular/platform-browser';
import {MyUIRouterConfig} from './routes';
import {ReversiService} from './app/reversi.service';
import {AUTH_PROVIDERS} from 'angular2-jwt';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';


declare var process: any;
// declare var onSignIn: any;

if (process.env.NODE_ENV === 'production') {
  enableProdMode();
}

bootstrap(UiView, [
  ...UIROUTER_PROVIDERS, HTTP_PROVIDERS, AUTH_PROVIDERS,
  provide(Location, {useClass: Location}),
  provide(ReversiService, {useClass: ReversiService}),
  provide(LocationStrategy, {useClass: PathLocationStrategy}),
  provide(PlatformLocation, {useClass: BrowserPlatformLocation}),
  provide(UIRouterConfig, {useClass: MyUIRouterConfig})
]);
