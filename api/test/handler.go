package handler

import (
	"encoding/json"
	"net/http"
)

type testResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(testResponse{
		Status:  "ok",
		Message: "Go API is working!",
	})
}
