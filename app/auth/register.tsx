// app/auth/register.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { Colors } from '@/constants/Colors';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim(), role, studentId.trim());
      router.replace('/tabs/dashboard');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[Colors.secondary, '#991b1b']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Ionicons name="person-add" size={44} color="#fff" />
        <Text style={styles.headerTitle}>Create Account</Text>
        <Text style={styles.headerSub}>Join LakeheadLMS today</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">

        {/* Role Selector */}
        <Text style={styles.sectionLabel}>I am a...</Text>
        <View style={styles.roleRow}>
          {(['student', 'instructor'] as UserRole[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleCard, role === r && styles.roleCardActive]}
              onPress={() => setRole(r)}
            >
              <Ionicons
                name={r === 'student' ? 'person-outline' : 'easel-outline'}
                size={24}
                color={role === r ? '#fff' : Colors.primary}
              />
              <Text style={[styles.roleLabel, role === r && styles.roleLabelActive]}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <InputField label="Full Name *" placeholder="e.g. Om Avaiya" value={name} onChangeText={setName} icon="person-outline" />
        <InputField label="Email Address *" placeholder="you@lakeheadu.ca" value={email} onChangeText={setEmail} icon="mail-outline" keyboardType="email-address" autoCapitalize="none" />

        {role === 'student' && (
          <InputField label="Student ID" placeholder="e.g. 1234567" value={studentId} onChangeText={setStudentId} icon="card-outline" keyboardType="numeric" />
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Min. 6 characters"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
          <Text style={styles.loginLinkText}>Already have an account? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Sign In</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({ label, icon, ...props }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={20} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholderTextColor={Colors.textMuted} {...props} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 56,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 6,
  },
  backBtn: { position: 'absolute', top: 56, left: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  form: { backgroundColor: Colors.background, flexGrow: 1, padding: 24, gap: 4 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 10, marginTop: 8 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  roleCard: {
    flex: 1, alignItems: 'center', padding: 16, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.primary, backgroundColor: Colors.card, gap: 6,
  },
  roleCardActive: { backgroundColor: Colors.primary },
  roleLabel: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  roleLabelActive: { color: '#fff' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { height: 48, flex: 1, fontSize: 15, color: Colors.text },
  btn: {
    backgroundColor: Colors.secondary, borderRadius: 12, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    shadowColor: Colors.secondary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8, elevation: 4,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginLink: { alignItems: 'center', marginTop: 16 },
  loginLinkText: { fontSize: 14, color: Colors.textLight },
});
