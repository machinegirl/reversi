FROM syntactician/archlinux-pacaur
EXPOSE 8080
EXPOSE 8055
EXPOSE 8056
COPY static/dist/ /static/dist/
COPY keys/ /keys/
COPY target/ /target/
CMD su build -c 'pacaur --noconfirm -S rust-nightly-bin'
CMD su build -c 'pacaur --noconfirm -S curl'
CMD /target/debug/reversi
