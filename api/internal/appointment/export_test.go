package appointment

import "time"

// ISOWeekBoundsForTest exports isoWeekBounds for unit tests.
func ISOWeekBoundsForTest(t time.Time) (time.Time, time.Time) {
	return isoWeekBounds(t)
}

// TestWindow is the exported version of openWindow for tests.
// Fields are exported so tests in package appointment_test can read them.
type TestWindow struct {
	StartsAt time.Time
	EndsAt   time.Time
}

// ComputeOpenWindowsForTest exports computeOpenWindows for unit tests.
func ComputeOpenWindowsForTest(
	serviceDuration, effectiveDuration time.Duration,
	rules []ScheduleRule,
	timeOffs []TimeOff,
	booked []BookedSlot,
	breaks []ScheduleBreak,
	date time.Time,
	loc *time.Location,
) []TestWindow {
	ws := computeOpenWindows(serviceDuration, effectiveDuration, rules, timeOffs, booked, breaks, date, loc)
	out := make([]TestWindow, len(ws))
	for i, w := range ws {
		out[i] = TestWindow{StartsAt: w.startsAt, EndsAt: w.endsAt}
	}
	return out
}

// ComputeBlockedWindowsForTest exports computeBlockedWindows for unit tests.
func ComputeBlockedWindowsForTest(
	serviceDuration, effectiveDuration time.Duration,
	rules []ScheduleRule,
	timeOffs []TimeOff,
	booked []BookedSlot,
	breaks []ScheduleBreak,
	date time.Time,
	loc *time.Location,
) []TestWindow {
	ws := computeBlockedWindows(serviceDuration, effectiveDuration, rules, timeOffs, booked, breaks, date, loc)
	out := make([]TestWindow, len(ws))
	for i, w := range ws {
		out[i] = TestWindow{StartsAt: w.startsAt, EndsAt: w.endsAt}
	}
	return out
}

// OverlapsBreaksForTest exports overlapsBreaks for unit tests.
func OverlapsBreaksForTest(start, end time.Time, breaks []ScheduleBreak, date time.Time, loc *time.Location) bool {
	return overlapsBreaks(start, end, breaks, date, loc)
}
