import { Injectable} from '@angular/core';

@Injectable()
export class ReversiService {

	public static startGame(sockHandle) {
		let msg = {'cmd': 'start_game'};
		sockHandle.send(JSON.stringify(msg));
	}

	init() {
		console.log('reversi service started');
		let c = <HTMLCanvasElement> document.getElementById('gameBoard');
		if (typeof c !== 'undefined') {
			let ctx = <CanvasRenderingContext2D> c.getContext('2d');
			console.log(ctx);
			ctx.fillStyle = '#0f8f2f';
			ctx.fillRect(0, 0, 400, 400);
			let gameBoard = [
				[1, 0, 0, 0, 0, 0, 0, 0],
				[0, 1, 0, 0, 0, 2, 0, 0],
				[0, 0, 2, 0, 0, 0, 1, 0],
				[0, 0, 0, 0, 0, 0, 0, 0],
				[0, 1, 0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0, 2, 0],
				[0, 0, 0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 1, 0, 0, 0]
			];
			this.drawGameBoard(gameBoard);
		} else {
			console.log('c: ' + c);
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
						ctx.fillStyle = '#000000';
					} else {
						ctx.fillStyle = '#FFFFFF';
					}
					ctx.fill();
				}

				startX += tileH;

			}
			startY += tileH;
			startX = 0;
		}
	}

}
