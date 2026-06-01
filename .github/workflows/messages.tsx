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
import { MessageSquare, Send, Mail, ChevronRight, Clock, User, Plus } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolAuthStore } from '@/utils/schoolAuthStore';
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

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useSchoolAuthStore();
  const { t, isRTL } = useI18n();
  const rtl = isRTL;

  const [isNewMessageModalVisible, setIsNewMessageModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [formData, setFormData] = useState({
    sender_name: user?.full_name || '',
    subject: '',
    message: '',
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/messages`);
      return response.json();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (newMsg: any) => {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setIsNewMessageModalVisible(false);
      setFormData({ sender_name: user?.full_name || '', subject: '', message: '' });
      Alert.alert(t('success'), rtl ? 'تم إرسال رسالتك' : "Message envoyé à l'administration");
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/messages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_read: true }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages'] }),
  });

  const msgList = Array.isArray(messages) ? messages : [];
  const unreadCount = msgList.filter((m: any) => !m.is_read).length;

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
            <MessageSquare size={22} color={GOLD} />
            <View>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{t('inbox')}</Text>
              {unreadCount > 0 && (
                <Text style={{ color: GOLD, fontSize: 12, fontWeight: '600' }}>
                  {unreadCount} {rtl ? 'غير مقروء' : 'non lu(s)'}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setIsNewMessageModalVisible(true)}
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
        data={msgList}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📨</Text>
              <Text style={{ color: '#bdbdbd', fontSize: 16, fontWeight: '600' }}>
                {t('noMessages')}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setSelectedMessage(item);
              if (!item.is_read) markReadMutation.mutate(item.id);
            }}
            activeOpacity={0.8}
            style={{
              backgroundColor: item.is_read ? '#fff' : '#e8eaf6',
              borderRadius: 18,
              padding: 16,
              marginBottom: 10,
              flexDirection: rtl ? 'row-reverse' : 'row',
              alignItems: 'center',
              ...shadow,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: item.is_read ? '#f5f5f5' : PRIMARY_BLUE,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: rtl ? 0 : 14,
                marginLeft: rtl ? 14 : 0,
              }}
            >
              <Mail size={20} color={item.is_read ? '#9e9e9e' : '#fff'} />
            </View>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: rtl ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, color: '#9e9e9e', textAlign: rtl ? 'right' : 'left' }}>
                  {rtl ? 'من:' : 'De:'} {item.sender_name}
                </Text>
                {!item.is_read && (
                  <View
                    style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#f44336' }}
                  />
                )}
              </View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '800',
                  color: PRIMARY_BLUE,
                  marginTop: 2,
                  textAlign: rtl ? 'right' : 'left',
                  writingDirection: rtl ? 'rtl' : 'ltr',
                }}
                numberOfLines={1}
              >
                {item.subject}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: '#666',
                  marginTop: 3,
                  textAlign: rtl ? 'right' : 'left',
                }}
                numberOfLines={1}
              >
                {item.message}
              </Text>
            </View>
            <ChevronRight
              size={16}
              color="#d0d0d0"
              style={{ marginLeft: rtl ? 0 : 6, marginRight: rtl ? 6 : 0 }}
            />
          </TouchableOpacity>
        )}
      />

      {/* Message Detail Modal */}
      <Modal visible={!!selectedMessage} animationType="fade" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            style={{ backgroundColor: '#fff', borderRadius: 26, padding: 26, maxHeight: '80%' }}
          >
            <View
              style={{
                flexDirection: rtl ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  backgroundColor: '#e8eaf6',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    color: PRIMARY_BLUE,
                    fontWeight: '800',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {rtl ? 'رسالة' : 'MESSAGE'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedMessage(null)}>
                <Text style={{ color: '#ef5350', fontWeight: '700', fontSize: 15 }}>
                  {t('close')}
                </Text>
              </TouchableOpacity>
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '900',
                color: PRIMARY_BLUE,
                marginBottom: 16,
                textAlign: rtl ? 'right' : 'left',
                writingDirection: rtl ? 'rtl' : 'ltr',
              }}
            >
              {selectedMessage?.subject}
            </Text>
            <View
              style={{
                flexDirection: rtl ? 'row-reverse' : 'row',
                alignItems: 'center',
                marginBottom: 10,
                gap: 8,
              }}
            >
              <User size={15} color={GOLD} />
              <Text style={{ color: '#555', fontSize: 13 }}>
                {rtl ? 'من:' : 'De:'}{' '}
                <Text style={{ fontWeight: '700', color: PRIMARY_BLUE }}>
                  {selectedMessage?.sender_name}
                </Text>
              </Text>
            </View>
            <View
              style={{
                flexDirection: rtl ? 'row-reverse' : 'row',
                alignItems: 'center',
                marginBottom: 18,
                gap: 8,
              }}
            >
              <Clock size={14} color="#9e9e9e" />
              <Text style={{ color: '#9e9e9e', fontSize: 12 }}>
                {selectedMessage?.created_at
                  ? new Date(selectedMessage.created_at).toLocaleString(rtl ? 'ar-DZ' : 'fr-FR')
                  : ''}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: '#f0f0f0', marginBottom: 16 }} />
            <ScrollView>
              <Text
                style={{
                  fontSize: 15,
                  color: '#333',
                  lineHeight: 24,
                  textAlign: rtl ? 'right' : 'left',
                  writingDirection: rtl ? 'rtl' : 'ltr',
                }}
              >
                {selectedMessage?.message}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* New Message Modal */}
      <Modal visible={isNewMessageModalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              maxHeight: '65%',
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
                {t('newMessage')}
              </Text>
              <TouchableOpacity onPress={() => setIsNewMessageModalVisible(false)}>
                <Text style={{ color: '#ef5350', fontWeight: '700', fontSize: 15 }}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <FieldLabel label={t('subject')} rtl={rtl} />
              <TextInput
                value={formData.subject}
                onChangeText={(v) => setFormData({ ...formData, subject: v })}
                style={{
                  backgroundColor: '#f5f5f5',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  height: 50,
                  color: '#333',
                  fontSize: 14,
                  marginBottom: 14,
                  textAlign: rtl ? 'right' : 'left',
                  writingDirection: rtl ? 'rtl' : 'ltr',
                  borderWidth: 1,
                  borderColor: '#eeeeee',
                }}
                placeholder={t('subject')}
                placeholderTextColor="#bdbdbd"
              />
              <FieldLabel label={t('message')} rtl={rtl} />
              <TextInput
                value={formData.message}
                onChangeText={(v) => setFormData({ ...formData, message: v })}
                style={{
                  backgroundColor: '#f5f5f5',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingTop: 14,
                  height: 110,
                  color: '#333',
                  fontSize: 14,
                  marginBottom: 20,
                  textAlign: rtl ? 'right' : 'left',
                  writingDirection: rtl ? 'rtl' : 'ltr',
                  borderWidth: 1,
                  borderColor: '#eeeeee',
                }}
                multiline
                placeholder={t('message')}
                placeholderTextColor="#bdbdbd"
              />
              <TouchableOpacity
                onPress={() => sendMessageMutation.mutate(formData)}
                disabled={sendMessageMutation.isPending}
                style={{
                  backgroundColor: PRIMARY_BLUE,
                  height: 56,
                  borderRadius: 16,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 50,
                  opacity: sendMessageMutation.isPending ? 0.6 : 1,
                }}
              >
                <Send size={18} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>{t('send')}</Text>
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
