package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	sh "bookmycourt/internal/shared"
)

type courtsResponse struct {
	Courts []sh.Court `json:"courts"`
}

func parseTimeslots(q string) []string {
	if q == "" {
		return nil
	}
	parts := strings.Split(q, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

func Handler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	date := r.URL.Query().Get("date")
	// Support either `timeslots` as CSV or repeated, or fallback to `timeslot` single
	tsParam := r.URL.Query().Get("timeslots")
	if tsParam == "" {
		tsParam = r.URL.Query().Get("timeslot")
	}
	timeslots := parseTimeslots(tsParam)
	w.Header().Set("Content-Type", "application/json")

	all := sh.GetCourts()
	if date == "" || len(timeslots) == 0 {
		_ = json.NewEncoder(w).Encode(courtsResponse{Courts: all})
		return
	}

	client, err := sh.GetFirestoreClient(ctx)
	if err != nil {
		_ = json.NewEncoder(w).Encode(courtsResponse{Courts: all})
		return
	}
	defer client.Close()

	// Build set of occupied courts across any of the selected timeslots
	occupied := map[string]bool{}
	for _, ts := range timeslots {
		q := client.Collection("reservations").Where("date", "==", date).Where("timeslotId", "==", ts)
		docs, err := q.Documents(ctx).GetAll()
		if err != nil {
			continue
		}
		for _, d := range docs {
			var res sh.Reservation
			_ = d.DataTo(&res)
			occupied[res.CourtID] = true
		}
	}

	var available []sh.Court
	for _, c := range all {
		if !occupied[c.ID] {
			available = append(available, c)
		}
	}
	_ = json.NewEncoder(w).Encode(courtsResponse{Courts: available})
}
