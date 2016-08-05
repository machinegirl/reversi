import {WebsocketService} from './websocket.service';
import {ReversiService} from './reversi.service';
import { Component, OnInit} from '@angular/core';

@Component({
  selector: 'App',
  template: require('./main.html'),
  providers: [WebsocketService, ReversiService],
})
export class Main implements OnInit {

  constructor(private websocketService: WebsocketService, private reversiService: ReversiService) {
	//   reversiService.gameBoard = gameBoard;
	  console.log("main controller started");
  }

  ngOnInit() {
	  this.websocketService.init();
	  this.reversiService.init();
  }
}
