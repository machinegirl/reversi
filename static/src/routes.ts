/// <reference path="../typings/index.d.ts"/>

import {Injectable} from '@angular/core';
import {UIRouter} from 'ui-router-ng2/router';
import {Main} from './app/main';
import {Play} from './app/play';
import {Dashboard} from './app/dashboard'

const INITIAL_STATES: any[] = [
  {name: 'App', url: '/', component: Main},
  {name: 'Play', url: '/play', component: Play},
  {name: 'Dashboard', url: '/dashboard', component: Dashboard}
];

@Injectable()
export class MyUIRouterConfig {
  configure(uiRouter: UIRouter) {
    uiRouter.urlRouterProvider.otherwise(() => uiRouter.stateService.go('App', null, null));
    uiRouter.stateRegistry.root();
    INITIAL_STATES.forEach(state => uiRouter.stateRegistry.register(state));
  }
}
