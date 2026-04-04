import { Camera, Mail } from 'lucide-react-native';
import React from 'react';
import {
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, SIZES, TYPOGRAPHY } from '@/src/constants/theme';
import { Typography } from '@/src/components/ui';

/**
 * Avatar Edit Section
 */
interface AvatarEditProps {
  uri?: string;
  onPress: () => void;
  primaryColor: string;
  label: string;
}

export const AvatarEdit: React.FC<AvatarEditProps> = ({
  uri,
  onPress,
  primaryColor,
  label,
}) => {
  return (
    <View style={styles.avatarContainer}>
      <View style={styles.avatarWrapper}>
        <Image
          source={{
            uri:
              uri ||
              'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop',
          }}
          style={styles.avatar}
        />
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={[styles.cameraButton, { backgroundColor: primaryColor }]}
        >
          <Camera size={14} color={COLORS.white} strokeWidth={3} />
        </TouchableOpacity>
      </View>
      <Typography
        variant="label"
        color={COLORS.secondary}
        style={styles.changeText}
      >
        {label}
      </Typography>
    </View>
  );
};

/**
 * Form Field Component
 */
interface FormFieldProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  icon?: typeof Mail;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  disabled = false,
  icon: Icon,
}) => {
  return (
    <View style={styles.fieldContainer}>
      <Typography variant="caption" style={styles.fieldLabel}>
        {label}
      </Typography>
      <View style={[styles.inputContainer, disabled && styles.disabledInput]}>
        {Icon && (
          <Icon size={16} color={COLORS.secondary} style={styles.inputIcon} />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.onSurfaceVariant}
          editable={!disabled}
          style={styles.input}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    marginBottom: SIZES.xl * 1.5,
  },
  avatarWrapper: {
    position: 'relative',
    width: 128,
    height: 128,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 64,
    borderWidth: 2,
    borderColor: COLORS.surfaceContainerHigh,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  changeText: {
    marginTop: 12,
    fontWeight: '600',
    fontSize: 14,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    color: COLORS.secondary,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputContainer: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: {
    ...TYPOGRAPHY.body,
    flex: 1,
    height: '100%',
    color: COLORS.text,
  },
  inputIcon: {
    marginRight: 10,
  },
  disabledInput: {
    opacity: 0.6,
  },
});
