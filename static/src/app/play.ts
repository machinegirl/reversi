import { Component, OnInit} from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import {WebsocketService} from './websocket.service';
import {ReversiService} from './reversi.service';
import {Header} from './header';
import {Player} from './player';
import { Observable } from 'rxjs/Observable';

declare var PubNub: any;

@Component({
  selector: 'Play',
  template: require('./play.html'),
  providers: [],
  directives: [Header, Player]
})
export class Play implements OnInit {

  pubnub: any;

  constructor(private websocketService: WebsocketService, private reversiService: ReversiService, private http: Http) {
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
    let game = this.reversiService.game;
    if (moveCheck) {
      console.log('valid move');
      game.board[clickedRow][clickedColumn] = game.player_turn + 1;
      game.pieces[game.player_turn] = game.pieces[game.player_turn] - 1;
      game.player_turn = (game.player_turn + 1) % 2;

      // this.reversiService.drawGameBoard(this.reversiService.game.board);
      let sendMsgIntHandle =  window.setInterval((function() {
        let idToken = localStorage.getItem('google_id_token');
        if (typeof this.websocketService !== 'undefined' && typeof this.websocketService.sock !== 'undefined' && this.websocketService.sock.readyState === 1) {
          this.websocketService.sock.send(JSON.stringify({
            'cmd': 'check_move',
            'id_token': idToken,
            'id': 'azx',
            'game': this.reversiService.game
          }));

          window.clearInterval(sendMsgIntHandle);
         } else {
           //do nothing
         }
       }).bind(this), 500);

    } else {
      console.log('invalid move');
    }
  }

  // A pubnub example.
  pubNubHello() {
    this.pubnub = new PubNub({
            publishKey : 'pub-c-92aab6bf-88ba-4ebc-a6b2-298484763e5d',
            subscribeKey : 'sub-c-ee9c502c-6e51-11e6-92a0-02ee2ddab7fe'
        });

        let publishMessage = (function() {
            console.log('Since we\'re publishing on subscribe connectEvent, we\'re sure we\'ll receive the following publish.');
            var publishConfig = {
                channel : 'Channel-reversi-system',
                message : 'Hello!'
            };
            this.pubnub.publish(publishConfig, function(status, response) {
                console.log(status, response);
            });
        }).bind(this);

        this.pubnub.addListener({
            status: (function(statusEvent) {
                if (statusEvent.category === 'PNConnectedCategory') {
                    // publishMessage();
                }
            }).bind(this),
            message: (function(message) {
                console.log('New Message!!', message);
            }).bind(this),
            presence: (function(presenceEvent) {
                // handle presence
            }).bind(this)
        });
        console.log('Subscribing..');
        this.pubnub.subscribe({
            channels: ['Channel-reversi-system']
        });

        let body = JSON.stringify({ 'message': 'Hey buddy' });
        let headers = new Headers({ 'X-Api-Key': '6Tairgv32oa3OCOpcY0dP6YgyGKt2Fge2TTDPOP5'});
        let options = new RequestOptions({ headers: headers });

        let response = this.http.post('https://teddo46zcb.execute-api.us-east-1.amazonaws.com/prod/pubnub_example2', body, options)
          .map(function(res: Response) {
            console.log('response:');
            console.log(res);
            let body = res.json();
            return body.data || { };
          })
          .catch(function(error: any) {
            let errMsg = (error.message) ? error.message :
            error.status ? `${error.status} - ${error.statusText}` : 'Server error';
            console.log('!!error!!');
            console.log(errMsg); // log to console instead
            return Observable.throw(errMsg);
          });

        response.subscribe(
          message => console.log(message),
          err => console.log(err)
        );

        // console.log('!!response!!');
        // console.log(response);
      }
}
