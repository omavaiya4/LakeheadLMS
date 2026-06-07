// app/tabs/search.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/constants/firebase';
import { Colors } from '@/constants/Colors';
import BottomNav from '@/components/BottomNav';
import { useRouter } from 'expo-router';

type FilterType = 'all' | 'courses' | 'students' | 'announcements';

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const router = useRouter();

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setLoading(true);
    setSearched(true);
    const term = searchText.toLowerCase();
    const collected: any[] = [];

    try {
      if (filter === 'all' || filter === 'courses') {
        const snap = await getDocs(collection(db, 'courses'));
        snap.docs.forEach(d => {
          const data = d.data();
          if (
            data.title?.toLowerCase().includes(term) ||
            data.code?.toLowerCase().includes(term) ||
            data.instructor?.toLowerCase().includes(term)
          ) {
            collected.push({ id: d.id, _type: 'course', ...data });
          }
        });
      }

      if (filter === 'all' || filter === 'students') {
        const snap = await getDocs(query(collection(db, 'users'), orderBy('name')));
        snap.docs.forEach(d => {
          const data = d.data();
          if (data.role === 'student' && (
            data.name?.toLowerCase().includes(term) ||
            data.email?.toLowerCase().includes(term) ||
            data.studentId?.toLowerCase().includes(term)
          )) {
            collected.push({ id: d.id, _type: 'student', ...data });
          }
        });
      }

      if (filter === 'all' || filter === 'announcements') {
        const snap = await getDocs(collection(db, 'announcements'));
        snap.docs.forEach(d => {
          const data = d.data();
          if (
            data.title?.toLowerCase().includes(term) ||
            data.body?.toLowerCase().includes(term) ||
            data.courseCode?.toLowerCase().includes(term)
          ) {
            collected.push({ id: d.id, _type: 'announcement', ...data });
          }
        });
      }
    } catch (e) {
      console.log('Search error:', e);
    }

    setResults(collected);
    setLoading(false);
  };

  const renderResult = ({ item }: { item: any }) => {
    if (item._type === 'course') {
      return (
        <TouchableOpacity style={styles.resultCard} onPress={() => router.push(`/course/${item.id}`)}>
          <View style={[styles.resultIcon, { backgroundColor: Colors.primary + '15' }]}>
            <Ionicons name="book-outline" size={22} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.resultMeta}>
              <Text style={styles.resultBadge}>{item.code}</Text>
              <Text style={styles.resultType}>Course</Text>
            </View>
            <Text style={styles.resultTitle}>{item.title}</Text>
            <Text style={styles.resultSub}>{item.instructor} · {item.credits} credits</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      );
    }

    if (item._type === 'student') {
      return (
        <View style={styles.resultCard}>
          <View style={[styles.resultIcon, { backgroundColor: '#7c3aed15' }]}>
            <Ionicons name="person-outline" size={22} color="#7c3aed" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.resultType}>Student</Text>
            <Text style={styles.resultTitle}>{item.name}</Text>
            <Text style={styles.resultSub}>{item.email} {item.studentId ? `· ID: ${item.studentId}` : ''}</Text>
          </View>
        </View>
      );
    }

    if (item._type === 'announcement') {
      return (
        <View style={styles.resultCard}>
          <View style={[styles.resultIcon, { backgroundColor: '#05966915' }]}>
            <Ionicons name="megaphone-outline" size={22} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.resultMeta}>
              <Text style={[styles.resultBadge, { backgroundColor: '#05966915', color: '#059669' }]}>{item.courseCode}</Text>
              <Text style={styles.resultType}>Announcement</Text>
            </View>
            <Text style={styles.resultTitle}>{item.title}</Text>
            <Text style={styles.resultSub} numberOfLines={2}>{item.body}</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses, students, announcements..."
            placeholderTextColor={Colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(''); setResults([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {(['all', 'courses', 'students', 'announcements'] as FilterType[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={i => `${i._type}-${i.id}`}
          renderItem={renderResult}
          contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 100 }}
          ListEmptyComponent={
            searched ? (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptyText}>Try a different search term or filter.</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>Start searching</Text>
                <Text style={styles.emptyText}>Search for courses, students, or announcements.</Text>
              </View>
            )
          }
        />
      )}

      <BottomNav active="search" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.background, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, height: 48,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  searchBtn: {
    backgroundColor: Colors.primary, borderRadius: 12, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  resultCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2,
  },
  resultIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  resultBadge: {
    fontSize: 10, fontWeight: '700', color: Colors.primary,
    backgroundColor: Colors.primary + '15', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  resultType: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  resultTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  resultSub: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
