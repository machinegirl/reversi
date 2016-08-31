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
  pubnub2: any;
  subscribedPubnubSystem: boolean;
  subscribedPubnubSystem2: boolean;

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
  pubnubExample() {
    this.pubnub = new PubNub({
        publishKey : 'pub-c-1fe9d7cd-6d1c-46d6-bc97-efcbbab4d6c2',
        subscribeKey : 'sub-c-d135f9a0-6ccd-11e6-92a0-02ee2ddab7fe'
    });

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

    if (!this.subscribedPubnubSystem) {
      console.log('Subscribing..');
      this.pubnub.subscribe({
          channels: ['Channel-reversi-system']
      });
      this.subscribedPubnubSystem = true;
    }

    let body = JSON.stringify({ 'message': 'Hey buddy' });
    let headers = new Headers({ 'X-Api-Key': '6Tairgv32oa3OCOpcY0dP6YgyGKt2Fge2TTDPOP5'});
    let options = new RequestOptions({ headers: headers });

    let response = this.http.post('https://teddo46zcb.execute-api.us-east-1.amazonaws.com/prod/pubnub_example', body, options)
      .map(function(res: Response) {
        let body = res.json();
        return body || { };
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
  }

  pubnubExample2() {

    this.pubnub2 = new PubNub({
            publishKey : 'pub-c-d617ce4f-25a6-4cfc-9766-d0e16ba8764c',
            subscribeKey : 'sub-c-04c32322-6e74-11e6-80e7-02ee2ddab7fe'
        });

        this.pubnub2.addListener({
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

        if (!this.subscribedPubnubSystem2) {
          console.log('Subscribing..');
          this.pubnub2.subscribe({
              channels: ['Channel-reversi-system']
          });
          this.subscribedPubnubSystem2 = true;
        }

        let body = JSON.stringify({ 'message': 'Hey buddy' });
        let headers = new Headers({ 'X-Api-Key': '6Tairgv32oa3OCOpcY0dP6YgyGKt2Fge2TTDPOP5'});
        let options = new RequestOptions({ headers: headers });

        let response = this.http.post('https://teddo46zcb.execute-api.us-east-1.amazonaws.com/prod/pubnub_example2', body, options)
          .map(function(res: Response) {
            let body = res.json();
            return body || { };
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
      }
}
