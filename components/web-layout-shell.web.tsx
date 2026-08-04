import { usePathname } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { SidebarNavigation } from '@/components/sidebar-navigation';
import { BREAKPOINTS, WebLayoutShellProps } from '@/types';

export function WebLayoutShell({ children }: WebLayoutShellProps) {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const showSidebar = width > BREAKPOINTS.desktop;

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <SidebarNavigation activeRoute={pathname} />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
});
