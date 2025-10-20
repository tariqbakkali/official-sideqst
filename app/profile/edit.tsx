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
  user_id: string;
  display_name: string;
  bio: string;
  avatar_url: string;
}

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    user_id: '',
    display_name: '',
    bio: '',
    avatar_url: '',
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
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          user_id: data.user_id,
          display_name: data.display_name || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
        });
      } else {
        setProfile({
          user_id: user.id,
          display_name: user.user_metadata?.full_name || '',
          bio: '',
          avatar_url: '',
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
      setProfile({ ...profile, avatar_url: publicUrl });
      
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
    if (!profile.display_name.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          display_name: profile.display_name.trim(),
          bio: profile.bio.trim(),
          avatar_url: profile.avatar_url.trim(),
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
    return profile.display_name || 'User';
  };

  const getInitials = () => {
    const name = profile.display_name.trim();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase() || 'U';
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
              {profile.avatar_url && profile.avatar_url.startsWith('http') ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
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
              <Text style={styles.label}>Display Name *</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#888888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your display name"
                  placeholderTextColor="#888888"
                  value={profile.display_name}
                  onChangeText={(text) => setProfile({ ...profile, display_name: text })}
                  autoCapitalize="words"
                />
              </View>
              <Text style={styles.helperText}>This is how others will see your name</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputContainer, styles.disabledInput]}>
                <Mail size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.disabledInputText]}
                  value={user?.email || ''}
                  editable={false}
                />
              </View>
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell others about yourself..."
                  placeholderTextColor="#888888"
                  value={profile.bio}
                  onChangeText={(text) => setProfile({ ...profile, bio: text })}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={200}
                />
              </View>
              <Text style={styles.helperText}>{profile.bio.length}/200 characters</Text>
            </View>
          </View>

          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>Profile Preview</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewAvatar}>
                {profile.avatar_url && profile.avatar_url.startsWith('http') ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.previewAvatarImage} />
                ) : (
                  <Text style={styles.previewAvatarText}>{getInitials()}</Text>
                )}
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>{getDisplayName()}</Text>
                <Text style={styles.previewEmail}>{user?.email}</Text>
                {profile.bio && (
                  <Text style={styles.previewBio}>{profile.bio}</Text>
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
  previewBio: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  textAreaContainer: {
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});