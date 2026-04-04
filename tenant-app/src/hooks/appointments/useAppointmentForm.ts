import { useState } from 'react';
import { Customer } from '@/src/types';

interface AppointmentFormProps {
  initialDate?: string;
  initialTime?: string;
}

export const useAppointmentForm = ({
  initialDate,
  initialTime,
}: AppointmentFormProps = {}) => {
  const [step, setStep] = useState(1);
  const [customerSearch, setCustomerSearch] = useState('');
  const [professionalSearch, setProfessionalSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(initialDate ?? '');
  const [selectedTime, setSelectedTime] = useState(initialTime ?? '');

  const hasPrefilledDateTime = !!(initialDate && initialTime);
  const totalSteps = hasPrefilledDateTime ? 4 : 5;
  const displayStep = hasPrefilledDateTime && step === 5 ? 4 : step;

  const handleNext = () => {
    // If we're at step 3 (Services) and date/time is already set (long press flow), skip to review
    if (hasPrefilledDateTime && step === 3) {
      setStep(5);
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = (onHome: () => void) => {
    if (step === 1) {
      onHome();
    } else if (hasPrefilledDateTime && step === 5) {
      setStep(3);
    } else {
      setStep((prev) => prev - 1);
    }
  };

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const reset = () => {
    setStep(1);
    setCustomerSearch('');
    setProfessionalSearch('');
    setServiceSearch('');
    setSelectedCustomer(null);
    setSelectedServices([]);
    setSelectedStaff(null);
    setSelectedDate(initialDate ?? '');
    setSelectedTime(initialTime ?? '');
  };

  return {
    step,
    setStep,
    displayStep,
    totalSteps,
    customerSearch,
    setCustomerSearch,
    professionalSearch,
    setProfessionalSearch,
    serviceSearch,
    setServiceSearch,
    selectedCustomer,
    setSelectedCustomer,
    selectedServices,
    setSelectedServices,
    selectedStaff,
    setSelectedStaff,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    handleNext,
    handleBack,
    toggleService,
    reset,
    hasPrefilledDateTime,
  };
};
