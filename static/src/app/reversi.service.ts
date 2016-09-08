import { Injectable} from '@angular/core';
import {JwtHelper} from 'angular2-jwt';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';


@Injectable()
export class ReversiService {

	// public gameBoard: Array<Array<number>>;
	public sockHandle: any;
	public game: any;
	public numPieces0: number;
	public numPieces1: number;
	jwtHelper: JwtHelper = new JwtHelper();
	xApiKey: string;


	constructor(public http: Http) {
		this.xApiKey = '4YLYr2DUqbadbhVWM4yjN4OEHsFaNGNC8UdUKqvL';	// NOTE: AWS API Gateway auth key
	}

	init() {
		console.log('reversi service started');

		// this.gameBoard = [
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0]
		// ];

		if (window.location.pathname === '/play') {
			let c = <HTMLCanvasElement> document.getElementById('gameBoard');
			if (typeof c !== 'undefined') {
				let ctx = <CanvasRenderingContext2D> c.getContext('2d');
				// console.log(ctx);
				ctx.fillStyle = '#0f8f2f';
				ctx.fillRect(0, 0, 400, 400);

				// this.drawGameBoard(gameBoard);
			} else {
				// console.log('c: ' + c);
			}
		}
	}

	drawGameBoard(gameBoard) {
		let c = <HTMLCanvasElement> document.getElementById('gameBoard');
		let ctx = <CanvasRenderingContext2D> c.getContext('2d');
		let h = c.height;
		ctx.fillStyle = '#0f8f2f';
		ctx.fillRect(0, 0, h, h);
		let tileH = h / 8;
		let startX = 0;
		let startY = 0;
		ctx.strokeStyle = '#000000';
		for (let i = 0; i < gameBoard.length; i++) {
			for (let j = 0; j < gameBoard[i].length; j++) {
				ctx.beginPath();
				ctx.moveTo(startX, startY);
				ctx.lineTo(startX + tileH, startY);
				ctx.lineTo(startX + tileH, startY + tileH);
				ctx.lineTo(startX, startY + tileH);
				ctx.lineTo(startX, startY);
				ctx.stroke();
				if (gameBoard[i][j] !== 0) {
					ctx.beginPath();
					ctx.arc(startX + (tileH / 2), startY + (tileH / 2), tileH / 2.2, 0, 2 * Math.PI);

					if (gameBoard[i][j] === 1) {
						ctx.fillStyle = '#FFFFFF';
					} else {
						ctx.fillStyle = '#000000';
					}
					ctx.fill();
				}

				startX += tileH;

			}
			startY += tileH;
			startX = 0;
		}
	}

	// newGame() {
	// 	let gameBoard = [];
	// 	for (let i = 0; i < 8; i++) {
	// 		let row = [];
	// 		for (let j = 0; j < 8; j++) {
	// 			row.push(0);
	// 		}
	// 		gameBoard.push(row);
	// 	}
	// 	this.gamed = gameBoard;
	// }

	loadGame(id) {
		let idToken = localStorage.getItem('google_id_token');

		// this.sockHandle.send(JSON.stringify({
		// 	'cmd': 'load_game',
		// 	'id_token': idToken,
		// 	'id': id
		// }));

	}

	setupGame(game) {
		this.game = game;
		this.drawGameBoard(this.game.board);

	}

	checkTurn() {
		let idToken = this.jwtHelper.decodeToken(localStorage.getItem('google_id_token')).sub;
		let playerTurn = this.game.player_turn;
		if (this.game.players[playerTurn] !== idToken) {
		  return false;
		} else {
		  return true;
	  }
	}

	checkMove(row, column) {
		let validMoves = [];
		// let idToken = this.jwtHelper.decodeToken(localStorage.getItem('google_id_token')).sub;
		if (this.game.pieces[this.game.player_turn] > 30) {
			console.log('player ' + this.game.player_turn + ': do opening move');
			if (this.game.player_turn === 0) {
				validMoves = [[3, 3], [4, 4]];
			} else if (this.game.player_turn === 1) {
				validMoves = [[4, 3], [3, 4]];
			}
		} else {
			console.log('make a real move');
			validMoves = this.validMoves();
		}
		for (let i = 0; i < <number>validMoves.length; i++) {
			if (validMoves[i][0] === row && validMoves[i][1] === column) {
				return true;
			}
		}

		return false;

	}

	validMoves() {
		let validMoves = [];
		let gameBoardLength: number = this.game.board.length;

		for (let i = 0; i < gameBoardLength; i++) {

		}

		return validMoves;
	}

	login(idToken, callback) {
		let body = JSON.stringify({ 'idToken': idToken });
		let headers = new Headers({ 'X-Api-Key': this.xApiKey});
		let options = new RequestOptions({ headers: headers });

		let response = this.http.post('https://bi5371ceb2.execute-api.us-east-1.amazonaws.com/dev/login', body, options)
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
			message => {
				callback(message);	// Send back the result
			},
			err => console.log(err)
		);
	}

	refreshLogin() {
		let accessToken = localStorage.getItem('reversiAccessToken');
		if (typeof accessToken === 'undefined' || accessToken === null) {
			window.location.assign('/');
			return;
		}
		let decoded = this.jwtHelper.decodeToken(accessToken);
		let now = Math.floor(Date.now()/1000);
		let timeout = ((decoded.exp - now) * 1000) - (1000 * 60 * 5);
		timeout = timeout < 0 ? 0 : timeout;
		let refresh = () => {

			let headers = new Headers({
				'X-Api-Key': this.xApiKey,
				'X-Reversi-Auth': 'Bearer ' + accessToken,
			});
			let options = new RequestOptions({ headers: headers });

			let response = this.http.put('https://bi5371ceb2.execute-api.us-east-1.amazonaws.com/dev/refresh_login', null, options)
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
				message => {
					console.log('refresh token success: ' + message.success);
					console.log('new access token: ' + message.accessToken);
					if (!message.success) {
						localStorage.removeItem('reversiAccessToken');
						window.location.assign('/');
						return;
					}
					window.setTimeout(refresh, 1000 * 60 * 55);
					localStorage.setItem('reversiAccessToken', message.accessToken);
				},
				err => console.log(err)
			);
		};

		window.setTimeout(refresh, timeout);
	};

	loggedIn(accessToken, callback) {
		let headers = new Headers({
			'X-Api-Key': this.xApiKey,
			'X-Reversi-Auth': 'Bearer ' + accessToken,
		});
		let options = new RequestOptions({ headers: headers });

		let response = this.http.get('https://bi5371ceb2.execute-api.us-east-1.amazonaws.com/dev/logged_in', options)
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
			loggedIn => {
				this.refreshLogin();
				callback(loggedIn);	// Send back the result
			},
			err => console.log(err)
		);
	}

	logout(accessToken, callback) {
		let headers = new Headers({
			'X-Api-Key': this.xApiKey,
			'X-Reversi-Auth': 'Bearer ' + accessToken,
		});
		let options = new RequestOptions({ headers: headers });

		let response = this.http.put('https://bi5371ceb2.execute-api.us-east-1.amazonaws.com/dev/logout', null, options)
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
			logout => {
				callback(logout);	// Send back the result
			},
			err => console.log(err)
		);


	}

}
