import { Component, OnInit} from '@angular/core';
import {WebsocketService} from './websocket.service';
import {ReversiService} from './reversi.service';
import {Header} from './header';
import {Player} from './player'

@Component({
  selector: 'Play',
  template: require('./play.html'),
  providers: [ReversiService],
  directives: [Header, Player]
})
export class Play implements OnInit {

  constructor(private websocketService: WebsocketService, private reversiService: ReversiService) {
	  this.websocketService = websocketService;
	  this.reversiService = reversiService;
	//   reversiService.gameBoard = gameBoard;
	  console.log('play controller started');
  }

  ngOnInit() {

	  this.reversiService.init();
	  this.reversiService.newGame();
	  this.reversiService.drawGameBoard(this.reversiService.gameBoard);
  }

  move(e) {
	  console.log(e);
	  let gameBoardLength: number = this.reversiService.gameBoard.length;
	  let tileW = e.srcElement.clientWidth / gameBoardLength;
	  let clickedRow = Math.floor(e.offsetY / tileW);
	  console.log(clickedRow);
	  let clickedTile = Math.floor(e.offsetX / tileW);
	  console.log(clickedTile);
  }
}
