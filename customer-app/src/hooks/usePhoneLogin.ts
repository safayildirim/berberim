import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useRequestOtp } from '@/src/hooks/mutations/useAuthMutations';

export const usePhoneLogin = () => {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const { mutate: requestOtp, isPending } = useRequestOtp();

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text.replace(/\D/g, '').slice(0, 10));
  };

  const formatPhone = (digits: string): string => {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 8)
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  };

  const isValid = phoneNumber.length === 10 && phoneNumber.startsWith('5');
  const hasError = phoneNumber.length === 10 && !isValid;

  const handleSendOTP = () => {
    if (!isValid) return;

    requestOtp(
      { phone_number: phoneNumber },
      {
        onSuccess: () => {
          router.push({
            pathname: '/(auth)/otp-verification',
            params: {
              phone: phoneNumber,
            },
          });
        },
        onError: (error: any) => {
          console.error('OTP request failed', error);
        },
      },
    );
  };

  return {
    phoneNumber,
    formattedPhone: formatPhone(phoneNumber),
    handlePhoneChange,
    handleSendOTP,
    isPending,
    isValid,
    hasError,
  };
};
