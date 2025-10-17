# Date & Time Handling Documentation

## Overview

The Courtly application uses client-side date/time handling to ensure accurate, real-time date selection and automatic updates when the date changes.

## How It Works

### 1. **Current Date Source**

The application gets the current date from the **user's local browser time** using:

```typescript
const today = startOfToday(); // from date-fns library
```

This ensures:

- ✅ Uses the user's local timezone
- ✅ Accurate to the user's location
- ✅ No server dependency for date calculation

### 2. **Automatic Date Shifting**

The `DateSelector` component implements **automatic date shifting** when the calendar date changes:

#### Features:

- **Midnight Refresh**: Automatically updates the date list at midnight (00:00:00)
- **Hourly Backup Check**: Checks every hour if the date has changed (backup mechanism)
- **Manual Refresh**: Updates when component remounts
- **7-Day Rolling Window**: Always shows the next 7 days from "today"

#### Implementation Details:

```typescript
useEffect(() => {
  // 1. Set initial current date
  setCurrentDate(startOfToday());

  // 2. Calculate time until next midnight
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  const msUntilMidnight = tomorrow.getTime() - now.getTime();

  // 3. Set timer to refresh at midnight
  const midnightTimer = setTimeout(() => {
    setCurrentDate(startOfToday());
  }, msUntilMidnight);

  // 4. Hourly check as backup
  const hourlyCheck = setInterval(() => {
    const newToday = startOfToday();
    if (format(newToday, 'yyyy-MM-dd') !== format(currentDate, 'yyyy-MM-dd')) {
      setCurrentDate(newToday);
    }
  }, 60 * 60 * 1000);

  // Cleanup
  return () => {
    clearTimeout(midnightTimer);
    clearInterval(hourlyCheck);
  };
}, [currentDate]);
```

### 3. **Real-Time Clock Display**

The `CurrentDateTime` component shows:

- Current date in long format (e.g., "Thursday, October 17, 2025")
- Current time with seconds (updates every second)
- User's timezone (e.g., "America/New_York")

This helps users understand:

- ✅ What date they're booking for
- ✅ Current local time
- ✅ Their timezone context

## Example Scenarios

### Scenario 1: Booking Before Midnight

**Time:** October 17, 2025 at 11:30 PM

- User sees dates: Oct 17 - Oct 31 (7 days)
- At midnight (00:00:00), the list automatically shifts
- New dates: Oct 18 - Nov 1 (7 days)
- "Today" badge moves to Oct 18

### Scenario 2: User Leaves Tab Open Overnight

**Start:** October 17, 2025 at 11:45 PM

1. User opens booking page
2. Sees dates: Oct 17 - Oct 31
3. Leaves browser tab open
4. Falls asleep
5. **At midnight**: Timer triggers
6. **Page automatically updates**: Oct 18 - Nov 1
7. User wakes up and sees updated dates ✅

### Scenario 3: Multiple Timezones

**User in Tokyo (JST):** October 18, 2025 at 2:00 AM
**User in New York (EST):** October 17, 2025 at 1:00 PM

- Tokyo user sees: Oct 18 - Nov 1
- New York user sees: Oct 17 - Oct 31
- Each user books in their local timezone
- Backend stores as ISO date string (YYYY-MM-DD)

## Technical Details

### Libraries Used

1. **date-fns**

   - `startOfToday()`: Gets start of current day (00:00:00) in local timezone
   - `addDays()`: Adds days to a date
   - `format()`: Formats dates for display and comparison

2. **JavaScript Date API**
   - `new Date()`: Gets current timestamp
   - `toLocaleTimeString()`: Formats time in user's locale
   - `toLocaleDateString()`: Formats date in user's locale
   - `Intl.DateTimeFormat()`: Gets timezone information

### Timezone Handling

The application is **timezone-aware**:

- Frontend uses **local timezone** for display
- Dates are compared as YYYY-MM-DD strings (timezone-neutral)
- Backend stores dates as strings (e.g., "2025-10-17")
- Time slots use 24-hour format strings (e.g., "14:00", "15:00")

### Benefits of This Approach

1. **No Server Dependency**: Date calculation happens client-side
2. **Real-Time Updates**: Always shows correct "today"
3. **Automatic Shifting**: No manual refresh needed
4. **User-Friendly**: Shows dates in user's local format
5. **Reliable**: Multiple fallback mechanisms (midnight timer + hourly check)
6. **Timezone-Safe**: Each user sees their local time

## Edge Cases Handled

### 1. Computer Sleep/Wake

- Hourly check detects date change after wake
- Updates date list automatically

### 2. Daylight Saving Time

- Uses `startOfToday()` which handles DST transitions
- Timer recalculates correctly

### 3. Date Change During Selection

- If user is selecting a court at 11:59 PM
- And date changes at midnight
- Previous selection remains valid (stored as date object)
- Only the available dates list refreshes

### 4. Browser Tab Inactive

- Timers continue running even when tab is inactive
- Updates still happen at midnight

## Testing Date Shifting

To test the automatic date shift:

### Method 1: Change System Date

```
1. Open booking page
2. Note current dates shown
3. Change computer date to tomorrow
4. Wait for hourly check (or refresh page)
5. Dates should shift forward by 1 day
```

### Method 2: Wait Until Midnight

```
1. Open page before midnight
2. Keep browser tab open
3. Wait until 00:00:00
4. Watch dates automatically update
5. "Today" badge moves to new date
```

### Method 3: Console Testing

```javascript
// In browser console, you can force a date change:
// (Note: This is just for understanding, actual implementation is in component)

// See current date
console.log(new Date().toLocaleDateString());

// Check what date-fns considers "today"
import { startOfToday, format } from 'date-fns';
console.log(format(startOfToday(), 'yyyy-MM-dd'));
```

## Performance Considerations

- **Timers**: Uses only 2 timers per component instance
- **Memory**: Timers are cleaned up on component unmount
- **Updates**: State updates only when date actually changes
- **Rendering**: Minimal re-renders due to proper React optimization

## Future Enhancements

Potential improvements for date/time handling:

1. **Server Time Sync**: Optional server time synchronization
2. **Timezone Selection**: Allow users to book in different timezones
3. **Date Range Limits**: Configurable booking window (e.g., 30 days instead of 14)
4. **Booking Cutoff**: Don't show today if current time is past certain hour
5. **Past Date Handling**: Gray out dates that have passed during the day
6. **Holiday Detection**: Mark holidays or special dates

## API Integration

The selected date is sent to the API as:

```typescript
// Frontend formats as YYYY-MM-DD
const dateStr = format(selectedDate, 'yyyy-MM-dd'); // "2025-10-17"

// API endpoint
GET /api/timeslots?date=2025-10-17
GET /api/courts/available?date=2025-10-17&timeslot=5
```

This format is:

- ✅ Timezone-neutral
- ✅ ISO 8601 compliant
- ✅ Database-friendly
- ✅ Sortable as string

## Summary

The date/time system in Courtly:

✅ **Gets time from**: User's browser/device local time
✅ **Updates automatically**: At midnight and hourly checks
✅ **Shifts dates**: Rolling 7-Day window from "today"
✅ **Handles timezones**: Uses local timezone for display
✅ **Shows real-time clock**: Updates every second
✅ **Reliable**: Multiple fallback mechanisms
✅ **User-friendly**: Clear visual indicators

The implementation ensures users always see accurate, up-to-date booking options based on their local date and time.
