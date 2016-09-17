/// <reference path="../../typings/index.d.ts"/>

import 'reflect-metadata';
import 'zone.js/dist/zone';
import 'zone.js/dist/async-test';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import {ReversiService} from './reversi.service';
import {HTTP_PROVIDERS} from '@angular/http';
import {inject, async, setBaseTestProviders, TestComponentBuilder, ComponentFixture, beforeEachProviders} from '@angular/core/testing';
import {TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS, TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS} from '@angular/platform-browser-dynamic/testing';

setBaseTestProviders(TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS, TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS);

describe('reversi service', () => {

    beforeEachProviders(()=> [
        HTTP_PROVIDERS,
        ReversiService
    ]);

    beforeEach((done) => {

        jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 6;

        inject([ReversiService], (reversiService) => {
            this.reversiService = reversiService;
            this.reversiService.init(() => {
                done();
            });
        })();
    });

    describe('play', () => {

        it('should return true', () => {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 10;
            expect(true).toBe(true);
        });
    });
});
