import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, GraduationCap, Phone } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/utils/i18n';

const PRIMARY_BLUE = '#1a237e';
const GOLD = '#f9a825';

const CLASSES = ['All', '1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'];

const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  android: { elevation: 3 },
}) as object;

export default function ParentsScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const rtl = isRTL;

  const [selectedClass, setSelectedClass] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: students, isLoading } = useQuery({
    queryKey: ['parents', selectedClass, searchQuery],
    queryFn: async () => {
      let url = `${process.env.EXPO_PUBLIC_BASE_URL}/api/school/students?`;
      if (selectedClass !== 'All') url += `className=${encodeURIComponent(selectedClass)}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const openCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert(t('error'), rtl ? 'تعذر الاتصال' : "Impossible d'appeler")
    );
  };

  const openWhatsApp = (phone: string) => {
    if (!phone) return;
    const cleaned = phone.replace(/\D/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleaned}`).catch(() =>
      Linking.openURL(`https://wa.me/${cleaned}`).catch(() =>
        Alert.alert('WhatsApp', rtl ? 'واتساب غير مثبت' : "WhatsApp n'est pas installé")
      )
    );
  };

  const openMessenger = (phone: string) => {
    if (!phone) return;
    const cleaned = phone.replace(/\D/g, '');
    Linking.openURL(`fb-messenger://user-thread/${cleaned}`).catch(() =>
      Linking.openURL('https://www.messenger.com').catch(() =>
        Alert.alert('Messenger', rtl ? 'ماسنجر غير مثبت' : "Messenger n'est pas installé")
      )
    );
  };

  const contacts = Array.isArray(students)
    ? students.filter((s) => s.parent_name || s.parent_phone)
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f2f8' }}>
      {/* ── HEADER ── */}
      <View
        style={{
          backgroundColor: PRIMARY_BLUE,
          paddingTop: insets.top,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            color: '#fff',
            fontSize: 22,
            fontWeight: '900',
            marginTop: 14,
            textAlign: rtl ? 'right' : 'left',
            writingDirection: rtl ? 'rtl' : 'ltr',
          }}
        >
          {t('parentContacts')}
        </Text>
        <Text
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: 12,
            marginTop: 4,
            textAlign: rtl ? 'right' : 'left',
          }}
        >
          {contacts.length} {rtl ? 'جهة اتصال' : 'contacts'}
        </Text>

        {/* Search bar */}
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderRadius: 14,
            flexDirection: rtl ? 'row-reverse' : 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            height: 46,
            marginTop: 14,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.15)',
          }}
        >
          <Search
            size={16}
            color="rgba(255,255,255,0.7)"
            style={{ marginRight: rtl ? 0 : 8, marginLeft: rtl ? 8 : 0 }}
          />
          <TextInput
            placeholder={rtl ? 'البحث باسم التلميذ...' : "Rechercher par nom d'élève..."}
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={{ flex: 1, color: '#fff', fontSize: 14, textAlign: rtl ? 'right' : 'left' }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* ── CLASS FILTERS ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        style={{ flexGrow: 0 }}
      >
        {CLASSES.map((cls) => (
          <TouchableOpacity
            key={cls}
            onPress={() => setSelectedClass(cls)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 9,
              borderRadius: 20,
              backgroundColor: selectedClass === cls ? PRIMARY_BLUE : '#fff',
              borderWidth: 1.5,
              borderColor: selectedClass === cls ? PRIMARY_BLUE : '#e0e0e0',
              ...shadow,
            }}
          >
            <Text
              style={{
                color: selectedClass === cls ? '#fff' : '#666',
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              {cls === 'All' ? t('allClasses') : cls}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── CONTACTS LIST ── */}
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>👨‍👩‍👦</Text>
              <Text style={{ color: '#bdbdbd', fontSize: 16, fontWeight: '600' }}>
                {t('noParentsFound')}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              padding: 16,
              marginBottom: 12,
              ...shadow,
            }}
          >
            {/* Parent info */}
            <View
              style={{
                flexDirection: rtl ? 'row-reverse' : 'row',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: '#fff8e1',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: rtl ? 0 : 14,
                  marginLeft: rtl ? 14 : 0,
                }}
              >
                <Text style={{ fontSize: 22 }}>👤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '800',
                    color: '#1a1a2e',
                    textAlign: rtl ? 'right' : 'left',
                    writingDirection: rtl ? 'rtl' : 'ltr',
                  }}
                >
                  {item.parent_name || (rtl ? 'غير محدد' : 'Non renseigné')}
                </Text>

                {/* Student relation */}
                <View
                  style={{
                    flexDirection: rtl ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    marginTop: 5,
                    gap: 6,
                  }}
                >
                  <GraduationCap size={13} color="#9e9e9e" />
                  <Text
                    style={{
                      color: '#9e9e9e',
                      fontSize: 12,
                      writingDirection: rtl ? 'rtl' : 'ltr',
                    }}
                  >
                    {rtl ? 'ولي' : 'Parent de'}{' '}
                    <Text style={{ fontWeight: '700', color: PRIMARY_BLUE }}>{item.full_name}</Text>{' '}
                    <View
                      style={{
                        backgroundColor: `${PRIMARY_BLUE}15`,
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ color: PRIMARY_BLUE, fontSize: 10, fontWeight: '700' }}>
                        {item.class_name}
                      </Text>
                    </View>
                  </Text>
                </View>

                {/* Phone */}
                {item.parent_phone ? (
                  <View
                    style={{
                      flexDirection: rtl ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      marginTop: 5,
                      gap: 5,
                    }}
                  >
                    <Phone size={12} color={GOLD} />
                    <Text style={{ fontSize: 13, color: '#555', fontWeight: '600' }}>
                      {item.parent_phone}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* ── ACTION BUTTONS ── */}
            <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', gap: 8 }}>
              <ContactBtn
                emoji="📞"
                label={t('call')}
                bgColor="#e8f5e9"
                textColor="#2e7d32"
                onPress={() => openCall(item.parent_phone)}
              />
              <ContactBtn
                emoji="💬"
                label="WhatsApp"
                bgColor="#dcf8c6"
                textColor="#1b5e20"
                onPress={() => openWhatsApp(item.parent_phone)}
              />
              <ContactBtn
                emoji="✉️"
                label="Messenger"
                bgColor="#e8eaf6"
                textColor={PRIMARY_BLUE}
                onPress={() => openMessenger(item.parent_phone)}
              />
            </View>
          </View>
        )}
      />
    </View>
  );
}

function ContactBtn({
  emoji,
  label,
  bgColor,
  textColor,
  onPress,
}: {
  emoji: string;
  label: string;
  bgColor: string;
  textColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        flex: 1,
        backgroundColor: bgColor,
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 16, marginBottom: 2 }}>{emoji}</Text>
      <Text style={{ color: textColor, fontSize: 11, fontWeight: '700' }} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
