// /// <reference path="../../typings/index.d.ts"/>
//
// import 'reflect-metadata';
// import 'zone.js/dist/zone';
// import 'zone.js/dist/async-test';
// import 'rxjs/add/operator/map';
// import 'rxjs/add/operator/catch';
// import {Main} from './main';                        // Import the Component we want to test
// import {ReversiService} from './reversi.service';   // Import any services which our component depends on.
// import {HTTP_PROVIDERS} from '@angular/http';
// import {inject, async, setBaseTestProviders, TestComponentBuilder, ComponentFixture, beforeEachProviders} from '@angular/core/testing';
// import {TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS, TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS} from '@angular/platform-browser-dynamic/testing';
//
// setBaseTestProviders(TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS, TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS);
//
// describe('main component', () => {  // Enter something descriptive here about this set of tests.
//     beforeEachProviders(()=> [
//         HTTP_PROVIDERS,
//         ReversiService
//     ]);
//   it('should list the correct authors', async(inject([TestComponentBuilder, ReversiService], (tcb, reversiService) => {   // A test. Write something descriptive about it.
//     tcb.createAsync(Main)   // Put the component here.
//       .then((fixture: ComponentFixture<any>) => {
//         return new Promise((pass, fail) => {
//             reversiService.init(() => {
//                 const hello = fixture.nativeElement;    // Get content from the Component.
//                 expect(hello.querySelector('p').textContent).toBe('by machinegirl and Defcronyk'); // Make a test assertion here.
//             });
//         });
//       });
//   })));
// });
