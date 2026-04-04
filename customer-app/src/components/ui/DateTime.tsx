import { format, isValid, parseISO } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, TextStyle } from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/src/constants/theme';
import { Typography } from './Typography';

type TypographyVariant = keyof typeof TYPOGRAPHY;

interface DateTimeProps {
  date: Date | string | number | undefined;
  formatString?: string;
  formatType?: 'default' | 'weekday_at_time';
  variant?: TypographyVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  align?: 'left' | 'center' | 'right';
  uppercase?: boolean;
}

/**
 * DateTime Component
 * Centralized way to display localized dates and times using date-fns and i18next locale.
 */
export const DateTime: React.FC<DateTimeProps> = ({
  date,
  formatString = 'PPP',
  formatType = 'default',
  variant = 'body',
  color = COLORS.text,
  style,
  align = 'left',
  uppercase = false,
}) => {
  const { i18n } = useTranslation();
  if (!date) return null;

  const d = typeof date === 'string' ? parseISO(date) : new Date(date);

  if (!isValid(d)) {
    return null;
  }

  const locale = i18n.language === 'tr' ? tr : enUS;

  let finalFormat = formatString;
  if (formatType === 'weekday_at_time') {
    finalFormat = i18n.language === 'tr' ? "EEEE 'saat' HH:mm" : "EEEE 'at' p";
  }

  let text = format(d, finalFormat, { locale });

  if (uppercase) {
    text = text.toUpperCase();
  }

  return (
    <Typography variant={variant} color={color} align={align} style={style}>
      {text}
    </Typography>
  );
};
