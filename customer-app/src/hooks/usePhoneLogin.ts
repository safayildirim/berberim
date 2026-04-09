import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useRequestOtp } from '@/src/hooks/mutations/useAuthMutations';

export const usePhoneLogin = () => {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const { mutate: requestOtp, isPending } = useRequestOtp();

  const handleSendOTP = () => {
    if (phoneNumber.length < 10) return;

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const cleanCountryCode = '90';
    const fullPhoneNumber = `${cleanCountryCode}${cleanPhone}`;

    requestOtp(
      { phone_number: fullPhoneNumber },
      {
        onSuccess: () => {
          router.push({
            pathname: '/(auth)/otp-verification',
            params: {
              phone: fullPhoneNumber,
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
    setPhoneNumber,
    handleSendOTP,
    isPending,
    isValid: phoneNumber.length >= 10,
  };
};
