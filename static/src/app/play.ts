import { Component, OnInit} from '@angular/core';
import {WebsocketService} from './websocket.service';
import {ReversiService} from './reversi.service';
import {Header} from './header';
import {Player} from './player';

// declare var pubnub: any;
declare var PubNub: any;

@Component({
  selector: 'Play',
  template: require('./play.html'),
  providers: [],
  directives: [Header, Player]
})
export class Play implements OnInit {

  pubnub: any;

  constructor(private websocketService: WebsocketService, private reversiService: ReversiService) {
	  this.websocketService = websocketService;
	  this.reversiService = reversiService;
	//   reversiService.gameBoard = gameBoard;
	  console.log('play controller started');
  }

  ngOnInit() {
	  let id = window.location.search;
	  let idLength: number = id.length;
	  id = id.substring(4, idLength);
	  let intHandle = window.setInterval((function() {
		  if (typeof this.websocketService !== 'undefined' && typeof this.websocketService.sock !== 'undefined' && this.websocketService.sock.readyState === 1) {
			  this.reversiService.loadGame(id);

			  window.clearInterval(intHandle);
		  }
	  }).bind(this), 500);
	//   this.reversiService.drawGameBoard(this.reversiService.gameBoard);
  }

  move(e) {
	//   console.log(e);
	let gameBoardLength: number = this.reversiService.game.board.length;
	let tileW = e.srcElement.clientWidth / gameBoardLength;
	let clickedRow = Math.floor(e.offsetY / tileW);
	let clickedColumn = Math.floor(e.offsetX / tileW);
	let clickedTile = this.reversiService.game.board[clickedRow][clickedColumn];
	if (clickedTile !== 0) {
	  console.log('invalid move: you must click on an empty tile');
	  return;
	}
	// check if it's your turn
	if (!this.reversiService.checkTurn()) {
		// console.log('not your turn');
		return;
	}
	// console.log('its your turn!');

	let moveCheck = this.reversiService.checkMove(clickedRow, clickedColumn);
  if (moveCheck) {
    console.log('valid move');
    this.reversiService.drawGameBoard(this.reversiService.game.board);
  } else {
    console.log('invalid move');
  }
  }

  // A PubNub example.
  pubHello() {
    this.pubnub = new PubNub({
        publishKey : 'pub-c-779adc9c-2600-4670-a447-40cb9e89c065',
        subscribeKey : 'sub-c-190b1168-6cc7-11e6-b0c8-02ee2ddab7fe'
    });

    var publishSampleMessage = (function() {
        console.log('Since we\'re publishing on subscribe connectEvent, we\'re sure we\'ll receive the following publish.');
        var publishConfig = {
            channel : 'Channel-r9gytcboy',
            message : 'Hello from PubNub Docs!'
        };
        this.pubnub.publish(publishConfig, function(status, response) {
            console.log(status, response);
        });
    }).bind(this);

    this.pubnub.addListener({
        status: function(statusEvent) {
            if (statusEvent.category === 'PNConnectedCategory') {
                publishSampleMessage();
            }
        },
        message: function(message) {
            console.log('New Message!!', message);
        },
        presence: function(presenceEvent) {
            // handle presence
        }
    });
    console.log('Subscribing..');
    this.pubnub.subscribe({
        channels: ['Channel-r9gytcboy']
    });
  }
}
