import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, User, Mail, Calendar, Camera, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string;
  year_of_birth: number | null;
}

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    avatar: '',
    year_of_birth: null,
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, create default profile
          console.log('No profile found, creating default profile');
          const defaultProfile = {
            id: user.id,
            first_name: user.user_metadata?.full_name?.split(' ')[0] || '',
            last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            email: user.email || '',
            avatar: '',
            year_of_birth: null,
          };
          
          setProfile(defaultProfile);
          return;
        }
        throw error;
      }

      if (data) {
        setProfile({
          id: data.id,
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || user.email || '',
          avatar: data.avatar || '',
          year_of_birth: data.year_of_birth,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload an avatar.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!user || !asset.base64 || !asset.mimeType) return;

    setUploadingImage(true);
    try {
      // Create file name
      const fileExt = asset.mimeType.split('/')[1]; // Get extension from mimeType (e.g., 'jpeg' from 'image/jpeg')
      const fileName = `${user.id}/${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Convert base64 to blob
      const response = await fetch(`data:${asset.mimeType};base64,${asset.base64}`);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: asset.mimeType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      setProfile({ ...profile, avatar: publicUrl });
      
      Alert.alert('Success', 'Avatar uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', error.message || 'Failed to upload avatar');
    } finally {
      setUploadingImage(false);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    // Validation
    if (!profile.first_name.trim()) {
      Alert.alert('Error', 'First name is required');
      return;
    }

    if (profile.year_of_birth && (profile.year_of_birth < 1900 || profile.year_of_birth > new Date().getFullYear())) {
      Alert.alert('Error', 'Please enter a valid birth year');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: profile.first_name.trim(),
          last_name: profile.last_name.trim(),
          email: profile.email,
          avatar: profile.avatar.trim(),
          year_of_birth: profile.year_of_birth,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = () => {
    return `${profile.first_name} ${profile.last_name}`.trim() || 'User';
  };

  const getInitials = () => {
    const firstName = profile.first_name.trim();
    const lastName = profile.last_name.trim();
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={updateProfile}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              {profile.avatar && profile.avatar.startsWith('http') ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{getInitials()}</Text>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.changePhotoButton, uploadingImage && styles.changePhotoButtonDisabled]} 
              onPress={pickImage}
              disabled={uploadingImage}
            >
              <Upload size={16} color="#B8FF00" />
              <Text style={styles.changePhotoText}>
                {uploadingImage ? 'Uploading...' : 'Upload Photo'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#888888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your first name"
                  placeholderTextColor="#888888"
                  value={profile.first_name}
                  onChangeText={(text) => setProfile({ ...profile, first_name: text })}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#888888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your last name"
                  placeholderTextColor="#888888"
                  value={profile.last_name}
                  onChangeText={(text) => setProfile({ ...profile, last_name: text })}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputContainer, styles.disabledInput]}>
                <Mail size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.disabledInputText]}
                  value={profile.email}
                  editable={false}
                />
              </View>
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Year of Birth</Text>
              <View style={styles.inputContainer}>
                <Calendar size={20} color="#888888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="1990"
                  placeholderTextColor="#888888"
                  value={profile.year_of_birth?.toString() || ''}
                  onChangeText={(text) => {
                    const year = text ? parseInt(text) : null;
                    setProfile({ ...profile, year_of_birth: year });
                  }}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <Text style={styles.helperText}>Optional: Used for age-appropriate quest recommendations</Text>
            </View>
          </View>

          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>Profile Preview</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewAvatar}>
                {profile.avatar && profile.avatar.startsWith('http') ? (
                  <Image source={{ uri: profile.avatar }} style={styles.previewAvatarImage} />
                ) : (
                  <Text style={styles.previewAvatarText}>{getInitials()}</Text>
                )}
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>{getDisplayName()}</Text>
                <Text style={styles.previewEmail}>{profile.email}</Text>
                {profile.year_of_birth && (
                  <Text style={styles.previewAge}>
                    Age: {new Date().getFullYear() - profile.year_of_birth}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#B8FF00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#B8FF00',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  changePhotoButtonDisabled: {
    opacity: 0.6,
  },
  changePhotoText: {
    fontSize: 14,
    color: '#B8FF00',
    fontWeight: '600',
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  disabledInput: {
    backgroundColor: '#111111',
    borderColor: '#222222',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  disabledInputText: {
    color: '#666666',
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  previewSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  previewAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#B8FF00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  previewAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
  previewAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  previewEmail: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  previewAge: {
    fontSize: 12,
    color: '#B8FF00',
    marginTop: 4,
  },
});