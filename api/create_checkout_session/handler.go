package handler

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	stripe "github.com/stripe/stripe-go/v79"
	"github.com/stripe/stripe-go/v79/checkout/session"
)

func isZeroDecimalCurrency(c string) bool {
	switch strings.ToUpper(c) {
	case "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF":
		return true
	default:
		return false
	}
}

type checkoutRequest struct {
	Date       string   `json:"date"`
	TimeslotID string   `json:"timeslotId"` // backward-compatible single
	Timeslots  []string `json:"timeslots"`  // new: multiple
	CourtID    string   `json:"courtId"`
}

type checkoutResponse struct {
	URL   string `json:"url,omitempty"`
	Error string `json:"error,omitempty"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var req checkoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(checkoutResponse{Error: "invalid body"})
		return
	}
	if req.CourtID == "" {
		if v := r.URL.Query().Get("court"); v != "" {
			req.CourtID = v
		}
	}
	// Validate not booking in the past relative to server time and venue TZ
	// We treat the first selected timeslot's start time as the booking start cutoff.
	tz := os.Getenv("TIME_ZONE")
	if tz == "" {
		tz = "Asia/Jakarta"
	}
	loc, _ := time.LoadLocation(tz)
	// Currency and pricing (defaults for Indonesia Rupiah)
	priceCurrency := os.Getenv("PRICE_CURRENCY")
	if priceCurrency == "" {
		priceCurrency = "idr"
	}
	// Major units; for IDR Stripe uses zero-decimal, so 50000 = Rp 50,000
	pricePerSlot := int64(50000)
	if v := os.Getenv("PRICE_PER_SLOT"); v != "" {
		if parsed, err := strconv.ParseInt(v, 10, 64); err == nil && parsed > 0 {
			pricePerSlot = parsed
		}
	} else if v := os.Getenv("PRICE_PER_SLOT_CENTS"); v != "" { // backward-compat
		if parsed, err := strconv.ParseInt(v, 10, 64); err == nil && parsed > 0 {
			pricePerSlot = parsed
		}
	}
	unitAmount := pricePerSlot
	if !isZeroDecimalCurrency(priceCurrency) {
		unitAmount = pricePerSlot * 100
	}
	timeslots := req.Timeslots
	if len(timeslots) == 0 && req.TimeslotID != "" {
		timeslots = []string{req.TimeslotID}
	}
	if len(timeslots) > 0 && req.Date != "" {
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
					_ = json.NewEncoder(w).Encode(checkoutResponse{Error: "cannot book a past/soon timeslot"})
					return
				}
			}
		}
	}
	if len(timeslots) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(checkoutResponse{Error: "missing timeslots"})
		return
	}
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
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
		_ = json.NewEncoder(w).Encode(checkoutResponse{Error: err.Error()})
		return
	}
	_ = json.NewEncoder(w).Encode(checkoutResponse{URL: s.URL})
}
