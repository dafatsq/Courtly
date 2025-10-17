package config

import (
	"context"
	"log"
	"os"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/option"
)

func InitFirebase(ctx context.Context) (*firebase.App, *firestore.Client) {
	// Get the path to the service account key file
	credPath := os.Getenv("FIREBASE_SERVICE_ACCOUNT_KEY")

	var opt option.ClientOption
	if credPath != "" {
		opt = option.WithCredentialsFile(credPath)
	} else {
		// For production, use Application Default Credentials
		log.Println("Using Application Default Credentials")
		opt = option.WithCredentialsFile("") // Will use ADC
	}

	// Initialize Firebase Admin SDK
	conf := &firebase.Config{
		ProjectID: os.Getenv("FIREBASE_PROJECT_ID"),
	}

	app, err := firebase.NewApp(ctx, conf, opt)
	if err != nil {
		log.Fatalf("Error initializing Firebase app: %v", err)
	}

	// Initialize Firestore client
	client, err := app.Firestore(ctx)
	if err != nil {
		log.Fatalf("Error initializing Firestore client: %v", err)
	}

	log.Println("Firebase initialized successfully")
	return app, client
}
