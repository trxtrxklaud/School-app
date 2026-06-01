import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Plus, Trash2, Edit2 } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/utils/i18n';
import { useSchoolAuthStore } from '@/utils/schoolAuthStore';

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

export default function EmployeesScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { t, isRTL } = useI18n();
  const { user } = useSchoolAuthStore();
  const rtl = isRTL;
  const isAdmin = user?.role === 'admin';

  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    role: '',
    phone: '',
    type: 'Teacher',
    photo_url: '',
  });

  const TYPES = [
    { key: 'All', label: t('allEmployees') },
    { key: 'Teacher', label: t('teacher') },
    { key: 'Administration', label: t('administration') },
    { key: 'Security', label: t('security') },
    { key: 'Other', label: t('other') },
  ];

  const typeStyleMap: Record<string, { bg: string; text: string }> = {
    Teacher: { bg: '#e8eaf6', text: PRIMARY_BLUE },
    Administration: { bg: '#e0f2f1', text: '#00695c' },
    Security: { bg: '#fce4ec', text: '#c62828' },
    Other: { bg: '#f5f5f5', text: '#424242' },
  };

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', selectedType, searchQuery],
    queryFn: async () => {
      let url = `${process.env.EXPO_PUBLIC_BASE_URL}/api/school/employees?`;
      if (selectedType !== 'All') url += `type=${encodeURIComponent(selectedType)}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsAddModalVisible(false);
      setEditingEmployee(null);
      setFormData({ full_name: '', role: '', phone: '', type: 'Teacher', photo_url: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/employees`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsAddModalVisible(false);
      setEditingEmployee(null);
      setFormData({ full_name: '', role: '', phone: '', type: 'Teacher', photo_url: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/employees?id=${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const openEditModal = (employee: any) => {
    setEditingEmployee(employee);
    setFormData({
      full_name: employee.full_name || '',
      role: employee.role || '',
      phone: employee.phone || '',
      type: employee.type || 'Teacher',
      photo_url: employee.photo_url || '',
    });
    setIsAddModalVisible(true);
  };

  const handleSave = () => {
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, ...formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const confirmDelete = (id: number, name: string) => {
    Alert.alert(t('confirmDelete'), `${t('deleteEmployeeConfirm')}\n"${name}"`, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('deleteBtn'), style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

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
        <View
          style={{
            flexDirection: rtl ? 'row-reverse' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 14,
          }}
        >
          <View>
            <Text
              style={{
                color: '#fff',
                fontSize: 22,
                fontWeight: '900',
                textAlign: rtl ? 'right' : 'left',
              }}
            >
              {t('employees')}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 3 }}>
              {Array.isArray(employees) ? employees.length : 0} {rtl ? 'موظف' : 'membres'}
            </Text>
          </View>
          {isAdmin && (
            <TouchableOpacity
              onPress={() => {
                setEditingEmployee(null);
                setFormData({ full_name: '', role: '', phone: '', type: 'Teacher', photo_url: '' });
                setIsAddModalVisible(true);
              }}
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
          )}
        </View>
        {/* Search */}
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
            placeholder={t('searchEmployees')}
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={{ flex: 1, color: '#fff', fontSize: 14, textAlign: rtl ? 'right' : 'left' }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* ── TYPE FILTERS ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        style={{ flexGrow: 0 }}
      >
        {TYPES.map((type) => (
          <TouchableOpacity
            key={type.key}
            onPress={() => setSelectedType(type.key)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 9,
              borderRadius: 20,
              backgroundColor: selectedType === type.key ? PRIMARY_BLUE : '#fff',
              borderWidth: 1.5,
              borderColor: selectedType === type.key ? PRIMARY_BLUE : '#e0e0e0',
              ...shadow,
            }}
          >
            <Text
              style={{
                color: selectedType === type.key ? '#fff' : '#666',
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── LIST ── */}
      <FlatList
        data={Array.isArray(employees) ? employees : []}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>👥</Text>
              <Text style={{ color: '#bdbdbd', fontSize: 16, fontWeight: '600' }}>
                {t('noEmployeesFound')}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const typeStyle = typeStyleMap[item.type] || typeStyleMap.Other;
          const initials = item.full_name
            ?.split(' ')
            .map((w: string) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

          return (
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
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: typeStyle.bg,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: rtl ? 0 : 14,
                    marginLeft: rtl ? 14 : 0,
                  }}
                >
                  <Text style={{ fontSize: 20, fontWeight: '900', color: typeStyle.text }}>
                    {initials}
                  </Text>
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
                    {item.full_name}
                  </Text>
                  <Text
                    style={{
                      color: '#9e9e9e',
                      fontSize: 12,
                      marginTop: 2,
                      textAlign: rtl ? 'right' : 'left',
                    }}
                  >
                    {item.role}
                  </Text>
                  <View
                    style={{
                      flexDirection: rtl ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      marginTop: 5,
                      gap: 8,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: typeStyle.bg,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: typeStyle.text, fontSize: 10, fontWeight: '800' }}>
                        {item.type}
                      </Text>
                    </View>
                    {item.phone ? (
                      <Text style={{ fontSize: 11, color: '#9e9e9e' }}>{item.phone}</Text>
                    ) : null}
                  </View>
                </View>
                {isAdmin && (
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    <TouchableOpacity onPress={() => openEditModal(item)} style={{ padding: 6 }}>
                      <Edit2 size={16} color="#7986cb" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmDelete(item.id, item.full_name)}
                      style={{ padding: 6 }}
                    >
                      <Trash2 size={17} color="#ef5350" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* ── ACTION BUTTONS ── */}
              <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', gap: 8 }}>
                <ContactBtn
                  emoji="📞"
                  label={t('call')}
                  bgColor="#e8f5e9"
                  textColor="#2e7d32"
                  onPress={() => openCall(item.phone)}
                />
                <ContactBtn
                  emoji="💬"
                  label="WhatsApp"
                  bgColor="#dcf8c6"
                  textColor="#1b5e20"
                  onPress={() => openWhatsApp(item.phone)}
                />
                <ContactBtn
                  emoji="✉️"
                  label="Messenger"
                  bgColor="#e8eaf6"
                  textColor={PRIMARY_BLUE}
                  onPress={() => openMessenger(item.phone)}
                />
              </View>
            </View>
          );
        }}
      />

      {/* ── ADD / EDIT MODAL ── */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              maxHeight: '85%',
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
              <View
                style={{
                  flexDirection: rtl ? 'row-reverse' : 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: '900', color: PRIMARY_BLUE }}>
                  {editingEmployee ? (rtl ? 'تعديل الموظف' : 'Modifier Employé') : t('newEmployee')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setIsAddModalVisible(false);
                  setEditingEmployee(null);
                }}
              >
                <Text style={{ color: '#ef5350', fontWeight: '700', fontSize: 15 }}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <FormField
                label={t('fullName')}
                value={formData.full_name}
                onChange={(v) => setFormData({ ...formData, full_name: v })}
                rtl={rtl}
              />
              <FormField
                label={t('role')}
                value={formData.role}
                onChange={(v) => setFormData({ ...formData, role: v })}
                rtl={rtl}
              />
              <FormField
                label={t('phone')}
                value={formData.phone}
                onChange={(v) => setFormData({ ...formData, phone: v })}
                rtl={rtl}
                keyboardType="phone-pad"
              />
              <FormField
                label={t('photoUrl')}
                value={formData.photo_url}
                onChange={(v) => setFormData({ ...formData, photo_url: v })}
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
                {t('type')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {['Teacher', 'Administration', 'Security', 'Other'].map((tp) => (
                  <TouchableOpacity
                    key={tp}
                    onPress={() => setFormData({ ...formData, type: tp })}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderRadius: 12,
                      backgroundColor: formData.type === tp ? PRIMARY_BLUE : '#f0f0f0',
                    }}
                  >
                    <Text
                      style={{
                        color: formData.type === tp ? '#fff' : '#666',
                        fontWeight: '700',
                        fontSize: 13,
                      }}
                    >
                      {tp}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleSave}
                disabled={addMutation.isPending || updateMutation.isPending}
                style={{
                  backgroundColor: PRIMARY_BLUE,
                  height: 56,
                  borderRadius: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 8,
                  marginBottom: 50,
                  opacity: addMutation.isPending || updateMutation.isPending ? 0.6 : 1,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>{t('save')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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

function FormField({
  label,
  value,
  onChange,
  rtl,
  multiline = false,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rtl: boolean;
  multiline?: boolean;
  keyboardType?: any;
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
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboardType}
        style={{
          backgroundColor: '#f5f5f5',
          borderRadius: 12,
          paddingHorizontal: 14,
          height: multiline ? 90 : 50,
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
