// app/tabs/grades.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  TextInput, Alert, ActivityIndicator, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/constants/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/Colors';
import BottomNav from '@/components/BottomNav';

interface Grade {
  id: string;
  courseCode: string;
  courseTitle: string;
  assignmentName: string;
  score: number;
  maxScore: number;
  type: 'assignment' | 'midterm' | 'final' | 'quiz';
  studentId: string;
  studentName: string;
  createdAt: any;
}

const TYPE_COLOR: Record<string, string> = {
  assignment: Colors.primary,
  midterm: '#7c3aed',
  final: Colors.secondary,
  quiz: '#059669',
};

function getLetterGrade(pct: number) {
  if (pct >= 90) return 'A+';
  if (pct >= 85) return 'A';
  if (pct >= 80) return 'A-';
  if (pct >= 77) return 'B+';
  if (pct >= 73) return 'B';
  if (pct >= 70) return 'B-';
  if (pct >= 67) return 'C+';
  if (pct >= 63) return 'C';
  if (pct >= 60) return 'C-';
  if (pct >= 50) return 'D';
  return 'F';
}

function getGradeColor(pct: number) {
  if (pct >= 80) return Colors.success;
  if (pct >= 65) return Colors.warning;
  return Colors.error;
}

export default function GradesScreen() {
  const { profile } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const isInstructor = profile?.role === 'instructor';

  // Add grade form
  const [studentEmail, setStudentEmail] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [assignmentName, setAssignmentName] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [type, setType] = useState<Grade['type']>('assignment');
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<any[]>([]);

  const fetchGrades = async () => {
    if (!profile) return;
    setLoading(true);
    const ref = collection(db, 'grades');
    const q = isInstructor
      ? query(ref, where('instructorId', '==', profile.uid))
      : query(ref, where('studentId', '==', profile.uid));
    const snap = await getDocs(q);
    setGrades(snap.docs.map(d => ({ id: d.id, ...d.data() } as Grade)));
    setLoading(false);
  };

  const fetchStudents = async () => {
    const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
    setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchGrades(); }, [profile]);

  const handleAddGrade = async () => {
    if (!courseCode || !assignmentName || !score) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }
    const student = students.find(s => s.email === studentEmail.trim());
    if (!student) {
      Alert.alert('Error', 'Student email not found in the system.');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'grades'), {
        courseCode: courseCode.toUpperCase(),
        courseTitle,
        assignmentName,
        score: parseFloat(score),
        maxScore: parseFloat(maxScore) || 100,
        type,
        studentId: student.uid,
        studentName: student.name,
        instructorId: profile?.uid,
        createdAt: serverTimestamp(),
      });
      setShowAdd(false);
      setStudentEmail(''); setCourseCode(''); setCourseTitle('');
      setAssignmentName(''); setScore(''); setMaxScore('100');
      fetchGrades();
    } catch (e) {
      Alert.alert('Error', 'Could not save grade.');
    } finally {
      setSaving(false);
    }
  };

  // Compute GPA for students
  const overallPct = grades.length
    ? grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / grades.length
    : 0;

  const groupedByCourse = grades.reduce((acc, g) => {
    if (!acc[g.courseCode]) acc[g.courseCode] = { title: g.courseTitle, grades: [] };
    acc[g.courseCode].grades.push(g);
    return acc;
  }, {} as Record<string, { title: string; grades: Grade[] }>);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isInstructor ? 'Grade Management' : 'My Grades'}</Text>
        {isInstructor && (
          <TouchableOpacity style={styles.addBtn} onPress={() => { fetchStudents(); setShowAdd(true); }}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add Grade</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 16 }}>

          {/* GPA Summary for students */}
          {!isInstructor && grades.length > 0 && (
            <View style={styles.gpaCard}>
              <View style={styles.gpaLeft}>
                <Text style={styles.gpaLabel}>Overall Average</Text>
                <Text style={[styles.gpaValue, { color: getGradeColor(overallPct) }]}>
                  {overallPct.toFixed(1)}%
                </Text>
                <Text style={styles.gpaLetter}>{getLetterGrade(overallPct)}</Text>
              </View>
              <View style={styles.gpaStat}>
                <Text style={styles.gpaStatNum}>{grades.length}</Text>
                <Text style={styles.gpaStatLabel}>Assessments</Text>
              </View>
              <View style={styles.gpaStat}>
                <Text style={styles.gpaStatNum}>{Object.keys(groupedByCourse).length}</Text>
                <Text style={styles.gpaStatLabel}>Courses</Text>
              </View>
            </View>
          )}

          {/* Grades grouped by course */}
          {Object.entries(groupedByCourse).map(([code, { title, grades: courseGrades }]) => {
            const avg = courseGrades.reduce((s, g) => s + (g.score / g.maxScore) * 100, 0) / courseGrades.length;
            return (
              <View key={code} style={styles.courseSection}>
                <View style={styles.courseSectionHeader}>
                  <View>
                    <Text style={styles.courseCode}>{code}</Text>
                    <Text style={styles.courseTitle}>{title}</Text>
                  </View>
                  {!isInstructor && (
                    <View style={[styles.avgBadge, { backgroundColor: getGradeColor(avg) + '20' }]}>
                      <Text style={[styles.avgText, { color: getGradeColor(avg) }]}>{avg.toFixed(0)}%</Text>
                    </View>
                  )}
                </View>
                {courseGrades.map(g => {
                  const pct = (g.score / g.maxScore) * 100;
                  return (
                    <View key={g.id} style={styles.gradeRow}>
                      <View style={[styles.typeBadge, { backgroundColor: TYPE_COLOR[g.type] + '15' }]}>
                        <Text style={[styles.typeText, { color: TYPE_COLOR[g.type] }]}>{g.type}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.assignmentName}>{g.assignmentName}</Text>
                        {isInstructor && <Text style={styles.studentName}>{g.studentName}</Text>}
                      </View>
                      <Text style={[styles.gradeScore, { color: getGradeColor(pct) }]}>
                        {g.score}/{g.maxScore}
                      </Text>
                      <Text style={[styles.letterGrade, { color: getGradeColor(pct) }]}>
                        {getLetterGrade(pct)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })}

          {grades.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="bar-chart-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>
                {isInstructor ? 'No grades entered yet.' : 'No grades recorded yet.'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Grade Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Grade</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <MInput label="Student Email *" placeholder="student@lakeheadu.ca" value={studentEmail} onChangeText={setStudentEmail} autoCapitalize="none" keyboardType="email-address" />
              <MInput label="Course Code *" placeholder="COMP5413" value={courseCode} onChangeText={setCourseCode} autoCapitalize="characters" />
              <MInput label="Course Title" placeholder="Advanced Data Structures" value={courseTitle} onChangeText={setCourseTitle} />
              <MInput label="Assessment Name *" placeholder="Assignment 1" value={assignmentName} onChangeText={setAssignmentName} />
              <View style={styles.row}>
                <View style={{ flex: 1 }}><MInput label="Score *" placeholder="85" value={score} onChangeText={setScore} keyboardType="numeric" /></View>
                <View style={{ flex: 1 }}><MInput label="Out of" placeholder="100" value={maxScore} onChangeText={setMaxScore} keyboardType="numeric" /></View>
              </View>
              <Text style={styles.mInputLabel}>Type</Text>
              <View style={styles.typeRow}>
                {(['assignment', 'quiz', 'midterm', 'final'] as Grade['type'][]).map(t => (
                  <TouchableOpacity key={t} style={[styles.typeBtn, type === t && { backgroundColor: TYPE_COLOR[t] }]}
                    onPress={() => setType(t)}>
                    <Text style={[styles.typeBtnText, type === t && { color: '#fff' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddGrade} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Grade</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BottomNav active="grades" />
    </View>
  );
}

function MInput({ label, ...props }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.mInputLabel}>{label}</Text>
      <TextInput style={styles.mInput} placeholderTextColor={Colors.textMuted} {...props} />
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
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  gpaCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  gpaLeft: { flex: 1 },
  gpaLabel: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },
  gpaValue: { fontSize: 36, fontWeight: '800' },
  gpaLetter: { fontSize: 16, color: Colors.textLight, fontWeight: '700' },
  gpaStat: { alignItems: 'center', paddingHorizontal: 16 },
  gpaStatNum: { fontSize: 22, fontWeight: '800', color: Colors.text },
  gpaStatLabel: { fontSize: 11, color: Colors.textMuted },
  courseSection: { backgroundColor: Colors.card, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
  courseSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  courseCode: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  courseTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  avgBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  avgText: { fontSize: 14, fontWeight: '800' },
  gradeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: Colors.border + '80' },
  typeBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, minWidth: 68, alignItems: 'center' },
  typeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  assignmentName: { fontSize: 13, fontWeight: '600', color: Colors.text },
  studentName: { fontSize: 11, color: Colors.textLight },
  gradeScore: { fontSize: 13, fontWeight: '700' },
  letterGrade: { fontSize: 14, fontWeight: '800', minWidth: 28, textAlign: 'right' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  mInputLabel: { fontSize: 12, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  mInput: { backgroundColor: Colors.background, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, height: 44, fontSize: 14, color: Colors.text },
  row: { flexDirection: 'row', gap: 12 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  typeBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.border },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
