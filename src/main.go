package reversi

import (
  "net/http"
	"github.com/gorilla/mux"
)

func init() {

	r := mux.NewRouter()

  r.PathPrefix("/dashboard").Handler(http.StripPrefix("/dashboard", http.FileServer(http.Dir("static/dist"))))
  r.PathPrefix("/play").Handler(http.StripPrefix("/play", http.FileServer(http.Dir("static/dist"))))
	r.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("static/dist"))))

	http.Handle("/", r)
}
