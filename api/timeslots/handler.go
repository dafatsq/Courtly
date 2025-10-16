package main

import (
	"encoding/json"
	"net/http"

	sh "bookmycourt/internal/shared"
)

type timeslotsResponse struct {
	Timeslots []sh.Timeslot `json:"timeslots"`
}

// Vercel entrypoint for /api/timeslots
func Handler(w http.ResponseWriter, r *http.Request) {
	slots := sh.GenerateTimeslots()
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(timeslotsResponse{Timeslots: slots})
}
