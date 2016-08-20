import {Component, OnInit} from '@angular/core';
import {WebsocketService} from './websocket.service';


@Component({
  selector: 'Popup',
  template: require('./popup.html'),
  providers: []
})
export class Popup implements OnInit {

	public dot1 = true;
	public dot2 = true;
	public dot3 = true;

	constructor(private websocketService: WebsocketService) {
		this.websocketService = websocketService;
	}

	ngOnInit() {
		window.setInterval((function() {
			this.dot1 = !this.dot1;
		}).bind(this), 1000);
		window.setInterval((function() {
			this.dot1 = !this.dot1;
		}).bind(this), 1250);
		window.setInterval((function() {
			this.dot1 = !this.dot1;
		}).bind(this), 1500);

	}
}
