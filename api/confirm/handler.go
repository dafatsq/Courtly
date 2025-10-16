package main

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	sh "bookmycourt/internal/shared"

	stripe "github.com/stripe/stripe-go/v79"
	"github.com/stripe/stripe-go/v79/checkout/session"
)

type confirmResponse struct {
	OK    bool   `json:"ok"`
	Error string `json:"error,omitempty"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	sessionID := r.URL.Query().Get("session_id")
	if sessionID == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(confirmResponse{OK: false, Error: "missing session_id"})
		return
	}
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
	s, err := session.Get(sessionID, nil)
	if err != nil {
		_ = json.NewEncoder(w).Encode(confirmResponse{OK: false, Error: err.Error()})
		return
	}
	date := s.Metadata["date"]
	court := s.Metadata["courtId"]
	timeslotsCSV := s.Metadata["timeslots"]
	timeslots := []string{}
	if timeslotsCSV != "" {
		for _, t := range strings.Split(timeslotsCSV, ",") {
			t = strings.TrimSpace(t)
			if t != "" {
				timeslots = append(timeslots, t)
			}
		}
	}
	if len(timeslots) == 0 {
		// backward-compat fallback
		if t := s.Metadata["timeslotId"]; t != "" {
			timeslots = []string{t}
		}
	}

	client, err := sh.GetFirestoreClient(ctx)
	if err != nil {
		_ = json.NewEncoder(w).Encode(confirmResponse{OK: false, Error: err.Error()})
		return
	}
	defer client.Close()

	// Enforce non-past bookings relative to server time and venue TZ (check first timeslot)
	tz := os.Getenv("TIME_ZONE")
	if tz == "" {
		tz = "Asia/Jakarta"
	}
	loc, _ := time.LoadLocation(tz)
	if len(timeslots) > 0 && date != "" {
		parts := strings.Split(timeslots[0], "-")
		if len(parts) > 0 {
			slotStartStr := parts[0]
			if loc == nil {
				loc = time.Local
			}
			if slotStart, err := time.ParseInLocation("2006-01-02 15:04", date+" "+slotStartStr, loc); err == nil {
				now := time.Now().In(loc)
				if slotStart.Before(now.Add(30 * time.Minute)) {
					_ = json.NewEncoder(w).Encode(confirmResponse{OK: false, Error: "timeslot is in the past"})
					return
				}
			}
		}
	}

	// Guard: ensure no existing reservation for same date/timeslot/court
	// Validate each timeslot is free, then write all
	for _, ts := range timeslots {
		q := client.Collection("reservations").Where("date", "==", date).Where("timeslotId", "==", ts).Where("courtId", "==", court)
		docs, err := q.Documents(ctx).GetAll()
		if err == nil && len(docs) > 0 {
			_ = json.NewEncoder(w).Encode(confirmResponse{OK: false, Error: "one or more selected slots already reserved"})
			return
		}
	}
	for _, ts := range timeslots {
		res := sh.Reservation{
			Date:       date,
			TimeslotID: ts,
			CourtID:    court,
			UserEmail:  s.CustomerDetails.Email,
			Amount:     s.AmountTotal, // total amount repeated per doc; for more advanced model, split per slot
			Status:     "paid",
			CreatedAt:  time.Now().Unix(),
			PaymentRef: s.ID,
		}
		if _, _, err := client.Collection("reservations").Add(ctx, res); err != nil {
			_ = json.NewEncoder(w).Encode(confirmResponse{OK: false, Error: err.Error()})
			return
		}
	}
	_ = json.NewEncoder(w).Encode(confirmResponse{OK: true})
}
