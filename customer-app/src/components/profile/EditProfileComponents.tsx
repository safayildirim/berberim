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
import { useTheme } from '@/src/store/useThemeStore';

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
  const { colors } = useTheme();

  return (
    <View style={styles.avatarContainer}>
      <View style={styles.avatarWrapper}>
        <Image
          source={{
            uri:
              uri ||
              'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop',
          }}
          style={[styles.avatar, { borderColor: colors.outlineVariant }]}
        />
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={[styles.cameraButton, { backgroundColor: primaryColor }]}
        >
          <Camera size={14} color={colors.white} strokeWidth={3} />
        </TouchableOpacity>
      </View>
      <Typography
        variant="label"
        style={[styles.changeText, { color: colors.secondary }]}
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
  const { colors } = useTheme();

  return (
    <View style={styles.fieldContainer}>
      <Typography
        variant="caption"
        style={[styles.fieldLabel, { color: colors.secondary }]}
      >
        {label}
      </Typography>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surfaceContainer,
            borderColor: colors.outlineVariant,
            borderWidth: 1,
          },
          disabled && styles.disabledInput,
        ]}
      >
        {Icon && (
          <Icon size={16} color={colors.secondary} style={styles.inputIcon} />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.onSurfaceVariant}
          editable={!disabled}
          style={[styles.input, { color: colors.text }]}
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
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputContainer: {
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
  },
  inputIcon: {
    marginRight: 10,
  },
  disabledInput: {
    opacity: 0.6,
  },
});
