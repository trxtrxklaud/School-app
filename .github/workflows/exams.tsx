import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  User,
  Trash2,
  Calendar as CalendarIcon,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/utils/i18n';

const PRIMARY_BLUE = '#1a237e';
const GOLD = '#f9a825';

const SESSIONS = ['All', 'S1', 'S2', 'Rattrapage'];

const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  android: { elevation: 3 },
}) as object;

export default function ExamsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { t, isRTL } = useI18n();
  const rtl = isRTL;

  const [selectedSession, setSelectedSession] = useState('All');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    exam_date: '',
    exam_time: '',
    room: '',
    supervisor: '',
    session: 'S1',
  });

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams', selectedSession],
    queryFn: async () => {
      let url = `${process.env.EXPO_PUBLIC_BASE_URL}/api/school/exams?`;
      if (selectedSession !== 'All') url += `session=${selectedSession}`;
      const response = await fetch(url);
      return response.json();
    },
  });

  const addExamMutation = useMutation({
    mutationFn: async (newExam: any) => {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExam),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setIsAddModalVisible(false);
      setFormData({
        subject: '',
        exam_date: '',
        exam_time: '',
        room: '',
        supervisor: '',
        session: 'S1',
      });
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/exams?id=${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exams'] }),
  });

  const confirmDelete = (id: number) => {
    Alert.alert(t('confirmDelete'), rtl ? 'هل تريد حذف هذا الامتحان؟' : 'Supprimer cet examen ?', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('deleteBtn'), style: 'destructive', onPress: () => deleteExamMutation.mutate(id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f2f8' }}>
      {/* Header */}
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
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 14,
          }}
        >
          <View
            style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}
          >
            <CalendarDays size={22} color={GOLD} />
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>
              {t('examSchedule')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsAddModalVisible(true)}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: GOLD,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Plus size={22} color={PRIMARY_BLUE} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Session filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        style={{ flexGrow: 0 }}
      >
        {SESSIONS.map((session) => (
          <TouchableOpacity
            key={session}
            onPress={() => setSelectedSession(session)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 9,
              borderRadius: 20,
              backgroundColor: selectedSession === session ? PRIMARY_BLUE : '#fff',
              borderWidth: 1.5,
              borderColor: selectedSession === session ? PRIMARY_BLUE : '#e0e0e0',
              ...shadow,
            }}
          >
            <Text
              style={{
                color: selectedSession === session ? '#fff' : '#666',
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              {session === 'All' ? (rtl ? 'الكل' : 'Toutes') : session}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={Array.isArray(exams) ? exams : []}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📅</Text>
              <Text style={{ color: '#bdbdbd', fontSize: 16, fontWeight: '600' }}>
                {t('noExams')}
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
            <View
              style={{
                flexDirection: rtl ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '800',
                    color: '#1a1a2e',
                    textAlign: rtl ? 'right' : 'left',
                    writingDirection: rtl ? 'rtl' : 'ltr',
                  }}
                >
                  {item.subject}
                </Text>
                <View
                  style={{
                    backgroundColor: `${GOLD}20`,
                    alignSelf: rtl ? 'flex-end' : 'flex-start',
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 10,
                    marginTop: 6,
                  }}
                >
                  <Text style={{ color: GOLD, fontSize: 11, fontWeight: '800' }}>
                    SESSION {item.session}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => confirmDelete(item.id)} style={{ padding: 6 }}>
                <Trash2 size={17} color="#ef5350" />
              </TouchableOpacity>
            </View>

            <View style={{ height: 1, backgroundColor: '#f5f5f5', marginVertical: 12 }} />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <InfoChip
                icon={<CalendarIcon size={13} color="#9e9e9e" />}
                text={new Date(item.exam_date).toLocaleDateString(rtl ? 'ar-DZ' : 'fr-FR')}
              />
              <InfoChip icon={<Clock size={13} color="#9e9e9e" />} text={item.exam_time} />
              <InfoChip
                icon={<MapPin size={13} color="#9e9e9e" />}
                text={`${rtl ? 'قاعة' : 'Salle'}: ${item.room}`}
              />
              <InfoChip
                icon={<User size={13} color="#9e9e9e" />}
                text={`${rtl ? 'مراقب' : 'Sup'}: ${item.supervisor}`}
              />
            </View>
          </View>
        )}
      />

      {/* Add Modal */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              maxHeight: '80%',
            }}
          >
            <View
              style={{
                flexDirection: rtl ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 22,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '900', color: PRIMARY_BLUE }}>
                {t('newExam')}
              </Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <Text style={{ color: '#ef5350', fontWeight: '700', fontSize: 15 }}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <FormInput
                label={t('subjectExam')}
                value={formData.subject}
                onChangeText={(v: string) => setFormData({ ...formData, subject: v })}
                rtl={rtl}
              />
              <FormInput
                label={`${t('date')} (YYYY-MM-DD)`}
                value={formData.exam_date}
                onChangeText={(v: string) => setFormData({ ...formData, exam_date: v })}
                rtl={rtl}
              />
              <FormInput
                label={`${t('time')} (08:00 - 10:00)`}
                value={formData.exam_time}
                onChangeText={(v: string) => setFormData({ ...formData, exam_time: v })}
                rtl={rtl}
              />
              <FormInput
                label={t('room')}
                value={formData.room}
                onChangeText={(v: string) => setFormData({ ...formData, room: v })}
                rtl={rtl}
              />
              <FormInput
                label={t('supervisor')}
                value={formData.supervisor}
                onChangeText={(v: string) => setFormData({ ...formData, supervisor: v })}
                rtl={rtl}
              />

              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: '#757575',
                  marginBottom: 8,
                  textAlign: rtl ? 'right' : 'left',
                  letterSpacing: 0.3,
                }}
              >
                {t('session')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {SESSIONS.filter((s) => s !== 'All').map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setFormData({ ...formData, session: s })}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: formData.session === s ? PRIMARY_BLUE : '#f5f5f5',
                    }}
                  >
                    <Text
                      style={{
                        color: formData.session === s ? '#fff' : '#666',
                        fontWeight: '700',
                        fontSize: 13,
                      }}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => addExamMutation.mutate(formData)}
                disabled={addExamMutation.isPending}
                style={{
                  backgroundColor: PRIMARY_BLUE,
                  height: 56,
                  borderRadius: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 50,
                  opacity: addExamMutation.isPending ? 0.6 : 1,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>
                  {t('schedule')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoChip({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      {icon}
      <Text style={{ fontSize: 12, color: '#555' }}>{text}</Text>
    </View>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  rtl,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  rtl: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: '#757575',
          marginBottom: 7,
          textAlign: rtl ? 'right' : 'left',
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={{
          backgroundColor: '#f5f5f5',
          borderRadius: 12,
          paddingHorizontal: 14,
          height: 50,
          color: '#333',
          fontSize: 14,
          textAlign: rtl ? 'right' : 'left',
          writingDirection: rtl ? 'rtl' : 'ltr',
          borderWidth: 1,
          borderColor: '#eeeeee',
        }}
      />
    </View>
  );
}
