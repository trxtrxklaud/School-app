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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  Plus,
  ChevronLeft,
  GraduationCap,
  User,
  Phone,
  FileText,
  Trash2,
  FileDown,
  Calendar,
  Edit2,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useI18n } from '@/utils/i18n';
import { useSchoolAuthStore } from '@/utils/schoolAuthStore';

const PRIMARY_BLUE = '#1a237e';
const GOLD = '#f9a825';

const CLASSES = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'];

const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  android: { elevation: 3 },
}) as object;

const strongShadow = Platform.select({
  ios: {
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  android: { elevation: 5 },
}) as object;

/** Robust CSV parser: handles quoted fields, trims whitespace */
function parseCSV(raw: string): Record<string, string>[] {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return [];

  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && !inQuotes) {
        inQuotes = true;
        continue;
      }
      if (ch === '"' && inQuotes) {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
        continue;
      }
      if (ch === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
        continue;
      }
      current += ch;
    }
    cells.push(current.trim());
    return cells;
  };

  const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z_]/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = parseRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = vals[idx] || '';
    });

    // Map common column aliases
    const mapped: Record<string, string> = {
      full_name: obj.full_name || obj.nom || obj.name || obj.fullname || '',
      class_name: obj.class_name || obj.class || obj.classe || obj.cls || '',
      birth_date: obj.birth_date || obj.birthdate || obj.date_naissance || obj.dob || '',
      parent_name: obj.parent_name || obj.parentname || obj.parent || obj.nom_parent || '',
      parent_phone: obj.parent_phone || obj.phone || obj.telephone || obj.tel || '',
      notes: obj.notes || obj.note || obj.remarques || '',
    };
    if (mapped.full_name) rows.push(mapped);
  }

  // Sort alphabetically by full_name
  rows.sort((a, b) => a.full_name.localeCompare(b.full_name, 'fr', { sensitivity: 'base' }));
  return rows;
}

