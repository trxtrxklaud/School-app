import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Plus, Trash2 } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const getPriorityColor = (priority: string) => {
  if (priority === 'urgent') return '#f44336';
  if (priority === 'normal') return GOLD;
  return '#2196f3';
};

export default function AnnouncementsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { t, isRTL } = useI18n();
  const rtl = isRTL;

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', priority: 'info' });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/announcements`);
      return response.json();
    },
  });

  const addAnnouncementMutation = useMutation({
    mutationFn: async (newAnn: any) => {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnn),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setIsAddModalVisible(false);
      setFormData({ title: '', content: '', priority: 'info' });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/announcements?id=${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });

  const confirmDelete = (id: number) => {
    Alert.alert(t('confirmDelete'), t('deleteAnnouncement'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteBtn'),
        style: 'destructive',
        onPress: () => deleteAnnouncementMutation.mutate(id),
      },
    ]);
  };

  const PRIORITIES = [
    { key: 'info', label: t('info'), color: '#2196f3' },
    { key: 'normal', label: t('normal'), color: GOLD },
    { key: 'urgent', label: t('urgent'), color: '#f44336' },
  ];

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
            <Bell size={22} color={GOLD} />
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>
              {t('announcements')}
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

      <FlatList
        data={Array.isArray(announcements) ? announcements : []}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📢</Text>
              <Text style={{ color: '#bdbdbd', fontSize: 16, fontWeight: '600' }}>
                {t('noAnnouncements')}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const pColor = getPriorityColor(item.priority);
          const pLabel =
            item.priority === 'urgent'
              ? t('urgent')
              : item.priority === 'normal'
                ? t('normal')
                : t('info');
          return (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 20,
                padding: 16,
                marginBottom: 12,
                borderLeftWidth: rtl ? 0 : 5,
                borderRightWidth: rtl ? 5 : 0,
                borderLeftColor: pColor,
                borderRightColor: pColor,
                ...shadow,
              }}
            >
              <View
                style={{
                  flexDirection: rtl ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <View style={{ flex: 1, paddingRight: rtl ? 0 : 12, paddingLeft: rtl ? 12 : 0 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '800',
                      color: '#1a1a2e',
                      textAlign: rtl ? 'right' : 'left',
                      writingDirection: rtl ? 'rtl' : 'ltr',
                    }}
                  >
                    {item.title}
                  </Text>
                  <View
                    style={{
                      flexDirection: rtl ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 6,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: `${pColor}18`,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: pColor,
                          fontSize: 10,
                          fontWeight: '800',
                          textTransform: 'uppercase',
                        }}
                      >
                        {pLabel}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#9e9e9e' }}>
                      {new Date(item.created_at).toLocaleDateString(rtl ? 'ar-DZ' : 'fr-FR')}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => confirmDelete(item.id)} style={{ padding: 6 }}>
                  <Trash2 size={17} color="#ef5350" />
                </TouchableOpacity>
              </View>
              {item.content ? (
                <Text
                  style={{
                    color: '#555',
                    fontSize: 14,
                    lineHeight: 20,
                    marginTop: 10,
                    textAlign: rtl ? 'right' : 'left',
                    writingDirection: rtl ? 'rtl' : 'ltr',
                  }}
                >
                  {item.content}
                </Text>
              ) : null}
            </View>
          );
        }}
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
              maxHeight: '70%',
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
                {t('newAnnouncement')}
              </Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <Text style={{ color: '#ef5350', fontWeight: '700', fontSize: 15 }}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <FieldLabel label={t('title')} rtl={rtl} />
              <TextInput
                value={formData.title}
                onChangeText={(v) => setFormData({ ...formData, title: v })}
                style={{
                  backgroundColor: '#f5f5f5',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  height: 50,
                  color: '#333',
                  fontSize: 14,
                  marginBottom: 16,
                  textAlign: rtl ? 'right' : 'left',
                  writingDirection: rtl ? 'rtl' : 'ltr',
                  borderWidth: 1,
                  borderColor: '#eeeeee',
                }}
                placeholder={t('title')}
                placeholderTextColor="#bdbdbd"
              />
              <FieldLabel label={t('content')} rtl={rtl} />
              <TextInput
                value={formData.content}
                onChangeText={(v) => setFormData({ ...formData, content: v })}
                style={{
                  backgroundColor: '#f5f5f5',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingTop: 12,
                  height: 100,
                  color: '#333',
                  fontSize: 14,
                  marginBottom: 16,
                  textAlign: rtl ? 'right' : 'left',
                  writingDirection: rtl ? 'rtl' : 'ltr',
                  borderWidth: 1,
                  borderColor: '#eeeeee',
                }}
                multiline
                placeholder={t('content')}
                placeholderTextColor="#bdbdbd"
              />
              <FieldLabel label={t('priority')} rtl={rtl} />
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p.key}
                    onPress={() => setFormData({ ...formData, priority: p.key })}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: formData.priority === p.key ? p.color : '#f5f5f5',
                    }}
                  >
                    <Text
                      style={{
                        color: formData.priority === p.key ? '#fff' : '#666',
                        fontWeight: '700',
                        fontSize: 13,
                      }}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                onPress={() => addAnnouncementMutation.mutate(formData)}
                disabled={addAnnouncementMutation.isPending}
                style={{
                  backgroundColor: PRIMARY_BLUE,
                  height: 56,
                  borderRadius: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 50,
                  opacity: addAnnouncementMutation.isPending ? 0.6 : 1,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>
                  {t('publish')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function FieldLabel({ label, rtl }: { label: string; rtl: boolean }) {
  return (
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
  );
}
