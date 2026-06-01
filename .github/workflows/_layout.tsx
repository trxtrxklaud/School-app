import { Tabs } from 'expo-router';
import { LayoutDashboard, Users, UserCog, Heart, Grid2X2 } from 'lucide-react-native';
import { useSchoolAuthStore } from '@/utils/schoolAuthStore';
import { Redirect } from 'expo-router';
import { useI18n } from '@/utils/i18n';

export default function TabLayout() {
  const { user, isReady } = useSchoolAuthStore();
  const { t } = useI18n();
  const primaryColor = '#1a237e';
  const inactiveColor = '#9e9e9e';

  if (!isReady) return null;
  if (!user) return <Redirect href={'/(auth)/login' as any} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('dashboard'),
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: t('students'),
          tabBarIcon: ({ color }) => <Users color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          title: t('employees'),
          tabBarIcon: ({ color }) => <UserCog color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="parents"
        options={{
          title: t('parents'),
          tabBarIcon: ({ color }) => <Heart color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('more'),
          tabBarIcon: ({ color }) => <Grid2X2 color={color} size={22} />,
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="student/[id]" options={{ href: null }} />
      <Tabs.Screen name="class/[id]" options={{ href: null }} />
      <Tabs.Screen name="employee/[id]" options={{ href: null }} />
      <Tabs.Screen name="exams" options={{ href: null }} />
      <Tabs.Screen name="announcements" options={{ href: null }} />
      <Tabs.Screen name="stats" options={{ href: null }} />
      <Tabs.Screen name="timetables" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
    </Tabs>
  );
}
