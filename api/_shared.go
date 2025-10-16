package shared

import (
	"context"
	"errors"
	"fmt"
	"os"
	"time"

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

type Timeslot struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}

type Court struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func getFirestoreClient(ctx context.Context) (*firestore.Client, error) {
	projectID := os.Getenv("FIREBASE_PROJECT_ID")
	if projectID == "" {
		return nil, errors.New("FIREBASE_PROJECT_ID not set")
	}
	// Preferred: use GOOGLE_APPLICATION_CREDENTIALS_JSON env var for service account JSON
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

func getCourts() []Court {
	return []Court{
		{ID: "court-1", Name: "Court 1"},
		{ID: "court-2", Name: "Court 2"},
		{ID: "court-3", Name: "Court 3"},
		{ID: "court-4", Name: "Court 4"},
	}
}

func generateTimeslots() []Timeslot {
	// 1-hour slots from 08:00 to 22:00
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
