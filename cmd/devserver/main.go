package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	sh "bookmycourt/internal/shared"

	"github.com/joho/godotenv"
	stripe "github.com/stripe/stripe-go/v79"
	"github.com/stripe/stripe-go/v79/checkout/session"
)

// Stripe zero-decimal currency list (as of docs). Amounts are provided in whole currency units.
// All others require amounts in the smallest currency unit (multiply major by 100 for 2-decimal currencies).
func isZeroDecimalCurrency(c string) bool {
	switch strings.ToUpper(c) {
	case "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF":
		return true
	default:
		return false
	}
}

func handleTimeslots(w http.ResponseWriter, r *http.Request) {
	slots := sh.GenerateTimeslots()
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"timeslots": slots})
}

func handleNow(w http.ResponseWriter, r *http.Request) {
	tz := os.Getenv("TIME_ZONE")
	if tz == "" {
		tz = "Asia/Jakarta"
	}
	loc, err := time.LoadLocation(tz)
	now := time.Now()
	nowLoc := now
	if err == nil {
		nowLoc = now.In(loc)
	}
	_, offset := nowLoc.Zone()
	resp := map[string]any{
		"nowUnixMs":        nowLoc.UnixNano() / int64(time.Millisecond),
		"nowISO":           nowLoc.Format(time.RFC3339),
		"timezone":         tz,
		"utcOffsetMinutes": offset / 60,
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func handleCourts(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	date := r.URL.Query().Get("date")
	tsParam := r.URL.Query().Get("timeslots")
	if tsParam == "" {
		tsParam = r.URL.Query().Get("timeslot")
	}
	// Parse CSV of timeslots
	var timeslots []string
	if tsParam != "" {
		for _, p := range strings.Split(tsParam, ",") {
			p = strings.TrimSpace(p)
			if p != "" {
				timeslots = append(timeslots, p)
			}
		}
	}
	w.Header().Set("Content-Type", "application/json")
	all := sh.GetCourts()
	if date == "" || len(timeslots) == 0 {
		_ = json.NewEncoder(w).Encode(map[string]any{"courts": all})
		return
	}
	client, err := sh.GetFirestoreClient(ctx)
	if err != nil {
		_ = json.NewEncoder(w).Encode(map[string]any{"courts": all})
		return
	}
	defer client.Close()
	// Build occupied set across any of the selected timeslots
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
	_ = json.NewEncoder(w).Encode(map[string]any{"courts": available})
}

type checkoutRequest struct {
	Date       string   `json:"date"`
	TimeslotID string   `json:"timeslotId"`
	Timeslots  []string `json:"timeslots"`
	CourtID    string   `json:"courtId"`
}

func handleCreateCheckoutSession(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var req checkoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "invalid body"})
		return
	}
	// Backward-compat: accept { "court": "court-1" }
	if req.CourtID == "" {
		// re-decode raw body to generic map to check alternate field without rewinding Body
		// simpler: try query param fallback
		if v := r.URL.Query().Get("court"); v != "" {
			req.CourtID = v
		}
	}
	// Determine list of timeslots
	timeslots := req.Timeslots
	if len(timeslots) == 0 && req.TimeslotID != "" {
		timeslots = []string{req.TimeslotID}
	}
	if len(timeslots) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "missing timeslots"})
		return
	}
	// Venue timezone and non-past cutoff (30 minutes)
	tz := os.Getenv("TIME_ZONE")
	if tz == "" {
		tz = "Asia/Jakarta"
	}
	loc, _ := time.LoadLocation(tz)
	if req.Date != "" {
		parts := strings.Split(timeslots[0], "-")
		if len(parts) > 0 {
			slotStartStr := parts[0]
			if loc == nil {
				loc = time.Local
			}
			if slotStart, err := time.ParseInLocation("2006-01-02 15:04", req.Date+" "+slotStartStr, loc); err == nil {
				now := time.Now().In(loc)
				if slotStart.Before(now.Add(30 * time.Minute)) {
					w.WriteHeader(http.StatusBadRequest)
					_ = json.NewEncoder(w).Encode(map[string]string{"error": "cannot book a past/soon timeslot"})
					return
				}
			}
		}
	}

	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
	// Pricing in IDR (zero-decimal). Override via env PRICE_PER_SLOT and PRICE_CURRENCY.
	priceCurrency := os.Getenv("PRICE_CURRENCY")
	if priceCurrency == "" {
		priceCurrency = "idr"
	}
	pricePerSlot := int64(50000) // major units (e.g., 50000 IDR)
	rawEnvPrice := os.Getenv("PRICE_PER_SLOT")
	if v := rawEnvPrice; v != "" {
		if parsed, err := strconv.ParseInt(v, 10, 64); err == nil && parsed > 0 {
			pricePerSlot = parsed
		}
	}
	// Convert to Stripe expected units
	unitAmount := pricePerSlot
	if !isZeroDecimalCurrency(priceCurrency) {
		unitAmount = pricePerSlot * 100
	}
	// Debug: expose resolved pricing via headers and log for troubleshooting
	w.Header().Set("X-Debug-PriceCurrency", strings.ToLower(priceCurrency))
	w.Header().Set("X-Debug-UnitAmount", strconv.FormatInt(unitAmount, 10))
	w.Header().Set("X-Debug-Raw-PRICE_PER_SLOT", rawEnvPrice)
	log.Printf("[checkout] currency=%s unitAmount=%d (major=%d) rawEnvPrice=%s", strings.ToLower(priceCurrency), unitAmount, pricePerSlot, rawEnvPrice)
	successURL := os.Getenv("PUBLIC_BASE_URL") + "/success?date=" + req.Date + "&timeslots=" + strings.Join(timeslots, ",") + "&court=" + req.CourtID + "&session_id={CHECKOUT_SESSION_ID}"
	cancelURL := os.Getenv("PUBLIC_BASE_URL") + "/cancel"
	params := &stripe.CheckoutSessionParams{
		Mode:       stripe.String(string(stripe.CheckoutSessionModePayment)),
		SuccessURL: stripe.String(successURL),
		CancelURL:  stripe.String(cancelURL),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Quantity: stripe.Int64(int64(len(timeslots))),
				PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
					Currency:   stripe.String(strings.ToLower(priceCurrency)),
					UnitAmount: stripe.Int64(unitAmount),
					ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
						Name:        stripe.String("Badminton Court Reservation"),
						Description: stripe.String(req.Date + " [" + strings.Join(timeslots, ", ") + "] - " + req.CourtID),
					},
				},
			},
		},
		Metadata: map[string]string{
			"date":      req.Date,
			"timeslots": strings.Join(timeslots, ","),
			"courtId":   req.CourtID,
		},
	}
	s, err := session.New(params)
	w.Header().Set("Content-Type", "application/json")
	if err != nil {
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error(), "currency": strings.ToLower(priceCurrency), "unitAmount": strconv.FormatInt(unitAmount, 10)})
		return
	}
	_ = json.NewEncoder(w).Encode(map[string]string{"url": s.URL})
}

