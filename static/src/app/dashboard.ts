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

        this.reversiService.init(() => {
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

                // GET /user
                this.reversiService.getUser(accessToken, (res) => {

                    // Set view vars from res.
                    console.log('!!');
                    console.log(res);

                    this.reversiService.name = res.name;
                    this.reversiService.email = res.email;
                    this.reversiService.gamesPlayed = res.games_played;
                    this.reversiService.gamesWon = res.games_won;
                    this.reversiService.numFriends = res.friend.length;

                    // GET /friend?id=[23423432, 76765645, etc.]
                    this.reversiService.getFriend(accessToken, res.friend, (res) => {

                        // Set view vars from res.
                        this.reversiService.friends = Object.keys(res).map(key => res[key]);
                    });
                });
            });
        });
	}

	signOut() {
		console.log('signing out');
		(<any>window).gapi.load('client:auth2', this.authInit.bind(this));
	}

	authInit() {
		(<any>window).gapi.auth2.init({
			client_id: this.reversiService.googleIdentityPlatformKey,   // NOTE: Google Identity Platform key here
			scopes: 'profile'
		});
		(<any>window).gapi.auth2.getAuthInstance().then(this.googleLogout.bind(this));
	}

	googleLogout(googleAuth) {
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

    deleteUserTrigger() {
        let accessToken = localStorage.getItem('reversiAccessToken');
        this.reversiService.deleteUser(accessToken, () => {
            this.signOut();
        })
    }

}
