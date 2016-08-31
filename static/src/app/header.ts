import {Component, OnInit} from '@angular/core';
// import {WebsocketService} from './websocket.service';

@Component({
  selector: 'Header',
  template: require('./header.html'),
  providers: []
})
export class Header implements OnInit {

	constructor() {
		// this.websocketService = websocketService;
	}

	ngOnInit() {
		// this.websocketService.init();
	}
}
