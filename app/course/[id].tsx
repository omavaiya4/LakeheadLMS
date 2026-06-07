// app/course/[id].tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/constants/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/Colors';

interface CourseData {
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

interface Announcement {
  id: string;
  title: string;
  body: string;
  courseCode: string;
  createdAt: any;
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'announcements' | 'students'>('overview');
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const isInstructor = profile?.uid === course?.instructorId;

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const snap = await getDoc(doc(db, 'courses', id));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as CourseData;
        setCourse(data);

        // Fetch announcements
        const annQ = query(collection(db, 'announcements'), where('courseId', '==', id));
        const annSnap = await getDocs(annQ);
        setAnnouncements(annSnap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));

        // Fetch enrolled students
        if (data.enrolledStudents?.length > 0) {
          const usersSnap = await getDocs(collection(db, 'users'));
          setStudents(usersSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((u: any) => data.enrolledStudents.includes(u.uid)));
        }
      }
      setLoading(false);
    })();
  }, [id]);

  const postAnnouncement = async () => {
    if (!annTitle || !annBody) { Alert.alert('Error', 'Fill in both fields.'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title: annTitle, body: annBody,
        courseId: id, courseCode: course?.code,
        instructorId: profile?.uid, createdAt: serverTimestamp(),
      });
      setAnnouncements(prev => [...prev, {
        id: Date.now().toString(), title: annTitle, body: annBody,
        courseCode: course?.code ?? '', createdAt: null,
      }]);
      setAnnTitle(''); setAnnBody('');
      setShowAnnModal(false);
    } catch {
      Alert.alert('Error', 'Could not post announcement.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 100 }} color={Colors.primary} />;
  if (!course) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Course not found.</Text></View>;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.courseCode}>{course.code}</Text>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <View style={styles.courseMeta}>
          <MetaBadge icon="person-outline" text={course.instructor} />
          <MetaBadge icon="star-outline" text={`${course.credits} Credits`} />
          {course.schedule && <MetaBadge icon="time-outline" text={course.schedule} />}
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['overview', 'announcements', 'students'] as const).map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {course.description ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Description</Text>
                <Text style={styles.descText}>{course.description}</Text>
              </View>
            ) : null}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Course Details</Text>
              <DetailRow icon="book-outline" label="Course Code" value={course.code} />
              <DetailRow icon="person-outline" label="Instructor" value={course.instructor} />
              <DetailRow icon="star-outline" label="Credits" value={`${course.credits}`} />
              {course.schedule && <DetailRow icon="time-outline" label="Schedule" value={course.schedule} />}
              {course.room && <DetailRow icon="location-outline" label="Room" value={course.room} />}
              <DetailRow icon="people-outline" label="Enrolled" value={`${course.enrolledStudents?.length ?? 0} Students`} />
            </View>
          </>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <>
            {isInstructor && (
              <TouchableOpacity style={styles.postBtn} onPress={() => setShowAnnModal(true)}>
                <Ionicons name="megaphone-outline" size={18} color="#fff" />
                <Text style={styles.postBtnText}>Post Announcement</Text>
              </TouchableOpacity>
            )}
            {announcements.length === 0 ? (
              <Empty icon="megaphone-outline" message="No announcements yet." />
            ) : (
              announcements.map(a => (
                <View key={a.id} style={styles.annCard}>
                  <Text style={styles.annTitle}>{a.title}</Text>
                  <Text style={styles.annBody}>{a.body}</Text>
                </View>
              ))
            )}
          </>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <>
            <Text style={styles.studentCount}>{course.enrolledStudents?.length ?? 0} student(s) enrolled</Text>
            {students.length === 0 ? (
              <Empty icon="people-outline" message="No students enrolled yet." />
            ) : (
              students.map((s: any) => (
                <View key={s.id} style={styles.studentCard}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>{s.name?.charAt(0)?.toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.studentName}>{s.name}</Text>
                    <Text style={styles.studentEmail}>{s.email}</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Post Announcement Modal */}
      <Modal visible={showAnnModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Announcement</Text>
              <TouchableOpacity onPress={() => setShowAnnModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.mLabel}>Title</Text>
            <TextInput style={styles.mInput} value={annTitle} onChangeText={setAnnTitle} placeholder="Announcement title" placeholderTextColor={Colors.textMuted} />
            <Text style={styles.mLabel}>Body</Text>
            <TextInput style={[styles.mInput, { height: 100, textAlignVertical: 'top' }]} value={annBody} onChangeText={setAnnBody} placeholder="Write your announcement..." placeholderTextColor={Colors.textMuted} multiline />
            <TouchableOpacity style={styles.saveBtn} onPress={postAnnouncement} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Post</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MetaBadge({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.metaBadge}>
      <Ionicons name={icon} size={12} color="rgba(255,255,255,0.8)" />
      <Text style={styles.metaBadgeText}>{text}</Text>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={16} color={Colors.primary} />
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function Empty({ icon, message }: { icon: any; message: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={40} color={Colors.textMuted} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, gap: 6 },
  backBtn: { marginBottom: 8, alignSelf: 'flex-start' },
  courseCode: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  courseTitle: { fontSize: 22, fontWeight: '800', color: '#fff', lineHeight: 28 },
  courseMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  metaBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.textLight, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  card: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, gap: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  descText: { fontSize: 14, color: Colors.textLight, lineHeight: 22 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 13, color: Colors.textLight, fontWeight: '600', minWidth: 80 },
  detailValue: { fontSize: 13, color: Colors.text, flex: 1 },
  postBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 12, padding: 14, justifyContent: 'center' },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  annCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, gap: 6, borderLeftWidth: 4, borderLeftColor: Colors.primary, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
  annTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  annBody: { fontSize: 13, color: Colors.textLight, lineHeight: 20 },
  studentCount: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 1 },
  studentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  studentName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  studentEmail: { fontSize: 12, color: Colors.textLight },
  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  mLabel: { fontSize: 12, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  mInput: { backgroundColor: Colors.background, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text, marginBottom: 12 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
