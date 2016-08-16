import {Component, OnInit} from '@angular/core';
import {WebsocketService} from './websocket.service';

@Component({
  selector: 'Header',
  template: require('./header.html'),
  providers: []
})
export class Header implements OnInit {

	constructor(private websocketService: WebsocketService) {
		this.websocketService = websocketService;
	}

	ngOnInit() {
		this.websocketService.init();
	}
}
