FROM jimmycuadra/rust
EXPOSE 8080
EXPOSE 8055
COPY Cargo.toml /source
COPY static/dist/ /source/static/dist/
COPY target/ /target/
CMD /target/debug/reversi
