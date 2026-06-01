import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Upload, Trash2, FileText, ExternalLink, Plus } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useUpload from '@/utils/useUpload';
import * as DocumentPicker from 'expo-document-picker';
import { useI18n } from '@/utils/i18n';

const PRIMARY_BLUE = '#1a237e';
const GOLD = '#f9a825';

const TARGET_TYPES = ['class', 'teacher', 'room'];

const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  android: { elevation: 3 },
}) as object;

export default function TimetablesScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [upload] = useUpload();
  const { t, isRTL } = useI18n();
  const rtl = isRTL;

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    target_name: '',
    target_type: 'class' as 'class' | 'teacher' | 'room',
  });

  const { data: timetables, isLoading } = useQuery({
    queryKey: ['timetables'],
    queryFn: async () => {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/timetables`);
      return response.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/timetables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetables'] });
      setIsAddModalVisible(false);
      setUploading(false);
    },
  });

  const handlePickFile = async () => {
    if (!formData.target_name) {
      Alert.alert(t('error'), rtl ? 'الرجاء إدخال اسم الهدف' : 'Veuillez saisir un nom de cible');
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/*',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
      });
      if (!result.canceled && result.assets?.length) {
        setUploading(true);
        const asset = result.assets[0];
        // Cast to any to satisfy the useUpload type since DocumentPickerAsset differs from ImagePickerAsset
        const uploadResult = await upload({ reactNativeAsset: asset as any });
        if ('url' in uploadResult) {
          uploadMutation.mutate({
            target_name: formData.target_name,
            target_type: formData.target_type,
            file_url: uploadResult.url,
            file_name: asset.name,
          });
        } else {
          Alert.alert(t('error'), rtl ? 'فشل رفع الملف' : 'Échec du téléchargement');
          setUploading(false);
        }
      }
    } catch {
      Alert.alert(t('error'), rtl ? 'حدث خطأ' : 'Une erreur est survenue');
      setUploading(false);
    }
  };

  const openFile = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert(t('error'), rtl ? 'تعذر فتح الملف' : "Impossible d'ouvrir le fichier")
    );
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/timetables?id=${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timetables'] }),
  });

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
            <Clock size={22} color={GOLD} />
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>
              {t('timetables')}
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
        data={Array.isArray(timetables) ? timetables : []}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📄</Text>
              <Text style={{ color: '#bdbdbd', fontSize: 16, fontWeight: '600' }}>
                {rtl ? 'لا توجد جداول دروس' : 'Aucun emploi du temps'}
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
                <FileText size={24} color={PRIMARY_BLUE} />
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
                  {item.target_name}
                </Text>
                <Text
                  style={{
                    color: '#9e9e9e',
                    fontSize: 12,
                    marginTop: 2,
                    textAlign: rtl ? 'right' : 'left',
                  }}
                >
                  {item.target_type} · {item.file_name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => deleteMutation.mutate(item.id)}
                style={{ padding: 6 }}
              >
                <Trash2 size={17} color="#ef5350" />
              </TouchableOpacity>
            </View>
            <View style={{ height: 1, backgroundColor: '#f5f5f5', marginVertical: 12 }} />
            <View
              style={{
                flexDirection: rtl ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#bdbdbd', fontSize: 11 }}>
                {new Date(item.uploaded_at).toLocaleDateString(rtl ? 'ar-DZ' : 'fr-FR')}
              </Text>
              <View
                style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}
              >
                <TouchableOpacity
                  onPress={() => openFile(item.file_url)}
                  style={{
                    flexDirection: rtl ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    backgroundColor: '#e8eaf6',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 10,
                    gap: 5,
                  }}
                >
                  <ExternalLink size={13} color={PRIMARY_BLUE} />
                  <Text style={{ color: PRIMARY_BLUE, fontSize: 12, fontWeight: '700' }}>
                    {rtl ? 'فتح الملف' : 'Ouvrir'}
                  </Text>
                </TouchableOpacity>
              </View>
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
              maxHeight: '55%',
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
                {rtl ? 'إضافة جدول دروس' : 'Ajouter Emploi du Temps'}
              </Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <Text style={{ color: '#ef5350', fontWeight: '700', fontSize: 15 }}>
                  {t('close')}
                </Text>
              </TouchableOpacity>
            </View>

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
              {rtl ? 'نوع الجدول' : 'Type de Cible'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {TARGET_TYPES.map((tp) => (
                <TouchableOpacity
                  key={tp}
                  onPress={() => setFormData({ ...formData, target_type: tp as any })}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: formData.target_type === tp ? PRIMARY_BLUE : '#f5f5f5',
                  }}
                >
                  <Text
                    style={{
                      color: formData.target_type === tp ? '#fff' : '#666',
                      fontWeight: '700',
                      fontSize: 13,
                      textTransform: 'capitalize',
                    }}
                  >
                    {tp}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
              {rtl ? 'الاسم (مثال: 6A، الأستاذ...)' : 'Nom (ex: 6A, Mr. X, Salle 4)'}
            </Text>
            <TextInput
              value={formData.target_name}
              onChangeText={(v) => setFormData({ ...formData, target_name: v })}
              style={{
                backgroundColor: '#f5f5f5',
                borderRadius: 12,
                paddingHorizontal: 14,
                height: 50,
                color: '#333',
                fontSize: 14,
                marginBottom: 20,
                textAlign: rtl ? 'right' : 'left',
                writingDirection: rtl ? 'rtl' : 'ltr',
                borderWidth: 1,
                borderColor: '#eeeeee',
              }}
            />

            <TouchableOpacity
              onPress={handlePickFile}
              disabled={uploading}
              style={{
                backgroundColor: GOLD,
                height: 56,
                borderRadius: 16,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 10,
                opacity: uploading ? 0.7 : 1,
              }}
            >
              <Upload size={20} color={PRIMARY_BLUE} />
              <Text style={{ color: PRIMARY_BLUE, fontSize: 17, fontWeight: '800' }}>
                {uploading
                  ? rtl
                    ? 'جارٍ الرفع...'
                    : 'Téléchargement...'
                  : rtl
                    ? 'اختر الملف وارفعه'
                    : 'Choisir & Télécharger'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
