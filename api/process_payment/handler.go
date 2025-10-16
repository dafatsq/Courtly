package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"
)

type paymentRequest struct {
	Date        string   `json:"date"`
	Timeslots   []string `json:"timeslots"`
	CourtID     string   `json:"courtId"`
	Amount      int      `json:"amount"`
	CardNumber  string   `json:"cardNumber"`
	CardName    string   `json:"cardName"`
	ExpiryMonth string   `json:"expiryMonth"`
	ExpiryYear  string   `json:"expiryYear"`
	CVV         string   `json:"cvv"`
}

type paymentResponse struct {
	Success   bool   `json:"success"`
	BookingID string `json:"bookingId,omitempty"`
	Error     string `json:"error,omitempty"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(paymentResponse{Error: "method not allowed"})
		return
	}

	var req paymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(paymentResponse{Error: "invalid body"})
		return
	}

	// Basic validation
	if req.Date == "" || len(req.Timeslots) == 0 || req.CourtID == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(paymentResponse{Error: "missing booking details"})
		return
	}

	if req.CardNumber == "" || req.CardName == "" || req.ExpiryMonth == "" || req.ExpiryYear == "" || req.CVV == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(paymentResponse{Error: "missing card details"})
		return
	}

	// Accept any card number - no validation!
	// Just simulate a successful payment processing

	// Generate a booking ID with random number
	rand.Seed(time.Now().UnixNano())
	bookingID := fmt.Sprintf("BK-%d", rand.Intn(100000000))

	// In a real system, you would:
	// 1. Store the booking in a database
	// 2. Mark the timeslots as reserved
	// 3. Send confirmation email
	// For this demo, we'll just return success

	// Simulate processing delay
	time.Sleep(500 * time.Millisecond)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(paymentResponse{
		Success:   true,
		BookingID: bookingID,
	})
}
