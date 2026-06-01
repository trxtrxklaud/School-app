import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, LogOut, Languages } from 'lucide-react-native';
import { useSchoolAuthStore } from '@/utils/schoolAuthStore';
import { useI18n } from '@/utils/i18n';

const PRIMARY_BLUE = '#1a237e';
const GOLD = '#f9a825';

const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  android: { elevation: 3 },
}) as object;

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useSchoolAuthStore();
  const { t, language, setLanguage, isRTL } = useI18n();
  const rtl = isRTL;

  const initials =
    user?.full_name
      ?.split(' ')
      .map((w: string) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  const menuItems = [
    {
      id: 'exams',
      label: rtl ? 'جدول الامتحانات' : 'Calendrier des Examens',
      emoji: '📅',
      route: '/exams',
      color: '#e3f2fd',
      textColor: '#1565c0',
    },
    {
      id: 'timetables',
      label: rtl ? 'جداول الدروس' : 'Emplois du Temps',
      emoji: '🗓️',
      route: '/timetables',
      color: '#e8f5e9',
      textColor: '#2e7d32',
    },
    {
      id: 'announcements',
      label: rtl ? 'الإعلانات' : 'Annonces & Infos',
      emoji: '📢',
      route: '/announcements',
      color: '#fff8e1',
      textColor: '#e65100',
    },
    {
      id: 'stats',
      label: rtl ? 'الإحصائيات' : 'Statistiques & Rapports',
      emoji: '📊',
      route: '/stats',
      color: '#f3e5f5',
      textColor: '#6a1b9a',
    },
    {
      id: 'messages',
      label: rtl ? 'المراسلة الداخلية' : 'Messagerie Interne',
      emoji: '📨',
      route: '/messages',
      color: '#fce4ec',
      textColor: '#c62828',
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      rtl ? 'تسجيل الخروج' : 'Se déconnecter',
      rtl ? 'هل تريد تسجيل الخروج؟' : 'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/login' as any);
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f2f8' }}>
      {/* ── PROFILE HEADER ── */}
      <View
        style={{
          backgroundColor: PRIMARY_BLUE,
          paddingTop: insets.top,
          paddingBottom: 30,
          paddingHorizontal: 22,
        }}
      >
        <View
          style={{
            flexDirection: rtl ? 'row-reverse' : 'row',
            alignItems: 'center',
            paddingTop: 18,
          }}
        >
          {/* Avatar */}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: GOLD,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: rtl ? 0 : 16,
              marginLeft: rtl ? 16 : 0,
              ...Platform.select({
                ios: {
                  shadowColor: GOLD,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.5,
                  shadowRadius: 12,
                },
                android: { elevation: 10 },
              }),
            }}
          >
            <Text style={{ color: PRIMARY_BLUE, fontSize: 24, fontWeight: '900' }}>{initials}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: '#fff',
                fontSize: 20,
                fontWeight: '900',
                textAlign: rtl ? 'right' : 'left',
                writingDirection: rtl ? 'rtl' : 'ltr',
              }}
            >
              {user?.full_name}
            </Text>
            <View
              style={{
                flexDirection: rtl ? 'row-reverse' : 'row',
                alignItems: 'center',
                marginTop: 6,
                gap: 8,
              }}
            >
              <View
                style={{
                  backgroundColor: user?.role === 'admin' ? GOLD : 'rgba(255,255,255,0.2)',
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    color: user?.role === 'admin' ? PRIMARY_BLUE : '#fff',
                    fontSize: 11,
                    fontWeight: '800',
                  }}
                >
                  {user?.role === 'admin' ? t('administrator') : t('teacherRole')}
                </Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                Complexe la Providence
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 50 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── MANAGEMENT SECTION ── */}
        <SectionTitle label={t('management')} rtl={rtl} />
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 22,
            overflow: 'hidden',
            marginBottom: 20,
            ...shadow,
          }}
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.75}
              style={{
                flexDirection: rtl ? 'row-reverse' : 'row',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 18,
                borderBottomWidth: index === menuItems.length - 1 ? 0 : 1,
                borderBottomColor: '#f5f5f5',
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  backgroundColor: item.color,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: rtl ? 0 : 14,
                  marginLeft: rtl ? 14 : 0,
                }}
              >
                <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: '#222',
                  fontWeight: '600',
                  textAlign: rtl ? 'right' : 'left',
                  writingDirection: rtl ? 'rtl' : 'ltr',
                }}
              >
                {item.label}
              </Text>
              <ChevronRight size={18} color="#d0d0d0" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── ACCOUNT SECTION ── */}
        <SectionTitle label={t('account')} rtl={rtl} />
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 22,
            overflow: 'hidden',
            marginBottom: 20,
            ...shadow,
          }}
        >
          {/* Language toggle */}
          <TouchableOpacity
            onPress={() => setLanguage(language === 'fr' ? 'ar' : 'fr')}
            activeOpacity={0.75}
            style={{
              flexDirection: rtl ? 'row-reverse' : 'row',
              alignItems: 'center',
              paddingVertical: 16,
              paddingHorizontal: 18,
              borderBottomWidth: 1,
              borderBottomColor: '#f5f5f5',
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                backgroundColor: '#e8eaf6',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: rtl ? 0 : 14,
                marginLeft: rtl ? 14 : 0,
              }}
            >
              <Languages size={22} color={PRIMARY_BLUE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 15,
                  color: '#222',
                  fontWeight: '600',
                  textAlign: rtl ? 'right' : 'left',
                }}
              >
                {t('language')}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: '#9e9e9e',
                  marginTop: 2,
                  textAlign: rtl ? 'right' : 'left',
                }}
              >
                {language === 'fr' ? 'Français → العربية' : 'العربية → Français'}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: GOLD,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: PRIMARY_BLUE, fontWeight: '800', fontSize: 12 }}>
                {t('switchLanguage')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* About */}
          <View
            style={{
              flexDirection: rtl ? 'row-reverse' : 'row',
              alignItems: 'center',
              paddingVertical: 16,
              paddingHorizontal: 18,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                backgroundColor: '#f5f5f5',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: rtl ? 0 : 14,
                marginLeft: rtl ? 14 : 0,
              }}
            >
              <Text style={{ fontSize: 20 }}>ℹ️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 15,
                  color: '#222',
                  fontWeight: '600',
                  textAlign: rtl ? 'right' : 'left',
                }}
              >
                {rtl ? 'حول التطبيق' : 'À propos'}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: '#9e9e9e',
                  marginTop: 2,
                  textAlign: rtl ? 'right' : 'left',
                }}
              >
                {rtl ? 'الإصدار 1.0.0 · مجمع لا بروفيدانس' : 'Version 1.0.0 · Complexe la Providence'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── LOGOUT ── */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#fff',
            borderRadius: 22,
            padding: 18,
            flexDirection: rtl ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            borderWidth: 1.5,
            borderColor: '#ffebee',
            ...shadow,
          }}
        >
          <LogOut size={20} color="#ef5350" />
          <Text style={{ color: '#ef5350', fontSize: 16, fontWeight: '800' }}>{t('logout')}</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: GOLD,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '900', color: PRIMARY_BLUE }}>CP</Text>
            </View>
            <Text style={{ color: '#9e9e9e', fontSize: 12, fontWeight: '600' }}>
              Complexe la Providence
            </Text>
          </View>
          <Text style={{ color: '#bdbdbd', fontSize: 11 }}>
            {rtl ? 'منصة الإدارة المدرسية · 2026' : 'Plateforme de Gestion Scolaire · 2026'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ label, rtl }: { label: string; rtl: boolean }) {
  return (
    <View
      style={{
        flexDirection: rtl ? 'row-reverse' : 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 2,
      }}
    >
      <View
        style={{
          width: 4,
          height: 16,
          borderRadius: 2,
          backgroundColor: GOLD,
          marginRight: rtl ? 0 : 8,
          marginLeft: rtl ? 8 : 0,
        }}
      />
      <Text
        style={{
          fontSize: 14,
          fontWeight: '800',
          color: PRIMARY_BLUE,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
