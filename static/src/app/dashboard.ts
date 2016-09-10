import { Component, OnInit, Input} 	from '@angular/core';
import {Header} from './header';
import {Player} from './player';
import {ReversiService} from './reversi.service';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'Dashboard',
  template: require('./dashboard.html'),
  providers: [],
  directives: [Header, Player]
})
export class Dashboard implements OnInit {

	@Input() public dashboard: Dashboard;

	constructor(private reversiService: ReversiService, private http: Http) {

	}

	ngOnInit() {

        let accessToken = localStorage.getItem('reversiAccessToken');
        if (typeof accessToken === 'undefined' || accessToken === null) {
            // window.location.assign('/');
            console.log(accessToken);
            return;
        }

        this.reversiService.loggedIn(accessToken, (loggedIn) => {
            if (loggedIn !== true) {
                // console.log(loggedIn);
                window.location.assign('./');
                return;
            };
        });
	}

	signOut() {
		console.log('signing out');
		(<any>window).gapi.load('client:auth2', this.authInit.bind(this));
	}

	authInit() {
		(<any>window).gapi.auth2.init({
			client_id: '402658185741-ai8prq9pem5vloivipl8o99ul5uuafvm.apps.googleusercontent.com',   // NOTE: Google Identity Platform key here
			scopes: 'profile'
		});
		(<any>window).gapi.auth2.getAuthInstance().then(this.authCallback.bind(this));
	}

	authCallback(googleAuth) {
        this.reversiService.logout(localStorage.getItem('reversiAccessToken'), (logout) => {
            if (logout) {
                localStorage.removeItem('google_id_token');
                localStorage.removeItem('reversiAccessToken');
                googleAuth.signOut();
                window.location.assign('/');
            } else {
                console.log('logout failed, likely due to invalid or expired access token');
            }
        });
	}

    play(id) {
        let url = 'play';
        if (id) {
            url += '?id=' + id;
        }
        window.location.assign(url);
    }
}