export default function StudentsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { t, isRTL } = useI18n();
  const { user } = useSchoolAuthStore();
  const rtl = isRTL;
  const isAdmin = user?.role === 'admin';

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    class_name: '',
    parent_name: '',
    parent_phone: '',
    notes: '',
    birth_date: '',
  });

  // Fetch stats to show class counts on the grid
  const { data: stats } = useQuery({
    queryKey: ['school-stats'],
    queryFn: async () => {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/stats`);
      return res.json();
    },
  });

  const classCountMap: Record<string, number> = {};
  if (stats?.studentsPerClass) {
    stats.studentsPerClass.forEach((c: any) => {
      classCountMap[c.class_name] = c.count;
    });
  }

  const { data: students, isLoading } = useQuery({
    queryKey: ['students', selectedClass, searchQuery],
    queryFn: async () => {
      let url = `${process.env.EXPO_PUBLIC_BASE_URL}/api/school/students?`;
      if (selectedClass) url += `className=${encodeURIComponent(selectedClass)}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!(selectedClass || searchQuery),
  });

  const addStudentMutation = useMutation({
    mutationFn: async (newStudent: any) => {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['school-stats'] });
      setIsAddModalVisible(false);
      resetForm();
    },
    onError: () => Alert.alert(t('error'), rtl ? 'فشل حفظ التلميذ' : "Échec de l'enregistrement"),
  });

  const updateStudentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/students`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsAddModalVisible(false);
      setEditingStudent(null);
      resetForm();
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/students?id=${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['school-stats'] });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/school/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['school-stats'] });
      Alert.alert(t('importSuccess'), `${vars.length} ${t('importedStudents')}`);
    },
    onError: () =>
      Alert.alert(
        t('importError'),
        rtl ? 'تعذر استيراد الملف' : "Impossible d'importer le fichier"
      ),
  });

  const resetForm = () =>
    setFormData({
      full_name: '',
      class_name: selectedClass || '',
      parent_name: '',
      parent_phone: '',
      notes: '',
      birth_date: '',
    });

  const openEditModal = (student: any) => {
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name || '',
      class_name: student.class_name || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      notes: student.notes || '',
      birth_date: student.birth_date ? student.birth_date.split('T')[0] : '',
    });
    setIsAddModalVisible(true);
  };

  const handleSave = () => {
    if (editingStudent) {
      updateStudentMutation.mutate({ id: editingStudent.id, ...formData });
    } else {
      addStudentMutation.mutate(formData);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;

      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const parsed = parseCSV(fileContent);

      if (parsed.length === 0) {
        Alert.alert(
          t('importError'),
          rtl
            ? 'تأكد من أن الملف بتنسيق CSV ويحتوي على عمود full_name'
            : 'Vérifiez que le fichier est en format CSV avec une colonne full_name'
        );
        return;
      }

      // Apply selected class if no class_name in CSV
      const withClass = parsed.map((row) => ({
        ...row,
        class_name: row.class_name || selectedClass || '',
      }));

      importMutation.mutate(withClass);
    } catch {
      Alert.alert(t('importError'), rtl ? 'تعذر قراءة الملف' : 'Impossible de lire le fichier');
    }
  };

  const confirmDelete = (id: number, name: string) => {
    Alert.alert(t('confirmDelete'), `${t('deleteStudentConfirm')}\n"${name}"`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteBtn'),
        style: 'destructive',
        onPress: () => deleteStudentMutation.mutate(id),
      },
    ]);
  };

  // ── CLASS GRID ──────────────────────────────────────────────────
  if (!selectedClass && !searchQuery) {
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
            {t('classes')}
          </Text>
          <Text
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 13,
              marginTop: 4,
              textAlign: rtl ? 'right' : 'left',
            }}
          >
            {rtl ? 'اختر قسماً لعرض التلاميذ' : 'Sélectionnez une classe pour voir les élèves'}
          </Text>
        </View>

        {/* Search + Import bar */}
        <View
          style={{
            padding: 16,
            flexDirection: rtl ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: '#fff',
              borderRadius: 14,
              paddingHorizontal: 14,
              flexDirection: rtl ? 'row-reverse' : 'row',
              alignItems: 'center',
              height: 48,
              ...shadow,
            }}
          >
            <Search
              size={18}
              color="#aaa"
              style={{ marginRight: rtl ? 0 : 8, marginLeft: rtl ? 8 : 0 }}
            />
            <TextInput
              placeholder={t('searchStudents')}
              placeholderTextColor="#aaa"
              style={{ flex: 1, color: '#333', fontSize: 14, textAlign: rtl ? 'right' : 'left' }}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          {isAdmin && (
            <TouchableOpacity
              onPress={handleImport}
              style={{
                height: 48,
                paddingHorizontal: 16,
                borderRadius: 14,
                backgroundColor: GOLD,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                ...strongShadow,
              }}
            >
              <FileDown size={18} color={PRIMARY_BLUE} />
              <Text style={{ color: PRIMARY_BLUE, fontWeight: '800', fontSize: 13 }}>CSV</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Class grid */}
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {CLASSES.map((cls, idx) => {
              const colors = ['#e8eaf6', '#e0f2f1', '#fff8e1', '#fce4ec', '#e3f2fd', '#f3e5f5'];
              const bg = colors[idx % colors.length];
              const count = classCountMap[cls] || 0;
              return (
                <TouchableOpacity
                  key={cls}
                  onPress={() => setSelectedClass(cls)}
                  activeOpacity={0.8}
                  style={{
                    width: '48%',
                    backgroundColor: '#fff',
                    borderRadius: 20,
                    padding: 20,
                    marginBottom: 14,
                    ...shadow,
                    borderTopWidth: 4,
                    borderTopColor: PRIMARY_BLUE,
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      backgroundColor: bg,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 12,
                      alignSelf: rtl ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <GraduationCap size={26} color={PRIMARY_BLUE} />
                  </View>
                  <Text
                    style={{
                      fontSize: 26,
                      fontWeight: '900',
                      color: PRIMARY_BLUE,
                      textAlign: rtl ? 'right' : 'left',
                    }}
                  >
                    {cls}
                  </Text>
                  <Text
                    style={{
                      color: count > 0 ? GOLD : '#bdbdbd',
                      fontSize: 13,
                      marginTop: 4,
                      fontWeight: count > 0 ? '800' : '400',
                      textAlign: rtl ? 'right' : 'left',
                    }}
                  >
                    {count > 0
                      ? `${count} ${t('studentCount')}`
                      : rtl
                        ? 'لا يوجد تلاميذ'
                        : 'Aucun élève'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── STUDENT LIST ────────────────────────────────────────────────
  const sortedStudents = Array.isArray(students)
    ? [...students].sort((a, b) => a.full_name.localeCompare(b.full_name, 'fr'))
    : [];
  const isSaving = addStudentMutation.isPending || updateStudentMutation.isPending;

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f2f8' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: PRIMARY_BLUE,
          paddingTop: insets.top,
          paddingBottom: 18,
          paddingHorizontal: 20,
          flexDirection: rtl ? 'row-reverse' : 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={() => {
            setSelectedClass(null);
            setSearchQuery('');
          }}
          style={{ marginRight: rtl ? 0 : 14, marginLeft: rtl ? 14 : 0, padding: 4 }}
        >
          <ChevronLeft size={26} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 20,
              fontWeight: '900',
              textAlign: rtl ? 'right' : 'left',
            }}
          >
            {selectedClass ? `${rtl ? 'قسم' : 'Classe'} ${selectedClass}` : t('students')}
          </Text>
          <Text
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 12,
              textAlign: rtl ? 'right' : 'left',
            }}
          >
            {sortedStudents.length} {t('studentCount')}
          </Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            onPress={() => {
              setEditingStudent(null);
              resetForm();
              setIsAddModalVisible(true);
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: GOLD,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Plus size={22} color={PRIMARY_BLUE} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search inside class */}
      {selectedClass && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 14,
              paddingHorizontal: 14,
              flexDirection: rtl ? 'row-reverse' : 'row',
              alignItems: 'center',
              height: 46,
              ...shadow,
            }}
          >
            <Search
              size={16}
              color="#aaa"
              style={{ marginRight: rtl ? 0 : 8, marginLeft: rtl ? 8 : 0 }}
            />
            <TextInput
              placeholder={t('searchStudents')}
              placeholderTextColor="#aaa"
              style={{ flex: 1, color: '#333', fontSize: 14, textAlign: rtl ? 'right' : 'left' }}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      )}

      <FlatList
        data={sortedStudents}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🎓</Text>
              <Text style={{ color: '#bdbdbd', fontSize: 16, fontWeight: '600' }}>
                {t('noStudentsFound')}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 18,
              padding: 16,
              marginBottom: 12,
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
              <View
                style={{
                  flexDirection: rtl ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  flex: 1,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#e8eaf6',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: rtl ? 0 : 12,
                    marginLeft: rtl ? 12 : 0,
                  }}
                >
                  <Text style={{ fontSize: 18, fontWeight: '800', color: PRIMARY_BLUE }}>
                    {item.full_name?.charAt(0)?.toUpperCase()}
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
                  <View
                    style={{
                      flexDirection: rtl ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      marginTop: 4,
                      gap: 6,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: `${PRIMARY_BLUE}15`,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: PRIMARY_BLUE, fontSize: 11, fontWeight: '700' }}>
                        {item.class_name}
                      </Text>
                    </View>
                    {item.birth_date && (
                      <Text style={{ color: '#9e9e9e', fontSize: 11 }}>
                        {new Date(item.birth_date).toLocaleDateString(rtl ? 'ar-DZ' : 'fr-FR')}
                      </Text>
                    )}
                  </View>
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
                    <Trash2 size={16} color="#ef5350" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={{ height: 1, backgroundColor: '#f5f5f5', marginVertical: 12 }} />

            <View
              style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 16 }}
            >
              <View
                style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 5 }}
              >
                <User size={13} color="#9e9e9e" />
                <Text
                  style={{ fontSize: 12, color: '#666', writingDirection: rtl ? 'rtl' : 'ltr' }}
                  numberOfLines={1}
                >
                  {item.parent_name || '—'}
                </Text>
              </View>
              <View
                style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 5 }}
              >
                <Phone size={13} color="#9e9e9e" />
                <Text style={{ fontSize: 12, color: '#666' }}>{item.parent_phone || '—'}</Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* Add / Edit Modal */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              maxHeight: '88%',
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
                {editingStudent ? t('editStudent') : t('newStudent')}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsAddModalVisible(false);
                  setEditingStudent(null);
                  resetForm();
                }}
              >
                <Text style={{ color: '#ef5350', fontWeight: '700', fontSize: 15 }}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <FormInput
                label={t('fullName')}
                value={formData.full_name}
                onChangeText={(v: string) => setFormData({ ...formData, full_name: v })}
                icon={<User size={16} color="#9e9e9e" />}
                rtl={rtl}
              />
              <FormInput
                label={t('class')}
                value={formData.class_name}
                onChangeText={(v: string) => setFormData({ ...formData, class_name: v })}
                icon={<GraduationCap size={16} color="#9e9e9e" />}
                rtl={rtl}
              />
              <FormInput
                label={`${t('birthDate')} (YYYY-MM-DD)`}
                value={formData.birth_date}
                onChangeText={(v: string) => setFormData({ ...formData, birth_date: v })}
                icon={<Calendar size={16} color="#9e9e9e" />}
                rtl={rtl}
              />
              <FormInput
                label={t('parentName')}
                value={formData.parent_name}
                onChangeText={(v: string) => setFormData({ ...formData, parent_name: v })}
                icon={<User size={16} color="#9e9e9e" />}
                rtl={rtl}
              />
              <FormInput
                label={t('parentPhone')}
                value={formData.parent_phone}
                onChangeText={(v: string) => setFormData({ ...formData, parent_phone: v })}
                icon={<Phone size={16} color="#9e9e9e" />}
                rtl={rtl}
                keyboardType="phone-pad"
              />
              <FormInput
                label={t('notes')}
                value={formData.notes}
                onChangeText={(v: string) => setFormData({ ...formData, notes: v })}
                icon={<FileText size={16} color="#9e9e9e" />}
                rtl={rtl}
                multiline
              />

              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                style={{
                  backgroundColor: PRIMARY_BLUE,
                  height: 56,
                  borderRadius: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 12,
                  marginBottom: 50,
                  opacity: isSaving ? 0.6 : 1,
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

function FormInput({
  label,
  value,
  onChangeText,
  icon,
  rtl,
  multiline = false,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  icon: any;
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
      <View
        style={{
          flexDirection: rtl ? 'row-reverse' : 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingTop: multiline ? 12 : 0,
          minHeight: multiline ? 90 : 50,
          borderWidth: 1,
          borderColor: '#eeeeee',
        }}
      >
        <View style={{ marginRight: rtl ? 0 : 10, marginLeft: rtl ? 10 : 0 }}>{icon}</View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          keyboardType={keyboardType}
          style={{
            flex: 1,
            color: '#333',
            fontSize: 14,
            textAlign: rtl ? 'right' : 'left',
            writingDirection: rtl ? 'rtl' : 'ltr',
          }}
        />
      </View>
    </View>
  );
}
