import { create } from 'zustand';
import {
  Appointment,
  AvailabilitySlot,
  BookingEntryPoint,
  Service,
  Staff,
  StaffChoice,
  StaffOption,
} from '@/src/types';

interface RebookSource {
  appointmentId: string;
  originalStaffName: string | null;
}

interface BookingState {
  entryPoint: BookingEntryPoint;
  selectedServiceIds: string[];
  selectedServicesSnapshot: Service[];
  selectedStaffChoice: StaffChoice;
  selectedStaffId: string | null;
  selectedStaffSnapshot: StaffOption | Staff | null;
  lockedStaffId: string | null;
  selectedSlot: AvailabilitySlot | null;
  selectedDate: string | null;
  notes: string;
  estimatedDurationMinutes: number;
  estimatedPrice: number;
  idempotencyKey: string;
  isRebookMode: boolean;
  rebookSource: RebookSource | null;

  // Compatibility selectors for screens that are being migrated.
  selectedServices: Service[];
  selectedStaff: Staff | null;
  totalDuration: number;
  totalPrice: number;

  startFlow: (entryPoint?: BookingEntryPoint, staff?: Staff | null) => void;
  toggleService: (service: Service) => void;
  setStaffChoice: (
    choice: StaffChoice,
    staff?: StaffOption | Staff | null,
  ) => void;
  setStaff: (staff: Staff | StaffOption | null) => void;
  setSlot: (slot: AvailabilitySlot | null) => void;
  setSelectedDate: (date: string | null) => void;
  setNotes: (notes: string) => void;
  setFromExisting: (appointment: Appointment) => void;
  reset: () => void;
}

