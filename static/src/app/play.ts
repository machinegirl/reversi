import { Component, OnInit} from '@angular/core';
import {WebsocketService} from './websocket.service';
import {ReversiService} from './reversi.service';

@Component({
  selector: 'Play',
  template: require('./play.html'),
  providers: [WebsocketService, ReversiService],
})
export class Play implements OnInit {

  constructor(private websocketService: WebsocketService, private reversiService: ReversiService) {
	  this.websocketService = websocketService;
	  this.reversiService = reversiService;
	//   reversiService.gameBoard = gameBoard;
	  console.log('play controller started');
  }

  ngOnInit() {
	  this.websocketService.init();
	  this.reversiService.init();
  }
}
