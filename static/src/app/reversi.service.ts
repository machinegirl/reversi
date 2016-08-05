import { Injectable} from '@angular/core';

@Injectable()
export class ReversiService {
	// gameBoard: ElementRef;

	init() {
		console.log('reversi service started');
		let c = <HTMLCanvasElement> document.getElementById("gameBoard");
		if (typeof c !== 'undefined') {
			let ctx = <CanvasRenderingContext2D> c.getContext("2d");
			console.log(ctx);
			ctx.fillStyle = "#00FF00";
			ctx.fillRect(0,0,400,400);
		} else {
			console.log("c: " + c);
		}
	}
}
