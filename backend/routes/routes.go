package routes

import (
	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"github.com/courtly/backend/handlers"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, db *firestore.Client, app *firebase.App) {
	api := router.Group("/api")
	{
		// Health check
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "healthy"})
		})

		// Time slots routes
		api.GET("/timeslots", handlers.GetTimeSlots(db))

		// Courts routes
		api.GET("/courts", handlers.GetCourts(db))
		api.GET("/courts/available", handlers.GetAvailableCourts(db))

		// Reservations routes
		api.POST("/reservations", handlers.CreateReservation(db))
		api.GET("/reservations/:id", handlers.GetReservation(db))
	}
}
