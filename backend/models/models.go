package models

import "time"

type Court struct {
	ID           string  `json:"id" firestore:"id"`
	Name         string  `json:"name" firestore:"name"`
	Description  string  `json:"description" firestore:"description"`
	PricePerHour float64 `json:"pricePerHour" firestore:"pricePerHour"`
	Active       bool    `json:"active" firestore:"active"`
}

type TimeSlot struct {
	ID        string `json:"id" firestore:"id"`
	StartTime string `json:"startTime" firestore:"startTime"`
	EndTime   string `json:"endTime" firestore:"endTime"`
	Available bool   `json:"available" firestore:"available"`
}

type Reservation struct {
	ID              string    `json:"id,omitempty" firestore:"-"`
	CourtID         string    `json:"courtId" firestore:"courtId"`
	CourtName       string    `json:"courtName" firestore:"courtName"`
	Date            string    `json:"date" firestore:"date"`
	TimeSlotID      string    `json:"timeSlotId" firestore:"timeSlotId"`
	StartTime       string    `json:"startTime" firestore:"startTime"`
	EndTime         string    `json:"endTime" firestore:"endTime"`
	CustomerName    string    `json:"customerName" firestore:"customerName"`
	CustomerEmail   string    `json:"customerEmail" firestore:"customerEmail"`
	CustomerPhone   string    `json:"customerPhone" firestore:"customerPhone"`
	TotalPrice      float64   `json:"totalPrice" firestore:"totalPrice"`
	PaymentStatus   string    `json:"paymentStatus" firestore:"paymentStatus"`
	PaymentIntentID string    `json:"paymentIntentId,omitempty" firestore:"paymentIntentId,omitempty"`
	CreatedAt       time.Time `json:"createdAt" firestore:"createdAt"`
}

type ApiResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}
