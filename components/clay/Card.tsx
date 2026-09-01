import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { neuSurface, type Elevation } from '@/lib/neumorphic';

export type ClayCardProps = ViewProps & {
  elevation?: Elevation;
};

export function ClayCard({ elevation = 'raised', style, ...props }: ClayCardProps) {
  const scheme = useColorScheme() ?? 'light' as const;

  return (
    <View
      style={[
        neuSurface(scheme, elevation),
        { padding: 16 },
        style,
      ]}
      {...props}
    />
  );
}
