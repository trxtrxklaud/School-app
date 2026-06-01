import React from 'react';
import { View, Text, ScrollView, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, Users, UserCog, Calendar, Bell } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/utils/i18n';

const PRIMARY_BLUE = '#1a237e';
const GOLD = '#f9a825';

const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  android: { elevation: 3 },
}) as object;

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const rtl = isRTL;

  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['school-stats'],
    queryFn: async () => {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/stats`);
      return response.json();
    },
  });

  const maxStudents = Math.max(...(stats?.studentsPerClass?.map((s: any) => s.count) || [1]), 1);

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f2f8' }}>
      <View
        style={{
          backgroundColor: PRIMARY_BLUE,
          paddingTop: insets.top,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            flexDirection: rtl ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 10,
            paddingTop: 14,
          }}
        >
          <BarChart3 size={22} color={GOLD} />
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{t('statistics')}</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={PRIMARY_BLUE} />
        }
      >
        {/* Totals Grid */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <StatBox
            icon={<Users size={20} color="#fff" />}
            label={t('totalStudents')}
            value={stats?.totals?.students || 0}
            color="#3949ab"
          />
          <StatBox
            icon={<UserCog size={20} color="#fff" />}
            label={t('totalEmployees')}
            value={stats?.totals?.employees || 0}
            color="#00897b"
          />
          <StatBox
            icon={<Calendar size={20} color="#fff" />}
            label={t('upcomingExams')}
            value={stats?.totals?.exams || 0}
            color="#f57c00"
          />
          <StatBox
            icon={<Bell size={20} color="#fff" />}
            label={t('announcementsCount')}
            value={stats?.totals?.announcements || 0}
            color="#7b1fa2"
          />
        </View>

        {/* Students per class */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: '800',
            color: PRIMARY_BLUE,
            marginBottom: 14,
            textAlign: rtl ? 'right' : 'left',
          }}
        >
          {t('studentsPerClass')}
        </Text>
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 22,
            padding: 20,
            marginBottom: 20,
            ...shadow,
          }}
        >
          {stats?.studentsPerClass?.map((cls: any, index: number) => (
            <View
              key={cls.class_name}
              style={{ marginBottom: index === stats.studentsPerClass.length - 1 ? 0 : 16 }}
            >
              <View
                style={{
                  flexDirection: rtl ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <Text style={{ fontWeight: '700', color: '#333', fontSize: 13 }}>
                  {rtl ? 'قسم' : 'Classe'} {cls.class_name}
                </Text>
                <Text style={{ fontWeight: '800', color: PRIMARY_BLUE, fontSize: 13 }}>
                  {cls.count}
                </Text>
              </View>
              <View
                style={{
                  height: 9,
                  backgroundColor: '#f0f0f0',
                  borderRadius: 5,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    backgroundColor: GOLD,
                    width: `${(cls.count / maxStudents) * 100}%`,
                    borderRadius: 5,
                  }}
                />
              </View>
            </View>
          ))}
          {(!stats?.studentsPerClass || stats.studentsPerClass.length === 0) && (
            <Text style={{ textAlign: 'center', color: '#bdbdbd', paddingVertical: 20 }}>
              {t('noData')}
            </Text>
          )}
        </View>

        {/* Staff breakdown */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: '800',
            color: PRIMARY_BLUE,
            marginBottom: 14,
            textAlign: rtl ? 'right' : 'left',
          }}
        >
          {t('staffBreakdown')}
        </Text>
        <View style={{ backgroundColor: '#fff', borderRadius: 22, padding: 20, ...shadow }}>
          {stats?.employeesByRole?.map((role: any, index: number) => {
            const colors = [PRIMARY_BLUE, '#00897b', '#f57c00', '#7b1fa2'];
            const c = colors[index % colors.length];
            return (
              <View
                key={role.type}
                style={{
                  flexDirection: rtl ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: index === stats.employeesByRole.length - 1 ? 0 : 16,
                }}
              >
                <View
                  style={{
                    flexDirection: rtl ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c }} />
                  <Text style={{ color: '#555', fontSize: 14, fontWeight: '500' }}>
                    {role.type}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: `${c}18`,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ fontWeight: '800', color: c, fontSize: 14 }}>{role.count}</Text>
                </View>
              </View>
            );
          })}
          {(!stats?.employeesByRole || stats.employeesByRole.length === 0) && (
            <Text style={{ textAlign: 'center', color: '#bdbdbd', paddingVertical: 20 }}>
              {t('noData')}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View
      style={{
        width: '48%',
        backgroundColor: color,
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        ...Platform.select({
          ios: {
            shadowColor: color,
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
          },
          android: { elevation: 6 },
        }),
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: 'rgba(255,255,255,0.22)',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        {icon}
      </View>
      <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900' }}>{value}</Text>
      <Text
        style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 3 }}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}
