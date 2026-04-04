import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { adminService } from '@/src/services/admin.service';

export type StaffRole = 'staff' | 'admin';

export const useAddStaff = () => {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<StaffRole>('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert(
        'Missing Fields',
        'Please complete all professional credentials.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.createStaff({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        role,
      });
      Alert.alert(
        'Success',
        'Staff member has been integrated into the team.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        'There was an error adding the professional.';
      Alert.alert('Integration Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form: {
      firstName,
      setFirstName,
      lastName,
      setLastName,
      email,
      setEmail,
      password,
      setPassword,
      role,
      setRole,
    },
    ui: {
      showPassword,
      togglePasswordVisibility,
      isSubmitting,
    },
    actions: {
      handleSubmit,
    },
  };
};
