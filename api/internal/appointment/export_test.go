package appointment

import "time"

// ISOWeekBoundsForTest exports isoWeekBounds for unit tests.
func ISOWeekBoundsForTest(t time.Time) (time.Time, time.Time) {
	return isoWeekBounds(t)
}
