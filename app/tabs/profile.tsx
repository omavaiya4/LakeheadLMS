// app/tabs/profile.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/constants/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/Colors';
import BottomNav from '@/components/BottomNav';

export default function ProfileScreen() {
  const { profile, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name ?? '');
  const [department, setDepartment] = useState(profile?.department ?? 'Computer Science');
  const [saving, setSaving] = useState(false);

  const avatarLetter = (profile?.name ?? 'U').charAt(0).toUpperCase();
  const isInstructor = profile?.role === 'instructor';

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), { name, department });
      Alert.alert('Success', 'Profile updated.');
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} style={styles.headerGradient}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{avatarLetter}</Text>
        </View>
        <Text style={styles.name}>{profile?.name}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name={isInstructor ? 'easel-outline' : 'person-outline'} size={13} color="#fff" />
          <Text style={styles.roleText}>{isInstructor ? 'Instructor' : 'Student'}</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 100 }}>

        {/* Info Cards */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <Ionicons name={editing ? 'close-outline' : 'pencil-outline'} size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <InfoRow
            icon="person-outline"
            label="Full Name"
            value={name}
            editing={editing}
            onChangeText={setName}
          />
          <InfoRow icon="mail-outline" label="Email" value={profile?.email ?? ''} editing={false} />
          <InfoRow
            icon="business-outline"
            label="Department"
            value={department}
            editing={editing}
            onChangeText={setDepartment}
          />
          {profile?.studentId && (
            <InfoRow icon="card-outline" label="Student ID" value={profile.studentId} editing={false} />
          )}

          {editing && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* Role-specific info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.success} />
            <Text style={styles.detailText}>Account verified</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="school-outline" size={18} color={Colors.primary} />
            <Text style={styles.detailText}>Lakehead University</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name={isInstructor ? 'easel-outline' : 'person-outline'} size={18} color={Colors.accent} />
            <Text style={styles.detailText}>Role: {isInstructor ? 'Instructor' : 'Student'}</Text>
          </View>
        </View>

        {/* Security section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Security</Text>
          <View style={styles.detailRow}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.primary} />
            <Text style={styles.detailText}>Password protected account</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="key-outline" size={18} color={Colors.primary} />
            <Text style={styles.detailText}>Firebase Authentication</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav active="profile" />
    </View>
  );
}

function InfoRow({ icon, label, value, editing, onChangeText }: {
  icon: any; label: string; value: string; editing: boolean; onChangeText?: (t: string) => void;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={Colors.primary} style={styles.infoIcon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        {editing && onChangeText ? (
          <TextInput
            style={styles.infoInput}
            value={value}
            onChangeText={onChangeText}
            placeholderTextColor={Colors.textMuted}
          />
        ) : (
          <Text style={styles.infoValue}>{value}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: { paddingTop: 60, paddingBottom: 32, alignItems: 'center', gap: 10 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarLetter: { fontSize: 36, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  roleText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  card: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIcon: { marginTop: 2 },
  infoLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  infoInput: {
    fontSize: 14, color: Colors.text, borderBottomWidth: 1,
    borderBottomColor: Colors.primary, paddingVertical: 4,
  },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 10, height: 44,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailText: { fontSize: 14, color: Colors.text },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.error + '15', borderRadius: 14, height: 50,
    borderWidth: 1, borderColor: Colors.error + '40',
  },
  logoutText: { fontSize: 15, color: Colors.error, fontWeight: '700' },
});