func handleConfirm(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	sessionID := r.URL.Query().Get("session_id")
	if sessionID == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": "missing session_id"})
		return
	}
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
	s, err := session.Get(sessionID, nil)
	if err != nil {
		_ = json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": err.Error()})
		return
	}
	client, err := sh.GetFirestoreClient(ctx)
	if err != nil {
		_ = json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": err.Error()})
		return
	}
	defer client.Close()
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
		if t := s.Metadata["timeslotId"]; t != "" {
			timeslots = []string{t}
		}
	}

	// Non-past enforcement (first timeslot) in venue TZ with 30-minute cutoff
	tz := os.Getenv("TIME_ZONE")
	if tz == "" {
		tz = "Asia/Jakarta"
	}
	loc, _ := time.LoadLocation(tz)
	if len(timeslots) > 0 && date != "" {
		parts := strings.Split(timeslots[0], "-")
		if len(parts) > 0 {
			startStr := parts[0]
			if loc == nil {
				loc = time.Local
			}
			if slotStart, err := time.ParseInLocation("2006-01-02 15:04", date+" "+startStr, loc); err == nil {
				now := time.Now().In(loc)
				if slotStart.Before(now.Add(30 * time.Minute)) {
					_ = json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": "timeslot is in the past"})
					return
				}
			}
		}
	}

	// Ensure availability for each selected timeslot, then write all
	for _, ts := range timeslots {
		q := client.Collection("reservations").Where("date", "==", date).Where("timeslotId", "==", ts).Where("courtId", "==", court)
		docs, err := q.Documents(ctx).GetAll()
		if err == nil && len(docs) > 0 {
			_ = json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": "one or more selected slots already reserved"})
			return
		}
	}
	for _, ts := range timeslots {
		res := sh.Reservation{
			Date:       date,
			TimeslotID: ts,
			CourtID:    court,
			UserEmail:  s.CustomerDetails.Email,
			Amount:     s.AmountTotal,
			Status:     "paid",
			CreatedAt:  time.Now().Unix(),
			PaymentRef: s.ID,
		}
		if _, _, err := client.Collection("reservations").Add(ctx, res); err != nil {
			_ = json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": err.Error()})
			return
		}
	}
	_ = json.NewEncoder(w).Encode(map[string]any{"ok": true})
}

