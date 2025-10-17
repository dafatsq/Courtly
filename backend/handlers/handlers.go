package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/courtly/backend/models"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/iterator"
)

// GetTimeSlots returns available time slots for a given date
func GetTimeSlots(db *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		date := c.Query("date")
		if date == "" {
			c.JSON(http.StatusBadRequest, models.ApiResponse{
				Success: false,
				Error:   "Date parameter is required",
			})
			return
		}

		// Default time slots (8 AM to 8 PM)
		defaultSlots := []models.TimeSlot{
			{ID: "1", StartTime: "08:00", EndTime: "09:00", Available: true},
			{ID: "2", StartTime: "09:00", EndTime: "10:00", Available: true},
			{ID: "3", StartTime: "10:00", EndTime: "11:00", Available: true},
			{ID: "4", StartTime: "11:00", EndTime: "12:00", Available: true},
			{ID: "5", StartTime: "12:00", EndTime: "13:00", Available: true},
			{ID: "6", StartTime: "13:00", EndTime: "14:00", Available: true},
			{ID: "7", StartTime: "14:00", EndTime: "15:00", Available: true},
			{ID: "8", StartTime: "15:00", EndTime: "16:00", Available: true},
			{ID: "9", StartTime: "16:00", EndTime: "17:00", Available: true},
			{ID: "10", StartTime: "17:00", EndTime: "18:00", Available: true},
			{ID: "11", StartTime: "18:00", EndTime: "19:00", Available: true},
			{ID: "12", StartTime: "19:00", EndTime: "20:00", Available: true},
		}

		c.JSON(http.StatusOK, models.ApiResponse{
			Success: true,
			Data:    defaultSlots,
		})
	}
}

// GetCourts returns all courts
func GetCourts(db *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := context.Background()

		iter := db.Collection("courts").Documents(ctx)
		var courts []models.Court

		for {
			doc, err := iter.Next()
			if err == iterator.Done {
				break
			}
			if err != nil {
				log.Printf("Error iterating courts: %v", err)
				continue
			}

			var court models.Court
			if err := doc.DataTo(&court); err != nil {
				log.Printf("Error parsing court data: %v", err)
				continue
			}
			court.ID = doc.Ref.ID
			courts = append(courts, court)
		}

		// If no courts in database, return default courts
		if len(courts) == 0 {
			courts = []models.Court{
				{ID: "1", Name: "Court 1", Description: "Premium wooden flooring, professional lighting", PricePerHour: 25, Active: true},
				{ID: "2", Name: "Court 2", Description: "Standard court with good ventilation", PricePerHour: 20, Active: true},
				{ID: "3", Name: "Court 3", Description: "Competition-ready court with gallery seating", PricePerHour: 30, Active: true},
			}
		}

		c.JSON(http.StatusOK, models.ApiResponse{
			Success: true,
			Data:    courts,
		})
	}
}

// GetAvailableCourts returns courts available for a specific date and time slot
func GetAvailableCourts(db *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		date := c.Query("date")
		timeSlot := c.Query("timeslot")

		if date == "" || timeSlot == "" {
			c.JSON(http.StatusBadRequest, models.ApiResponse{
				Success: false,
				Error:   "Date and timeslot parameters are required",
			})
			return
		}

		ctx := context.Background()

		// Get all courts
		courtsIter := db.Collection("courts").Documents(ctx)
		var allCourts []models.Court

		for {
			doc, err := courtsIter.Next()
			if err == iterator.Done {
				break
			}
			if err != nil {
				log.Printf("Error iterating courts: %v", err)
				continue
			}

			var court models.Court
			if err := doc.DataTo(&court); err != nil {
				log.Printf("Error parsing court data: %v", err)
				continue
			}
			court.ID = doc.Ref.ID
			if court.Active {
				allCourts = append(allCourts, court)
			}
		}

		// If no courts in database, use default courts
		if len(allCourts) == 0 {
			allCourts = []models.Court{
				{ID: "1", Name: "Court 1", Description: "Premium wooden flooring, professional lighting", PricePerHour: 25, Active: true},
				{ID: "2", Name: "Court 2", Description: "Standard court with good ventilation", PricePerHour: 20, Active: true},
				{ID: "3", Name: "Court 3", Description: "Competition-ready court with gallery seating", PricePerHour: 30, Active: true},
			}
		}

		// Check which courts are already booked
		reservationsIter := db.Collection("reservations").
			Where("date", "==", date).
			Where("timeSlotId", "==", timeSlot).
			Documents(ctx)

		bookedCourtIDs := make(map[string]bool)
		for {
			doc, err := reservationsIter.Next()
			if err == iterator.Done {
				break
			}
			if err != nil {
				log.Printf("Error iterating reservations: %v", err)
				continue
			}

			var reservation models.Reservation
			if err := doc.DataTo(&reservation); err != nil {
				log.Printf("Error parsing reservation data: %v", err)
				continue
			}
			bookedCourtIDs[reservation.CourtID] = true
		}

		// Filter out booked courts
		var availableCourts []models.Court
		for _, court := range allCourts {
			if !bookedCourtIDs[court.ID] {
				availableCourts = append(availableCourts, court)
			}
		}

		c.JSON(http.StatusOK, models.ApiResponse{
			Success: true,
			Data:    availableCourts,
		})
	}
}

// CreateReservation creates a new reservation
func CreateReservation(db *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		var reservation models.Reservation
		if err := c.ShouldBindJSON(&reservation); err != nil {
			c.JSON(http.StatusBadRequest, models.ApiResponse{
				Success: false,
				Error:   fmt.Sprintf("Invalid request body: %v", err),
			})
			return
		}

		ctx := context.Background()

		// Check if the court is still available
		reservationsIter := db.Collection("reservations").
			Where("date", "==", reservation.Date).
			Where("timeSlotId", "==", reservation.TimeSlotID).
			Where("courtId", "==", reservation.CourtID).
			Documents(ctx)

		_, err := reservationsIter.Next()
		if err != iterator.Done {
			c.JSON(http.StatusConflict, models.ApiResponse{
				Success: false,
				Error:   "This court is already booked for the selected time slot",
			})
			return
		}

		// Set additional fields
		reservation.CreatedAt = time.Now()
		reservation.PaymentStatus = "completed" // For mock payment

		// Create the reservation
		docRef, _, err := db.Collection("reservations").Add(ctx, reservation)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   fmt.Sprintf("Failed to create reservation: %v", err),
			})
			return
		}

		reservation.ID = docRef.ID

		c.JSON(http.StatusCreated, models.ApiResponse{
			Success: true,
			Data:    reservation,
		})
	}
}

// GetReservation retrieves a reservation by ID
func GetReservation(db *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if id == "" {
			c.JSON(http.StatusBadRequest, models.ApiResponse{
				Success: false,
				Error:   "Reservation ID is required",
			})
			return
		}

		ctx := context.Background()
		doc, err := db.Collection("reservations").Doc(id).Get(ctx)
		if err != nil {
			c.JSON(http.StatusNotFound, models.ApiResponse{
				Success: false,
				Error:   "Reservation not found",
			})
			return
		}

		var reservation models.Reservation
		if err := doc.DataTo(&reservation); err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   fmt.Sprintf("Error parsing reservation: %v", err),
			})
			return
		}
		reservation.ID = doc.Ref.ID

		c.JSON(http.StatusOK, models.ApiResponse{
			Success: true,
			Data:    reservation,
		})
	}
}
