import { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useVerifyOtp,
  useRequestOtp,
} from '@/src/hooks/mutations/useAuthMutations';

export const useOTPVerification = () => {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);

  const { mutate: verifyOtp, isPending, error: verifyError } = useVerifyOtp();
  const { mutate: requestOtp, isPending: isResending } = useRequestOtp();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = useCallback(() => {
    if (code.length < 6) return;

    verifyOtp(
      { phone_number: phone as string, code },
      {
        onSuccess: () => {
          // After OTP verification, go to root which handles routing:
          // no tenants → link-code, multiple → select-tenant, one → tabs
          router.replace('/');
        },
      },
    );
  }, [code, phone, verifyOtp, router]);

  const handleResend = useCallback(() => {
    if (!canResend) return;

    requestOtp(
      { phone_number: phone as string },
      {
        onSuccess: () => {
          setTimer(59);
          setCanResend(false);
          setCode('');
        },
      },
    );
  }, [canResend, phone, requestOtp]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    phone,
    code,
    setCode,
    timer: formatTimer(timer),
    canResend,
    handleVerify,
    handleResend,
    isPending,
    isResending,
    verifyError,
    isValid: code.length === 6,
  };
};
