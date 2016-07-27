/// <reference path="../typings/index.d.ts"/>

import {Injectable} from '@angular/core';
import {UIRouter} from 'ui-router-ng2/router';
import {Hello} from './app/hello';

const INITIAL_STATES: any[] = [
  {name: 'App', url: '/', component: Hello}
];

@Injectable()
export class MyUIRouterConfig {
  configure(uiRouter: UIRouter) {
    uiRouter.urlRouterProvider.otherwise(() => uiRouter.stateService.go('App', null, null));
    uiRouter.stateRegistry.root();
    INITIAL_STATES.forEach(state => uiRouter.stateRegistry.register(state));
  }
}
