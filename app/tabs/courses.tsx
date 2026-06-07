// app/tabs/courses.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, query, where, getDocs, addDoc, serverTimestamp, arrayUnion, updateDoc, doc,
} from 'firebase/firestore';
import { db } from '@/constants/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/Colors';
import BottomNav from '@/components/BottomNav';
import { useRouter } from 'expo-router';

interface Course {
  id: string;
  title: string;
  code: string;
  instructor: string;
  instructorId: string;
  credits: number;
  description: string;
  schedule: string;
  room: string;
  enrolledStudents: string[];
}

const COURSE_COLORS = ['#0a2463', '#c8102e', '#7c3aed', '#059669', '#d97706', '#0891b2'];

export default function CoursesScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);

  // Create form
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState('3');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [room, setRoom] = useState('');
  const [saving, setSaving] = useState(false);

  const isInstructor = profile?.role === 'instructor';

  const fetchMyCourses = async () => {
    if (!profile) return;
    setLoading(true);
    const ref = collection(db, 'courses');
    const q = isInstructor
      ? query(ref, where('instructorId', '==', profile.uid))
      : query(ref, where('enrolledStudents', 'array-contains', profile.uid));
    const snap = await getDocs(q);
    setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
    setLoading(false);
  };

  const fetchAllCourses = async () => {
    const snap = await getDocs(collection(db, 'courses'));
    setAllCourses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
  };

  useEffect(() => { fetchMyCourses(); }, [profile]);

  const handleCreate = async () => {
    if (!title || !code) { Alert.alert('Error', 'Title and code are required.'); return; }
    setSaving(true);
    try {
      console.log('Creating course...');
      await addDoc(collection(db, 'courses'), {
        title, code: code.toUpperCase(), credits: parseInt(credits) || 3,
        description, schedule, room,
        instructor: profile?.name || 'Unknown Instructor',
        instructorId: profile?.uid,
        enrolledStudents: [],
        createdAt: serverTimestamp(),
      });
      console.log('Course created successfully');
      setShowCreate(false);
      setTitle(''); setCode(''); setDescription(''); setSchedule(''); setRoom('');
      fetchMyCourses();
    } catch (e: any) {
      console.error('Error creating course:', e);
      Alert.alert('Error', 'Could not create course: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!profile) return;
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        enrolledStudents: arrayUnion(profile.uid),
      });
      Alert.alert('Success', 'Enrolled successfully!');
      setShowEnroll(false);
      fetchMyCourses();
    } catch (e) {
      Alert.alert('Error', 'Could not enroll.');
    }
  };

  const renderCourse = ({ item, index }: { item: Course; index: number }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => router.push(`/course/${item.id}`)}
    >
      <View style={[styles.courseColorBar, { backgroundColor: COURSE_COLORS[index % COURSE_COLORS.length] }]} />
      <View style={styles.courseBody}>
        <View style={styles.courseHeader}>
          <Text style={styles.courseCode}>{item.code}</Text>
          <View style={styles.creditsBadge}><Text style={styles.creditsText}>{item.credits} cr</Text></View>
        </View>
        <Text style={styles.courseTitle}>{item.title}</Text>
        {item.schedule ? <Text style={styles.courseMeta}><Ionicons name="time-outline" size={12} /> {item.schedule}</Text> : null}
        {item.room ? <Text style={styles.courseMeta}><Ionicons name="location-outline" size={12} /> {item.room}</Text> : null}
        {!isInstructor && <Text style={styles.courseMeta}><Ionicons name="person-outline" size={12} /> {item.instructor}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isInstructor ? 'My Courses' : 'Enrolled Courses'}
        </Text>
        <View style={styles.headerActions}>
          {!isInstructor && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => { fetchAllCourses(); setShowEnroll(true); }}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.actionBtnText}>Enroll</Text>
            </TouchableOpacity>
          )}
          {isInstructor && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowCreate(true)}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.actionBtnText}>Create</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={courses}
          keyExtractor={i => i.id}
          renderItem={renderCourse}
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>
                {isInstructor ? 'No courses yet. Create your first one!' : 'Not enrolled in any courses.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Create Course Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Course</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ModalInput label="Course Title *" placeholder="e.g. Advanced Data Structures" value={title} onChangeText={setTitle} />
            <ModalInput label="Course Code *" placeholder="e.g. COMP5413" value={code} onChangeText={setCode} autoCapitalize="characters" />
            <ModalInput label="Credits" placeholder="3" value={credits} onChangeText={setCredits} keyboardType="numeric" />
            <ModalInput label="Schedule" placeholder="e.g. Mon/Wed 10:00–11:30" value={schedule} onChangeText={setSchedule} />
            <ModalInput label="Room" placeholder="e.g. Ryan Building 2020" value={room} onChangeText={setRoom} />
            <ModalInput label="Description" placeholder="Brief course description..." value={description} onChangeText={setDescription} multiline />
            <TouchableOpacity style={styles.saveBtn} onPress={handleCreate} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Create Course</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Enroll Modal */}
      <Modal visible={showEnroll} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Available Courses</Text>
              <TouchableOpacity onPress={() => setShowEnroll(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={allCourses.filter(c => !c.enrolledStudents?.includes(profile?.uid ?? ''))}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <View style={styles.enrollRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.enrollCode}>{item.code}</Text>
                    <Text style={styles.enrollTitle}>{item.title}</Text>
                    <Text style={styles.enrollMeta}>{item.instructor} · {item.credits} credits</Text>
                  </View>
                  <TouchableOpacity style={styles.enrollBtn} onPress={() => handleEnroll(item.id)}>
                    <Text style={styles.enrollBtnText}>Enroll</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No available courses to enroll in.</Text>}
            />
          </View>
        </View>
      </Modal>

      <BottomNav active="courses" />
    </View>
  );
}

function ModalInput({ label, ...props }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.modalInput, props.multiline && { height: 80, textAlignVertical: 'top' }]}
        placeholderTextColor={Colors.textMuted}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary + '15', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  actionBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  courseCard: {
    backgroundColor: Colors.card, borderRadius: 14, flexDirection: 'row',
    alignItems: 'center', overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  courseColorBar: { width: 6, alignSelf: 'stretch' },
  courseBody: { flex: 1, padding: 14, gap: 4 },
  courseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  courseCode: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  creditsBadge: { backgroundColor: Colors.primary + '15', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  creditsText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  courseTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  courseMeta: { fontSize: 12, color: Colors.textLight },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  inputLabel: { fontSize: 12, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  modalInput: {
    backgroundColor: Colors.background, borderRadius: 10, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 12, height: 44, fontSize: 14, color: Colors.text,
  },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  enrollRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12,
  },
  enrollCode: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  enrollTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  enrollMeta: { fontSize: 12, color: Colors.textLight },
  enrollBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  enrollBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
