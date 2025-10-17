# Time Slot Availability & Past Time Handling

## Overview

The TimeSlotSelector component intelligently handles time slot availability based on:
1. Whether the slot is already booked
2. Whether the time has passed (for today's bookings)
3. Real-time updates as time progresses

## Features

### 1. **Automatic Disabling of Past Time Slots**

When a user selects **today's date**, any time slots where the start time has passed become:
- ✅ **Visible** (still shown in the list)
- ❌ **Unclickable** (disabled state)
- 🔒 **Locked icon** (visual indicator)
- 🏷️ **"Passed" badge** (clear status label)

### 2. **Real-Time Updates**

The component updates every minute to check for newly passed time slots:
- Updates every 60 seconds
- Automatically disables slots as time progresses
- No page refresh needed

### 3. **Smart Date Logic**

- **Today's date**: Checks if time has passed
- **Future dates**: All slots remain available (time hasn't passed yet)
- **Past dates**: Would need additional validation (not typically shown)

## How It Works

### Time Checking Logic

```typescript
const isTimePassed = (slotStartTime: string): boolean => {
  // Only check if the selected date is today
  if (!isToday(selectedDate)) {
    return false; // Future dates are always available
  }

  // Parse slot time (e.g., "14:00")
  const [hours, minutes] = slotStartTime.split(':').map(Number);
  const slotDateTime = new Date();
  slotDateTime.setHours(hours, minutes, 0, 0);

  // Compare with current time
  return currentTime >= slotDateTime;
};
```

### Visual States

| Condition | Appearance | Icon | Badge | Clickable |
|-----------|-----------|------|-------|-----------|
| Available & Future Time | Normal style | 🕐 Clock | None | ✅ Yes |
| Available & Time Passed | Grayed out | 🔒 Lock | "Passed" (gray) | ❌ No |
| Already Booked | Grayed out | 🕐 Clock | "Booked" (red) | ❌ No |
| Selected Slot | Highlighted blue | 🕐 Clock (blue) | None | ✅ Yes |

## Example Scenarios

### Scenario 1: Morning Booking (Current time: 10:30 AM)

**Selected Date**: Today (Oct 17, 2025)

```
Time Slots:
✅ 08:00 - 09:00  [Passed] 🔒        ← Disabled (time passed)
✅ 09:00 - 10:00  [Passed] 🔒        ← Disabled (time passed)
✅ 10:00 - 11:00  [Passed] 🔒        ← Disabled (currently in progress)
✓  11:00 - 12:00                     ← Available ✨
✓  12:00 - 13:00                     ← Available ✨
✓  13:00 - 14:00                     ← Available ✨
...
```

### Scenario 2: Afternoon Booking (Current time: 2:45 PM)

**Selected Date**: Today (Oct 17, 2025)

```
Time Slots:
✅ 08:00 - 09:00  [Passed] 🔒        ← Disabled
✅ 09:00 - 10:00  [Passed] 🔒        ← Disabled
✅ 10:00 - 11:00  [Passed] 🔒        ← Disabled
✅ 11:00 - 12:00  [Passed] 🔒        ← Disabled
✅ 12:00 - 13:00  [Passed] 🔒        ← Disabled
✅ 13:00 - 14:00  [Passed] 🔒        ← Disabled
✅ 14:00 - 15:00  [Passed] 🔒        ← Disabled (in progress)
✓  15:00 - 16:00                     ← Available ✨
✓  16:00 - 17:00                     ← Available ✨
✓  17:00 - 18:00                     ← Available ✨
...
```

### Scenario 3: Future Date Booking

**Selected Date**: Tomorrow (Oct 18, 2025)
**Current Time**: Any time today

```
Time Slots:
✓  08:00 - 09:00                     ← All slots available ✨
✓  09:00 - 10:00                     ← No time restrictions
✓  10:00 - 11:00                     ← For future dates
✓  11:00 - 12:00  
✓  12:00 - 13:00  
...
```

### Scenario 4: Mixed Availability

**Selected Date**: Today at 3:15 PM
**Some slots already booked**

```
Time Slots:
✅ 08:00 - 09:00  [Passed] 🔒        ← Time passed
✅ 09:00 - 10:00  [Booked] 🕐        ← Already booked by someone
✅ 10:00 - 11:00  [Passed] 🔒        ← Time passed
✓  11:00 - 12:00                     ← Would be available but...
✅ 12:00 - 13:00  [Passed] 🔒        ← Time passed
✅ 13:00 - 14:00  [Passed] 🔒        ← Time passed
✅ 14:00 - 15:00  [Passed] 🔒        ← Time passed
✅ 15:00 - 16:00  [Passed] 🔒        ← Currently in progress
✓  16:00 - 17:00                     ← Available ✨
✅ 17:00 - 18:00  [Booked] 🕐        ← Already booked
✓  18:00 - 19:00                     ← Available ✨
```

## Technical Implementation

### State Management

```typescript
const [currentTime, setCurrentTime] = useState<Date>(new Date());

// Update every minute
useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 60000); // 60,000ms = 1 minute

  return () => clearInterval(timer);
}, []);
```

### Button States

```typescript
const hasPassed = isTimePassed(slot.startTime);
const isDisabled = !slot.available || hasPassed;
```

### Visual Feedback

1. **Lock Icon**: Shows for passed time slots
2. **Clock Icon**: Shows for available/booked slots
3. **Badge Color**:
   - Gray "Passed" for past times
   - Red "Booked" for reserved slots
4. **Opacity**: Disabled slots are faded (50% opacity)

## User Experience Benefits

### Clear Communication
- Users immediately see which slots are no longer available
- Different visual indicators for different unavailability reasons
- Tooltips could be added for additional clarity

### Prevents Booking Errors
- Users can't accidentally book a time that has already passed
- Reduces failed bookings and customer frustration
- Server validation still needed as backup

### Real-Time Accuracy
- Updates automatically as time progresses
- No manual refresh needed
- Stays accurate even if page is left open

## Edge Cases Handled

### 1. **Time Slot Currently In Progress**
If current time is 2:30 PM and slot is 2:00-3:00 PM:
- Slot is marked as "Passed" ✅
- User cannot book it

### 2. **Time Zone Considerations**
- Uses local browser time
- Consistent with date selection
- Server should validate with proper timezone handling

### 3. **Slot Starting in <1 Minute**
If current time is 2:59 PM and slot is 3:00-4:00 PM:
- Slot is still available (hasn't started yet)
- Will become unavailable at 3:00 PM
- Updates within 1 minute

### 4. **User Leaves Page Open**
- Timer continues running
- Updates happen every minute
- Slots become disabled automatically

### 5. **Clock Accuracy**
- Uses device time (can be off if device clock is wrong)
- Consider adding server time sync for critical applications
- Current implementation trusts client time

## Configuration Options

### Update Frequency
```typescript
// Current: Every 1 minute
const UPDATE_INTERVAL = 60000;

// Could be changed to:
const UPDATE_INTERVAL = 30000;  // 30 seconds (more responsive)
const UPDATE_INTERVAL = 120000; // 2 minutes (less load)
```

### Grace Period (Optional Enhancement)
```typescript
// Add a grace period (e.g., 5 minutes before slot)
const isTimePassed = (slotStartTime: string): boolean => {
  // ... existing code ...
  
  const GRACE_PERIOD_MINUTES = 5;
  const graceTime = new Date(slotDateTime);
  graceTime.setMinutes(graceTime.getMinutes() - GRACE_PERIOD_MINUTES);
  
  return currentTime >= graceTime;
};
```

## Testing

### Manual Testing Steps

1. **Test Past Times**:
   - Select today's date
   - Verify slots before current time are disabled
   - Check lock icon appears
   - Try clicking disabled slots

2. **Test Future Dates**:
   - Select tomorrow
   - Verify all slots are enabled
   - No "Passed" badges should appear

3. **Test Real-Time Updates**:
   - Open page a few minutes before a slot time
   - Wait until slot time passes
   - Verify slot becomes disabled within 1 minute

4. **Test Mixed States**:
   - Verify "Booked" and "Passed" are both handled
   - Check correct icons and colors
   - Ensure proper disabled state

### Automated Testing (Suggested)

```typescript
describe('TimeSlotSelector - Past Time Handling', () => {
  it('should disable slots that have passed', () => {
    // Mock current time to 2:00 PM
    // Select today's date
    // Verify 8:00 AM slot is disabled
    // Verify 3:00 PM slot is enabled
  });

  it('should enable all slots for future dates', () => {
    // Select tomorrow's date
    // Verify all slots are enabled
  });

  it('should update as time progresses', () => {
    // Open component at 1:59 PM
    // Fast-forward time to 2:01 PM
    // Verify 2:00 PM slot becomes disabled
  });
});
```

## Future Enhancements

1. **Server Time Synchronization**
   - Fetch server time periodically
   - Adjust for client/server time differences
   - More accurate for critical applications

2. **Booking Buffer Time**
   - Require X minutes notice for bookings
   - E.g., can't book slot starting in next 15 minutes

3. **Countdown Timer**
   - Show "Available for next X minutes"
   - Warning as slot time approaches

4. **Smart Sorting**
   - Move passed slots to bottom of list
   - Or hide them completely (optional)

5. **Tooltip Information**
   - Hover to see exact reason
   - "This slot started at 2:00 PM"

## Summary

The time slot system now intelligently:
✅ Disables past time slots for today's bookings
✅ Keeps future dates fully available
✅ Updates automatically every minute
✅ Shows clear visual indicators (lock icon, "Passed" badge)
✅ Prevents booking errors
✅ Provides great user experience

This ensures users can only book valid, available time slots, reducing errors and improving the overall booking flow!
