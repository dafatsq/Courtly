package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Timeslot struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}

type timeslotsResponse struct {
	Timeslots []Timeslot `json:"timeslots"`
}

func GenerateTimeslots() []Timeslot {
	var slots []Timeslot
	for h := 8; h < 22; h++ {
		start := time.Date(2020, 1, 1, h, 0, 0, 0, time.UTC)
		end := start.Add(time.Hour)
		id := fmt.Sprintf("%02d:00-%02d:00", h, h+1)
		label := fmt.Sprintf("%s - %s", start.Format("15:04"), end.Format("15:04"))
		slots = append(slots, Timeslot{ID: id, Label: label})
	}
	return slots
}

// Vercel entrypoint for /api/timeslots
func Handler(w http.ResponseWriter, r *http.Request) {
	slots := GenerateTimeslots()
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(timeslotsResponse{Timeslots: slots})
}
