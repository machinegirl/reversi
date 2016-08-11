import {WebsocketService} from './websocket.service';
import { Component, OnInit} from '@angular/core';

@Component({
  selector: 'App',
  template: require('./main.html'),
  providers: [WebsocketService],
})
export class Main implements OnInit {

  constructor(private websocketService: WebsocketService) {
	//   reversiService.gameBoard = gameBoard;
	  console.log('main controller started');
  }

  ngOnInit() {
	  this.websocketService.init();
  }
}
