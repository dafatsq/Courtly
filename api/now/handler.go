package main

import (
	"encoding/json"
	"net/http"
	"os"
	"time"
)

type nowResponse struct {
	NowUnixMs        int64  `json:"nowUnixMs"`
	NowISO           string `json:"nowISO"`
	Timezone         string `json:"timezone"`
	UTCOffsetMinutes int    `json:"utcOffsetMinutes"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
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

	resp := nowResponse{
		NowUnixMs:        nowLoc.UnixNano() / int64(time.Millisecond),
		NowISO:           nowLoc.Format(time.RFC3339),
		Timezone:         tz,
		UTCOffsetMinutes: offset / 60,
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}
