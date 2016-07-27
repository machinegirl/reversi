extern crate iron;
extern crate staticfile;
extern crate mount;
extern crate router;

use iron::status;
use iron::{Iron, Request, Response, IronResult};
use staticfile::Static;
use mount::Mount;
use router::Router;
use std::process::Command;
use std::net::SocketAddrV4;
use std::net::Ipv4Addr;
use std::path::Path;
use std::str;

fn say_hello(req: &mut Request) -> IronResult<Response> {
	println!("Running say_hello handler, URL path: {}", req.url.path().join("/"));
	Ok(Response::with((status::Ok, "This request was routed!")))
}

fn main() {
	let host_port = 8080; //Note: port must be 8080 for GAE
	let hostname_cmd = Command::new("hostname").arg("-I").output();
	let host_addr: SocketAddrV4 = match hostname_cmd {
		Ok(res) => {
			let addr = str::from_utf8(res.stdout.as_slice())
				.map_err(|err| err.to_string())
				.and_then(|ip_str| ip_str.trim()
					.parse::<Ipv4Addr>()
					.map_err(|err| err.to_string()))
				.map(|ip| SocketAddrV4::new(ip, host_port));
			match addr {
				Ok(addr) => addr,
				Err(_) => {
					let ip = Ipv4Addr::new(127, 0, 0, 1);
					SocketAddrV4::new(ip, host_port)
				}
			}
		},
		Err(_) => {
			let ip = Ipv4Addr::new(127, 0, 0, 1);
			SocketAddrV4::new(ip, host_port)
		}
	};
	println!("Server listening at {}", host_addr);

	// API routes
	let mut router = Router::new();
	router.get("/hello", say_hello);

	let mut mount = Mount::new();
	mount
		.mount("/api", router)
		.mount("/", Static::new(Path::new("static/dist/")));

	Iron::new(mount).http(host_addr).unwrap();
}