// Payment processing types
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

func handleProcessPayment(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		_ = json.NewEncoder(w).Encode(paymentResponse{Error: "method not allowed"})
		return
	}

	var req paymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(paymentResponse{Error: "invalid body"})
		return
	}

	// Basic validation
	if req.Date == "" || len(req.Timeslots) == 0 || req.CourtID == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(paymentResponse{Error: "missing booking details"})
		return
	}

	if req.CardNumber == "" || req.CardName == "" || req.ExpiryMonth == "" || req.ExpiryYear == "" || req.CVV == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(paymentResponse{Error: "missing card details"})
		return
	}

	// Accept any card number - no validation!
	// Just simulate a successful payment processing

	// Generate a booking ID with timestamp
	bookingID := fmt.Sprintf("BK-%d", time.Now().UnixNano()/1000000)

	// Store the booking in Firestore
	ctx := context.Background()
	client, err := sh.GetFirestoreClient(ctx)
	if err != nil {
		log.Printf("Firestore client error: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(paymentResponse{Error: "failed to connect to database"})
		return
	}
	defer client.Close()

	// Create a reservation for each timeslot
	for _, ts := range req.Timeslots {
		res := sh.Reservation{
			Date:       req.Date,
			TimeslotID: ts,
			CourtID:    req.CourtID,
			UserEmail:  req.CardName + "@demo.com", // Use card name as email
			Amount:     int64(req.Amount),
			Status:     "paid",
			CreatedAt:  time.Now().Unix(),
			PaymentRef: bookingID,
		}
		if _, _, err := client.Collection("reservations").Add(ctx, res); err != nil {
			log.Printf("Failed to save reservation: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(paymentResponse{Error: "failed to save reservation"})
			return
		}
		log.Printf("Saved reservation: %s | %s | %s", req.Date, ts, req.CourtID)
	}

	// Simulate processing delay
	time.Sleep(500 * time.Millisecond)

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(paymentResponse{
		Success:   true,
		BookingID: bookingID,
	})
}

func main() {
	// Auto-load environment variables from .env.local then .env (dev convenience)
	// Non-fatal if files are missing; real env vars still take precedence.
	if err := godotenv.Overload(".env.local"); err != nil {
		_ = godotenv.Overload()
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/api/timeslots", handleTimeslots)
	mux.HandleFunc("/api/courts", handleCourts)
	mux.HandleFunc("/api/create_checkout_session", handleCreateCheckoutSession)
	mux.HandleFunc("/api/confirm", handleConfirm)
	mux.HandleFunc("/api/now", handleNow)
	mux.HandleFunc("/api/process_payment", handleProcessPayment)

	port := os.Getenv("DEV_API_PORT")
	if port == "" {
		port = "8787"
	}
	addr := ":" + port
	log.Printf("Go dev API server listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}
