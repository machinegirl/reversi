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

describe('reversi service', () => {  // Enter something descriptive here about this set of tests.

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
    beforeEachProviders(()=> [
        HTTP_PROVIDERS
    ]);

    beforeEach((done) => {
        inject([ReversiService], (_reversiService_) => {
            this.reversiService = _reversiService_;
            this.reversiService.init(() => {
                done();
            });
        });
    });

    describe('play', () => {


        it('should return true', () => {
            expect(true).toBe(true);
        });
    });
  // it('should list the correct authors', async(inject([TestComponentBuilder, ReversiService], (tcb, reversiService) => {   // A test. Write something descriptive about it.
  //   tcb.createAsync(Main)   // Put the component here.
  //     .then((fixture: ComponentFixture<any>) => {
  //       return new Promise((pass, fail) => {
  //           reversiService.init(() => {
  //               const hello = fixture.nativeElement;    // Get content from the Component.
  //               expect(hello.querySelector('p').textContent).toBe('by machinegirl and Defcronyk'); // Make a test assertion here.
  //           });
  //       });
  //     });
  // })));
});
