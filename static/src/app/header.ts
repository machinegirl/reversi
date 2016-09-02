import {Component, OnInit} from '@angular/core';
import {ReversiService} from './reversi.service';


@Component({
  selector: 'Header',
  template: require('./header.html'),
  providers: []
})
export class Header implements OnInit {

	constructor(private reversiService: ReversiService) {
		// this.websocketService = websocketService;
	}

	ngOnInit() {
		this.reversiService.init();
	}
}
