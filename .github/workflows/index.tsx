import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSchoolAuthStore } from '@/utils/schoolAuthStore';
import { useRouter } from 'expo-router';
import {
  Users,
  UserCog,
  Bell,
  Calendar,
  BarChart3,
  ChevronRight,
  LogOut,
  BookOpen,
  Clock,
  TrendingUp,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/utils/i18n';

const PRIMARY_BLUE = '#1a237e';
const GOLD = '#f9a825';

const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
  },
  android: { elevation: 4 },
});

const goldShadow = Platform.select({
  ios: {
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  android: { elevation: 6 },
});

function getGreeting(lang: string): string {
  const hour = new Date().getHours();
  if (lang === 'ar') {
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'مساء الخير';
    return 'مساء النور';
  }
  if (hour < 12) return 'Bonjour';
  if (hour < 17) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useSchoolAuthStore();
  const router = useRouter();
  const { t, language, isRTL } = useI18n();
  const rtl = isRTL;

  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['school-stats'],
    queryFn: async () => {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const { data: announcements } = useQuery({
    queryKey: ['announcements-dashboard'],
    queryFn: async () => {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/announcements`);
      return response.json();
    },
  });

  if (!user) return <View style={{ flex: 1, backgroundColor: PRIMARY_BLUE }} />;

  const initials = user.full_name
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const latestAnnouncements = Array.isArray(announcements) ? announcements.slice(0, 3) : [];

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f2f8' }}>
      {/* ── HEADER ── */}
      <View
        style={{
          backgroundColor: PRIMARY_BLUE,
          paddingTop: insets.top,
          paddingBottom: 70,
          paddingHorizontal: 22,
        }}
      >
        {/* Top bar */}
        <View
          style={{
            flexDirection: rtl ? 'row-reverse' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 16,
            marginBottom: 26,
          }}
        >
          {/* Avatar + greeting */}
          <View
            style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', flex: 1 }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: GOLD,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: rtl ? 0 : 12,
                marginLeft: rtl ? 12 : 0,
                ...goldShadow,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '900', color: PRIMARY_BLUE }}>
                {initials}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.65)',
                  fontSize: 12,
                  fontWeight: '500',
                  textAlign: rtl ? 'right' : 'left',
                }}
              >
                {getGreeting(language)},
              </Text>
              <Text
                style={{
                  color: '#fff',
                  fontSize: 17,
                  fontWeight: '800',
                  textAlign: rtl ? 'right' : 'left',
                  writingDirection: rtl ? 'rtl' : 'ltr',
                }}
                numberOfLines={1}
              >
                {user.full_name}
              </Text>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity
            onPress={() => {
              logout();
              router.replace('/(auth)/login' as any);
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.12)',
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: rtl ? 0 : 8,
              marginRight: rtl ? 8 : 0,
            }}
          >
            <LogOut size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* School name pill */}
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: rtl ? 'row-reverse' : 'row',
            alignItems: 'center',
            alignSelf: rtl ? 'flex-end' : 'flex-start',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
          }}
        >
          <BookOpen
            size={14}
            color={GOLD}
            style={{ marginRight: rtl ? 0 : 7, marginLeft: rtl ? 7 : 0 }}
          />
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' }}>
            Complexe la Providence
          </Text>
        </View>
      </View>

      {/* ── STATS CARDS (floating over header) ── */}
      <View
        style={{
          marginTop: -55,
          marginHorizontal: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <StatCard
          icon={<Users size={20} color="#fff" />}
          label={t('totalStudents')}
          value={stats?.totals?.students ?? '—'}
          gradient="#3949ab"
          rtl={rtl}
        />
        <StatCard
          icon={<UserCog size={20} color="#fff" />}
          label={t('totalEmployees')}
          value={stats?.totals?.employees ?? '—'}
          gradient="#00897b"
          rtl={rtl}
        />
        <StatCard
          icon={<Calendar size={20} color="#fff" />}
          label={t('upcomingExams')}
          value={stats?.totals?.exams ?? '—'}
          gradient="#f57c00"
          rtl={rtl}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 30 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={PRIMARY_BLUE} />
        }
      >
        {/* ── QUICK ACTIONS ── */}
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 22,
            padding: 20,
            marginBottom: 16,
            marginTop: 12,
            ...shadow,
          }}
        >
          <SectionHeader label={t('quickActions')} rtl={rtl} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <QuickAction
              emoji="🎓"
              label={language === 'ar' ? 'التلاميذ' : 'Élèves'}
              color="#e8eaf6"
              textColor={PRIMARY_BLUE}
              onPress={() => router.push('/students' as any)}
            />
            <QuickAction
              emoji="👥"
              label={language === 'ar' ? 'الموظفون' : 'Personnel'}
              color="#e0f2f1"
              textColor="#00695c"
              onPress={() => router.push('/employees' as any)}
            />
            <QuickAction
              emoji="📢"
              label={language === 'ar' ? 'الإعلانات' : 'Annonces'}
              color="#fff8e1"
              textColor="#e65100"
              onPress={() => router.push('/announcements' as any)}
            />
            <QuickAction
              emoji="📨"
              label={language === 'ar' ? 'الرسائل' : 'Messages'}
              color="#fce4ec"
              textColor="#c62828"
              onPress={() => router.push('/messages' as any)}
            />
            <QuickAction
              emoji="📅"
              label={language === 'ar' ? 'الامتحانات' : 'Examens'}
              color="#e3f2fd"
              textColor="#1565c0"
              onPress={() => router.push('/exams' as any)}
            />
            <QuickAction
              emoji="👨‍👩‍👦"
              label={language === 'ar' ? 'الأولياء' : 'Parents'}
              color="#f3e5f5"
              textColor="#6a1b9a"
              onPress={() => router.push('/(tabs)/parents' as any)}
            />
          </View>
        </View>

        {/* ── TODAY SUMMARY ── */}
        <View
          style={{
            backgroundColor: PRIMARY_BLUE,
            borderRadius: 22,
            padding: 20,
            marginBottom: 16,
            ...shadow,
          }}
        >
          <SectionHeader
            label={language === 'ar' ? 'ملخص اليوم' : "Résumé d'aujourd'hui"}
            rtl={rtl}
            light
          />
          <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', gap: 12 }}>
            <SummaryPill
              icon={<TrendingUp size={14} color={GOLD} />}
              value={`${stats?.totals?.students ?? 0}`}
              label={language === 'ar' ? 'تلميذ' : 'élèves'}
            />
            <SummaryPill
              icon={<Clock size={14} color="#80cbc4" />}
              value={`${stats?.totals?.exams ?? 0}`}
              label={language === 'ar' ? 'امتحان' : 'examens'}
            />
            <SummaryPill
              icon={<Bell size={14} color="#ef9a9a" />}
              value={`${stats?.totals?.announcements ?? 0}`}
              label={language === 'ar' ? 'إعلان' : 'annonces'}
            />
          </View>
        </View>

        {/* ── LATEST ANNOUNCEMENTS ── */}
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 22,
            padding: 20,
            marginBottom: 16,
            ...shadow,
          }}
        >
          <View
            style={{
              flexDirection: rtl ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '800', color: PRIMARY_BLUE }}>
              {t('latestAnnouncements')}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/announcements' as any)}
              style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center' }}
            >
              <Text style={{ color: GOLD, fontWeight: '700', fontSize: 13 }}>{t('viewAll')}</Text>
              <ChevronRight
                size={16}
                color={GOLD}
                style={{ marginLeft: rtl ? 0 : 2, marginRight: rtl ? 2 : 0 }}
              />
            </TouchableOpacity>
          </View>

          {latestAnnouncements.length > 0 ? (
            latestAnnouncements.map((ann: any) => (
              <AnnouncementRow key={ann.id} item={ann} rtl={rtl} />
            ))
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
              <Text style={{ color: '#bdbdbd', fontSize: 14 }}>
                {language === 'ar' ? 'لا توجد إعلانات' : 'Aucune annonce récente'}
              </Text>
            </View>
          )}
        </View>

        {/* ── STATS LINK ── */}
        <TouchableOpacity
          onPress={() => router.push('/stats' as any)}
          style={{
            backgroundColor: '#fff',
            borderRadius: 22,
            padding: 18,
            flexDirection: rtl ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            ...shadow,
          }}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: '#e8eaf6',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: rtl ? 0 : 14,
                marginLeft: rtl ? 14 : 0,
              }}
            >
              <BarChart3 size={24} color={PRIMARY_BLUE} />
            </View>
            <View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '800',
                  color: PRIMARY_BLUE,
                  textAlign: rtl ? 'right' : 'left',
                }}
              >
                {t('statistics')}
              </Text>
              <Text style={{ color: '#9e9e9e', fontSize: 12, textAlign: rtl ? 'right' : 'left' }}>
                {language === 'ar' ? 'إحصائيات المؤسسة' : "Vue d'ensemble de l'établissement"}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#e0e0e0" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  gradient,
  rtl,
}: {
  icon: any;
  label: string;
  value: any;
  gradient: string;
  rtl: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: gradient,
        borderRadius: 18,
        padding: 14,
        marginHorizontal: 4,
        alignItems: rtl ? 'flex-end' : 'flex-start',
        ...Platform.select({
          ios: {
            shadowColor: gradient,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
          },
          android: { elevation: 6 },
        }),
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: 'rgba(255,255,255,0.22)',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        {icon}
      </View>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{value}</Text>
      <Text
        style={{
          color: 'rgba(255,255,255,0.75)',
          fontSize: 10,
          marginTop: 2,
          textAlign: rtl ? 'right' : 'left',
        }}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}

function QuickAction({
  emoji,
  label,
  color,
  textColor,
  onPress,
}: {
  emoji: string;
  label: string;
  color: string;
  textColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      style={{
        width: '31%',
        backgroundColor: color,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 8,
        alignItems: 'center',
        marginBottom: 10,
      }}
    >
      <Text style={{ fontSize: 26, marginBottom: 6 }}>{emoji}</Text>
      <Text
        style={{ color: textColor, fontSize: 11, fontWeight: '700', textAlign: 'center' }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SectionHeader({ label, rtl, light }: { label: string; rtl: boolean; light?: boolean }) {
  return (
    <View
      style={{
        flexDirection: rtl ? 'row-reverse' : 'row',
        alignItems: 'center',
        marginBottom: 16,
      }}
    >
      <View
        style={{
          width: 4,
          height: 18,
          borderRadius: 2,
          backgroundColor: GOLD,
          marginRight: rtl ? 0 : 10,
          marginLeft: rtl ? 10 : 0,
        }}
      />
      <Text
        style={{
          fontSize: 16,
          fontWeight: '800',
          color: light ? '#fff' : PRIMARY_BLUE,
          writingDirection: rtl ? 'rtl' : 'ltr',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function SummaryPill({ icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 14,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      {icon}
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 6 }}>{value}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, textAlign: 'center' }}>
        {label}
      </Text>
    </View>
  );
}

function AnnouncementRow({ item, rtl }: { item: any; rtl: boolean }) {
  const priorityColor =
    item.priority === 'urgent' ? '#f44336' : item.priority === 'normal' ? GOLD : '#2196f3';
  const priorityLabel =
    item.priority === 'urgent'
      ? rtl
        ? 'عاجل'
        : 'Urgent'
      : item.priority === 'normal'
        ? rtl
          ? 'عادي'
          : 'Normal'
        : 'Info';

  return (
    <View
      style={{
        flexDirection: rtl ? 'row-reverse' : 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: priorityColor,
          marginRight: rtl ? 0 : 12,
          marginLeft: rtl ? 12 : 0,
          flexShrink: 0,
        }}
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: '#212121',
            textAlign: rtl ? 'right' : 'left',
            writingDirection: rtl ? 'rtl' : 'ltr',
          }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: '#9e9e9e',
            textAlign: rtl ? 'right' : 'left',
            marginTop: 2,
          }}
        >
          {new Date(item.created_at).toLocaleDateString(rtl ? 'ar-DZ' : 'fr-FR')}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: `${priorityColor}18`,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 8,
          marginLeft: rtl ? 0 : 8,
          marginRight: rtl ? 8 : 0,
        }}
      >
        <Text style={{ color: priorityColor, fontSize: 10, fontWeight: '800' }}>
          {priorityLabel}
        </Text>
      </View>
    </View>
  );
}
