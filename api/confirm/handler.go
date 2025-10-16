package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/option"

	stripe "github.com/stripe/stripe-go/v79"
	"github.com/stripe/stripe-go/v79/checkout/session"
)

type Reservation struct {
	Date       string `firestore:"date" json:"date"`
	TimeslotID string `firestore:"timeslotId" json:"timeslotId"`
	CourtID    string `firestore:"courtId" json:"courtId"`
	UserEmail  string `firestore:"userEmail" json:"userEmail"`
	Amount     int64  `firestore:"amount" json:"amount"`
	Status     string `firestore:"status" json:"status"`
	CreatedAt  int64  `firestore:"createdAt" json:"createdAt"`
	PaymentRef string `firestore:"paymentRef" json:"paymentRef"`
}

type confirmResponse struct {
	OK    bool   `json:"ok"`
	Error string `json:"error,omitempty"`
}

func GetFirestoreClient(ctx context.Context) (*firestore.Client, error) {
	projectID := os.Getenv("FIREBASE_PROJECT_ID")
	if projectID == "" {
		return nil, errors.New("FIREBASE_PROJECT_ID not set")
	}
	saJSON := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
	var client *firestore.Client
	var err error
	if saJSON != "" {
		client, err = firestore.NewClient(ctx, projectID, option.WithCredentialsJSON([]byte(saJSON)))
	} else {
		client, err = firestore.NewClient(ctx, projectID)
	}
	if err != nil {
		return nil, fmt.Errorf("firestore client error: %w", err)
	}
	return client, nil
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

	client, err := GetFirestoreClient(ctx)
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
		res := Reservation{
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