const newIntentKey = () =>
  `booking_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const computeTotals = (services: Service[]) => ({
  estimatedDurationMinutes: services.reduce(
    (sum, service) => sum + service.duration_minutes,
    0,
  ),
  estimatedPrice: services.reduce(
    (sum, service) => sum + Number(service.base_price || 0),
    0,
  ),
});

const toStaff = (staff: Staff | StaffOption | null): Staff | null => {
  if (!staff) return null;
  const raw = staff as Staff & Partial<StaffOption>;
  if (raw.id) return staff as Staff;
  return {
    id: raw.staff_user_id || '',
    staff_user_id: raw.staff_user_id,
    first_name: raw.first_name,
    last_name: raw.last_name,
    role: 'staff',
    avatar: raw.avatar_url,
    specialty: raw.specialty,
    bio: raw.bio,
    avg_rating: raw.avg_rating,
    review_count: raw.review_count,
  };
};

const getStaffId = (staff: Staff | StaffOption | null): string | null => {
  if (!staff) return null;
  const raw = staff as Staff & Partial<StaffOption>;
  return raw.id || raw.staff_user_id || null;
};

const initialState = () => ({
  entryPoint: 'services_first' as BookingEntryPoint,
  selectedServiceIds: [],
  selectedServicesSnapshot: [],
  selectedStaffChoice: 'any' as StaffChoice,
  selectedStaffId: null,
  selectedStaffSnapshot: null,
  lockedStaffId: null,
  selectedSlot: null,
  selectedDate: null,
  notes: '',
  estimatedDurationMinutes: 0,
  estimatedPrice: 0,
  idempotencyKey: newIntentKey(),
  isRebookMode: false,
  rebookSource: null,
  selectedServices: [],
  selectedStaff: null,
  totalDuration: 0,
  totalPrice: 0,
});

export const useBookingStore = create<BookingState>((set, get) => ({
  ...initialState(),

  startFlow: (entryPoint = 'services_first', staff = null) => {
    const staffId = getStaffId(staff);
    set({
      ...initialState(),
      entryPoint,
      lockedStaffId: entryPoint === 'staff_first' ? staffId : null,
      selectedStaffChoice: staffId ? 'specific' : 'any',
      selectedStaffId: staffId,
      selectedStaffSnapshot: staff,
      selectedStaff: toStaff(staff),
    });
  },

  toggleService: (service) => {
    const { selectedServicesSnapshot, lockedStaffId } = get();
    const exists = selectedServicesSnapshot.some((s) => s.id === service.id);
    const nextServices = exists
      ? selectedServicesSnapshot.filter((s) => s.id !== service.id)
      : [...selectedServicesSnapshot, service];
    const totals = computeTotals(nextServices);

    set((state) => ({
      selectedServiceIds: nextServices.map((s) => s.id),
      selectedServicesSnapshot: nextServices,
      selectedServices: nextServices,
      estimatedDurationMinutes: totals.estimatedDurationMinutes,
      estimatedPrice: totals.estimatedPrice,
      totalDuration: totals.estimatedDurationMinutes,
      totalPrice: totals.estimatedPrice,
      selectedSlot: null,
      selectedStaffChoice:
        state.entryPoint === 'staff_first' && lockedStaffId
          ? 'specific'
          : 'any',
      selectedStaffId:
        state.entryPoint === 'staff_first' ? lockedStaffId : null,
      selectedStaffSnapshot:
        state.entryPoint === 'staff_first' ? state.selectedStaffSnapshot : null,
      selectedStaff:
        state.entryPoint === 'staff_first' ? state.selectedStaff : null,
    }));
  },

  setStaffChoice: (choice, staff = null) =>
    set({
      selectedStaffChoice: choice,
      selectedStaffId: choice === 'specific' ? getStaffId(staff) : null,
      selectedStaffSnapshot: choice === 'specific' ? staff : null,
      selectedStaff: choice === 'specific' ? toStaff(staff) : null,
    }),

  setStaff: (staff) => {
    if (!staff) {
      set({
        selectedStaffChoice: 'any',
        selectedStaffId: null,
        selectedStaffSnapshot: null,
        selectedStaff: null,
      });
      return;
    }
    set({
      selectedStaffChoice: 'specific',
      selectedStaffId: getStaffId(staff),
      selectedStaffSnapshot: staff,
      selectedStaff: toStaff(staff),
    });
  },

  setSlot: (slot) =>
    set((state) => {
      const selectedStaffStillAvailable =
        !state.selectedStaffId ||
        !!slot?.available_staff.some(
          (staff) => staff.staff_user_id === state.selectedStaffId,
        );

      return {
        selectedSlot: slot,
        selectedDate: slot?.starts_at.slice(0, 10) ?? state.selectedDate,
        selectedStaffChoice: selectedStaffStillAvailable
          ? state.selectedStaffChoice
          : 'any',
        selectedStaffId: selectedStaffStillAvailable
          ? state.selectedStaffId
          : null,
        selectedStaffSnapshot: selectedStaffStillAvailable
          ? state.selectedStaffSnapshot
          : null,
        selectedStaff: selectedStaffStillAvailable ? state.selectedStaff : null,
      };
    }),

  setSelectedDate: (date) => set({ selectedDate: date }),
  setNotes: (notes) => set({ notes }),

  setFromExisting: (appointment: Appointment) => {
    const mappedServices: Service[] = appointment.services.map((s) => ({
      id: s.service_id,
      name: s.service_name,
      description: '',
      duration_minutes: s.duration_minutes,
      base_price: s.price,
      category_name: '',
    }));
    const totals = computeTotals(mappedServices);
    const staffName = appointment.staff
      ? `${appointment.staff.first_name} ${appointment.staff.last_name}`
      : null;

    set({
      ...initialState(),
      entryPoint: 'rebook',
      selectedServiceIds: mappedServices.map((s) => s.id),
      selectedServicesSnapshot: mappedServices,
      selectedServices: mappedServices,
      notes: appointment.notes || '',
      estimatedDurationMinutes: totals.estimatedDurationMinutes,
      estimatedPrice: totals.estimatedPrice,
      totalDuration: totals.estimatedDurationMinutes,
      totalPrice: totals.estimatedPrice,
      isRebookMode: true,
      rebookSource: {
        appointmentId: appointment.id,
        originalStaffName: staffName,
      },
    });
  },

  reset: () => set(initialState()),
}));
