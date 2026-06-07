// app/tabs/dashboard.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/constants/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/Colors';
import BottomNav from '@/components/BottomNav';

interface Course {
  id: string;
  title: string;
  code: string;
  instructor: string;
  credits: number;
  color: string;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  courseCode: string;
  createdAt: any;
}

const COURSE_COLORS = ['#0a2463', '#c8102e', '#7c3aed', '#059669', '#d97706'];

export default function DashboardScreen() {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const isInstructor = profile?.role === 'instructor';

  const fetchData = async () => {
    if (!profile) return;
    try {
      // Fetch courses
      const coursesRef = collection(db, 'courses');
      const q = isInstructor
        ? query(coursesRef, where('instructorId', '==', profile.uid))
        : query(coursesRef, where('enrolledStudents', 'array-contains', profile.uid));
      const snap = await getDocs(q);
      const fetchedCourses: Course[] = snap.docs.map((d, i) => ({
        id: d.id,
        color: COURSE_COLORS[i % COURSE_COLORS.length],
        ...d.data(),
      } as Course));
      setCourses(fetchedCourses);

      // Fetch recent announcements
      const annRef = collection(db, 'announcements');
      try {
        const annQ = query(annRef, orderBy('createdAt', 'desc'), limit(5));
        const annSnap = await getDocs(annQ);
        setAnnouncements(annSnap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
      } catch (annError) {
        console.warn('Announcements fetch failed (possibly missing index):', annError);
        // Fallback to unordered fetch if index is not yet built
        const simpleQ = query(annRef, limit(5));
        const annSnap = await getDocs(simpleQ);
        setAnnouncements(annSnap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
      }
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    }
  };

  useEffect(() => { fetchData(); }, [profile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{profile?.name?.split(' ')[0] ?? 'User'} 👋</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatChip icon="book-outline" label={isInstructor ? 'Teaching' : 'Enrolled'} value={`${courses.length} Courses`} />
          <StatChip icon="person-outline" label="Role" value={isInstructor ? 'Instructor' : 'Student'} />
          {!isInstructor && profile?.studentId && (
            <StatChip icon="card-outline" label="ID" value={profile.studentId} />
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* My Courses */}
        <SectionHeader
          title={isInstructor ? 'My Teaching Courses' : 'My Courses'}
          action="See All"
          onAction={() => router.push('/tabs/courses')}
        />
        {courses.length === 0 ? (
          <EmptyCard message={isInstructor ? 'No courses created yet.' : 'Not enrolled in any courses yet.'} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.courseScroll}>
            {courses.map((c) => (
              <TouchableOpacity key={c.id} style={[styles.courseCard, { backgroundColor: c.color }]}
                onPress={() => router.push(`/course/${c.id}`)}>
                <Text style={styles.courseCode}>{c.code}</Text>
                <Text style={styles.courseTitle} numberOfLines={2}>{c.title}</Text>
                <Text style={styles.courseCredits}>{c.credits} Credits</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsGrid}>
          <ActionCard icon="search-outline" label="Search" color="#7c3aed" onPress={() => router.push('/tabs/search')} />
          <ActionCard icon="bar-chart-outline" label="Grades" color="#059669" onPress={() => router.push('/tabs/grades')} />
          <ActionCard icon="person-circle-outline" label="Profile" color="#d97706" onPress={() => router.push('/tabs/profile')} />
          {isInstructor && <ActionCard icon="add-circle-outline" label="New Course" color={Colors.secondary} onPress={() => router.push('/tabs/courses')} />}
        </View>

        {/* Announcements */}
        <SectionHeader title="Recent Announcements" />
        {announcements.length === 0 ? (
          <EmptyCard message="No announcements yet." />
        ) : (
          announcements.map((a) => (
            <View key={a.id} style={styles.announcementCard}>
              <View style={styles.announcementBadge}>
                <Text style={styles.announcementBadgeText}>{a.courseCode}</Text>
              </View>
              <Text style={styles.announcementTitle}>{a.title}</Text>
              <Text style={styles.announcementBody} numberOfLines={2}>{a.body}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <BottomNav active="dashboard" />
    </View>
  );
}

function StatChip({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.statChip}>
      <Ionicons name={icon} size={14} color="rgba(255,255,255,0.8)" />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && <TouchableOpacity onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></TouchableOpacity>}
    </View>
  );
}

function ActionCard({ icon, label, color, onPress }: { icon: any; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.actionCard, { backgroundColor: color + '15' }]} onPress={onPress}>
      <Ionicons name={icon} size={28} color={color} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name="information-circle-outline" size={32} color={Colors.textMuted} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  userName: { fontSize: 26, fontWeight: '800', color: '#fff' },
  logoutBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statChip: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10,
    padding: 10, gap: 2, flex: 1,
  },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statValue: { fontSize: 12, fontWeight: '700', color: '#fff' },
  body: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  sectionAction: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  courseScroll: { paddingHorizontal: 20, gap: 12 },
  courseCard: {
    width: 160, borderRadius: 16, padding: 16, gap: 6,
    shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8, elevation: 4,
  },
  courseCode: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  courseTitle: { fontSize: 15, color: '#fff', fontWeight: '700', lineHeight: 20 },
  courseCredits: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20,
  },
  actionCard: {
    flex: 1, minWidth: 140, borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 8,
  },
  actionLabel: { fontSize: 13, fontWeight: '700' },
  announcementCard: {
    marginHorizontal: 20, marginBottom: 10, backgroundColor: Colors.card,
    borderRadius: 14, padding: 14, gap: 6,
    borderLeftWidth: 4, borderLeftColor: Colors.primary,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4, elevation: 2,
  },
  announcementBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.primary + '15',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  announcementBadgeText: { fontSize: 11, color: Colors.primary, fontWeight: '700' },
  announcementTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  announcementBody: { fontSize: 13, color: Colors.textLight, lineHeight: 18 },
  emptyCard: {
    marginHorizontal: 20, backgroundColor: Colors.card, borderRadius: 14,
    padding: 24, alignItems: 'center', gap: 8,
  },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});
