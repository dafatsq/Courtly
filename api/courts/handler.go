package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/option"
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

type Court struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type courtsResponse struct {
	Courts []Court `json:"courts"`
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

func GetCourts() []Court {
	return []Court{
		{ID: "court-1", Name: "Court 1"},
		{ID: "court-2", Name: "Court 2"},
		{ID: "court-3", Name: "Court 3"},
		{ID: "court-4", Name: "Court 4"},
	}
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

	all := GetCourts()
	if date == "" || len(timeslots) == 0 {
		_ = json.NewEncoder(w).Encode(courtsResponse{Courts: all})
		return
	}

	client, err := GetFirestoreClient(ctx)
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
			var res Reservation
			_ = d.DataTo(&res)
			occupied[res.CourtID] = true
		}
	}

	var available []Court
	for _, c := range all {
		if !occupied[c.ID] {
			available = append(available, c)
		}
	}
	_ = json.NewEncoder(w).Encode(courtsResponse{Courts: available})
}
