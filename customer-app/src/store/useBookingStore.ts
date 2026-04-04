import { create } from 'zustand';
import { Appointment, AvailabilitySlot, Service, Staff } from '@/src/types';

interface RebookSource {
  appointmentId: string;
  originalStaffName: string | null;
}

interface BookingState {
  selectedServices: Service[];
  selectedStaff: Staff | null; // null means "No Preference"
  selectedSlot: AvailabilitySlot | null;
  notes: string;
  totalDuration: number;
  totalPrice: number;
  isRebookMode: boolean;
  rebookSource: RebookSource | null;

  // Actions
  toggleService: (service: Service) => void;
  setStaff: (staff: Staff | null) => void;
  setSlot: (slot: AvailabilitySlot | null) => void;
  setNotes: (notes: string) => void;
  setFromExisting: (appointment: Appointment) => void;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  selectedServices: [],
  selectedStaff: null,
  selectedSlot: null,
  notes: '',
  totalDuration: 0,
  totalPrice: 0,
  isRebookMode: false,
  rebookSource: null,

  toggleService: (service) => {
    const { selectedServices } = get();
    const isAlreadySelected = selectedServices.find((s) => s.id === service.id);

    let nextServices;
    if (isAlreadySelected) {
      nextServices = selectedServices.filter((s) => s.id !== service.id);
    } else {
      nextServices = [...selectedServices, service];
    }

    const duration = nextServices.reduce(
      (sum, s) => sum + s.duration_minutes,
      0,
    );
    const price = nextServices.reduce(
      (sum, s) => sum + Number(s.base_price || 0),
      0,
    );

    set({
      selectedServices: nextServices,
      totalDuration: duration,
      totalPrice: price,
      selectedSlot: null, // Reset slot if services change as duration might change availability
    });
  },

  setStaff: (staff) => set({ selectedStaff: staff }),
  setSlot: (slot) => set({ selectedSlot: slot }),
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

    const staffName = appointment.staff
      ? `${appointment.staff.first_name} ${appointment.staff.last_name}`
      : null;

    set({
      selectedServices: mappedServices,
      selectedStaff: appointment.staff || null,
      selectedSlot: null, // User must pick a new slot for rebooking
      notes: appointment.notes || '',
      totalDuration: mappedServices.reduce(
        (sum, s) => sum + s.duration_minutes,
        0,
      ),
      totalPrice: Number(appointment.total_price) || 0,
      isRebookMode: true,
      rebookSource: {
        appointmentId: appointment.id,
        originalStaffName: staffName,
      },
    });
  },
  reset: () =>
    set({
      selectedServices: [],
      selectedStaff: null,
      selectedSlot: null,
      notes: '',
      totalDuration: 0,
      totalPrice: 0,
      isRebookMode: false,
      rebookSource: null,
    }),
}));
