package lockutil

import (
	"bytes"
	"encoding/binary"
	"sort"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Namespace constants for advisory locks. Each use case gets a unique prefix
// to prevent collisions. All advisory-lock usage must go through this package.
const (
	NSStaffSchedule int32 = 1 // staff availability modifications (appointments + time-offs)
)

// AcquireStaffScheduleLock acquires a transaction-scoped PostgreSQL advisory
// lock on a staff member's scheduling state. The lock auto-releases at
// COMMIT or ROLLBACK.
//
// Both appointment creation and time-off creation must acquire this lock
// before modifying a staff member's availability.
func AcquireStaffScheduleLock(db *gorm.DB, staffUserID uuid.UUID) error {
	staffKey := int32(binary.BigEndian.Uint32(staffUserID[:4]))
	return db.Exec("SELECT pg_advisory_xact_lock(?, ?)", NSStaffSchedule, staffKey).Error
}

// AcquireMultiStaffLock acquires advisory locks for multiple staff members
// in ascending UUID order to prevent deadlocks. For future use if an
// operation ever needs to lock more than one staff member.
func AcquireMultiStaffLock(db *gorm.DB, staffIDs []uuid.UUID) error {
	sorted := make([]uuid.UUID, len(staffIDs))
	copy(sorted, staffIDs)
	sort.Slice(sorted, func(i, j int) bool {
		return bytes.Compare(sorted[i][:], sorted[j][:]) < 0
	})
	for _, id := range sorted {
		if err := AcquireStaffScheduleLock(db, id); err != nil {
			return err
		}
	}
	return nil
}
