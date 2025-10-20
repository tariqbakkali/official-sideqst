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
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { questService, CreateQuestData } from '@/services/questService';
import LocationInput from '@/components/LocationInput';
import { ArrowLeft, Star, Clock, DollarSign, Camera, Plus, X, Upload, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { storageService } from '@/services/storageService';

interface QuestCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const difficultyLevels = [
  { value: 1, label: 'Very Easy', color: '#4CAF50' },
  { value: 2, label: 'Easy', color: '#8BC34A' },
  { value: 3, label: 'Medium', color: '#FFC107' },
  { value: 4, label: 'Hard', color: '#FF9800' },
  { value: 5, label: 'Very Hard', color: '#F44336' },
];

const uniquenessLevels = [
  { value: 1, label: 'Common', description: 'Anyone can do this' },
  { value: 2, label: 'Uncommon', description: 'Slightly unique' },
  { value: 3, label: 'Rare', description: 'Not many do this' },
  { value: 4, label: 'Epic', description: 'Very few attempt this' },
  { value: 5, label: 'Legendary', description: 'Extremely rare experience' },
];

const durationUnits = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
];

const locationTypes = [
  { value: 'anywhere', label: 'Anywhere', description: 'Can be done from any location' },
  { value: 'online', label: 'Online', description: 'Requires internet/specific URL' },
  { value: 'address', label: 'Specific Place', description: 'Must be done at a specific location' },
];

export default function CreateQuestScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<QuestCategory[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    difficulty: 1,
    uniqueness: 1,
    location_type: 'anywhere' as 'anywhere' | 'online' | 'address',
    location_text: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    cost: '',
    photo_url: '',
    duration_value: 30,
    duration_unit: 'minutes' as 'minutes' | 'hours' | 'days' | 'weeks' | 'months',
    is_public: true,
  });

  const [questSteps, setQuestSteps] = useState<Array<{ title: string; description: string }>>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('quest_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
      
      // Set first category as default if available
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, category_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load quest categories');
    }
  };

  const handleLocationChange = (text: string, coordinates?: { latitude: number; longitude: number }) => {
    setFormData(prev => ({
      ...prev,
      location_text: text,
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
    }));
  };

  const addQuestStep = () => {
    setQuestSteps(prev => [...prev, { title: '', description: '' }]);
  };

  const removeQuestStep = (index: number) => {
    setQuestSteps(prev => prev.filter((_, i) => i !== index));
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) return;

    setUploading(true);
    try {
      const url = await storageService.uploadQuestPhoto(uri, user.id);
      setFormData(prev => ({ ...prev, photo_url: url }));
      Alert.alert('Success', 'Photo uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const updateQuestStep = (index: number, field: 'title' | 'description', value: string) => {
    setQuestSteps(prev => prev.map((step, i) =>
      i === index ? { ...step, [field]: value } : step
    ));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Quest name is required');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Quest description is required');
      return false;
    }
    if (!formData.category_id) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }
    if (formData.location_type === 'online' && !formData.location_text.trim()) {
      Alert.alert('Error', 'URL is required for online quests');
      return false;
    }
    if (formData.location_type === 'address' && !formData.location_text.trim()) {
      Alert.alert('Error', 'Address is required for location-specific quests');
      return false;
    }
    if (formData.duration_value <= 0) {
      Alert.alert('Error', 'Duration must be greater than 0');
      return false;
    }
    // Validate quest steps if any exist
    if (questSteps.length > 0) {
      for (let i = 0; i < questSteps.length; i++) {
        if (!questSteps[i].title.trim()) {
          Alert.alert('Error', `Step ${i + 1} requires a title`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log('Starting quest creation...');
      console.log('Form data:', formData);
      
      const questData: CreateQuestData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id,
        difficulty: formData.difficulty,
        uniqueness: formData.uniqueness,
        location_type: formData.location_type,
        location_text: formData.location_text.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        photo_url: formData.photo_url.trim() || undefined,
        duration_value: formData.duration_value,
        duration_unit: formData.duration_unit,
        is_public: formData.is_public,
      };

      console.log('Processed quest data:', questData);

      const createdQuest = await questService.createQuest(questData);

      // Add quest steps if any were defined
      if (questSteps.length > 0) {
        await questService.addQuestSteps(createdQuest.id, questSteps);
      }

      // Navigate immediately after successful creation
      router.push('/(tabs)/quests');
      
      // Show success message after navigation
      setTimeout(() => {
        Alert.alert(
          '🎉 Success!',
          'Your quest has been created successfully and is now available for other adventurers to discover!'
        );
      }, 500);
    } catch (error: any) {
      console.error('Error creating quest:', error);
      Alert.alert('Error', `Failed to create quest: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Quest</Text>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quest Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Give your quest an exciting name..."
                placeholderTextColor="#888888"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe what this quest involves and what makes it special..."
                placeholderTextColor="#888888"
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      formData.category_id === category.id && styles.categoryCardSelected,
                      { borderColor: category.color }
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, category_id: category.id }))}
                  >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Difficulty & Uniqueness */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Challenge Level</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.levelContainer}>
                {difficultyLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.levelButton,
                      formData.difficulty === level.value && styles.levelButtonSelected,
                      { borderColor: level.color }
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, difficulty: level.value }))}
                  >
                    <Star size={16} color={level.color} fill={formData.difficulty === level.value ? level.color : 'transparent'} />
                    <Text style={[styles.levelText, { color: level.color }]}>{level.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Uniqueness</Text>
              <View style={styles.levelContainer}>
                {uniquenessLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.levelButton,
                      formData.uniqueness === level.value && styles.levelButtonSelected,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, uniqueness: level.value }))}
                  >
                    <Text style={styles.levelText}>{level.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Duration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duration</Text>
            
            <View style={styles.durationContainer}>
              <View style={styles.durationInput}>
                <Clock size={20} color="#888888" style={styles.inputIcon} />
                <TextInput
                  style={styles.durationValue}
                  placeholder="30"
                  placeholderTextColor="#888888"
                  value={formData.duration_value.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 0;
                    setFormData(prev => ({ ...prev, duration_value: value }));
                  }}
                  keyboardType="numeric"
                />
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                {durationUnits.map((unit) => (
                  <TouchableOpacity
                    key={unit.value}
                    style={[
                      styles.unitButton,
                      formData.duration_unit === unit.value && styles.unitButtonSelected,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, duration_unit: unit.value as any }))}
                  >
                    <Text style={[
                      styles.unitText,
                      formData.duration_unit === unit.value && styles.unitTextSelected,
                    ]}>
                      {unit.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Location */}
          <View style={[styles.section, styles.locationSection]}>
            <Text style={styles.sectionTitle}>Location</Text>
            
            <View style={styles.locationTypeContainer}>
              {locationTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.locationTypeButton,
                    formData.location_type === type.value && styles.locationTypeButtonSelected,
                  ]}
                  onPress={() => setFormData(prev => ({ 
                    ...prev, 
                    location_type: type.value as any,
                    location_text: '',
                    latitude: undefined,
                    longitude: undefined,
                  }))}
                >
                  <Text style={[
                    styles.locationTypeLabel,
                    formData.location_type === type.value && styles.locationTypeLabelSelected,
                  ]}>
                    {type.label}
                  </Text>
                  <Text style={styles.locationTypeDescription}>{type.description}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <LocationInput
              locationType={formData.location_type}
              locationText={formData.location_text}
              onLocationChange={handleLocationChange}
            />
          </View>

          {/* Quest Steps */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Progression Steps</Text>
                <Text style={styles.sectionSubtitle}>
                  Optional milestones to track progress (e.g., 10 sec, 30 sec, 1 min)
                </Text>
              </View>
            </View>

            {questSteps.map((step, index) => (
              <View key={index} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepNumber}>Step {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeQuestStep(index)}>
                    <X size={20} color="#ff4757" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Step title (e.g., Hold for 10 seconds)"
                  placeholderTextColor="#888888"
                  value={step.title}
                  onChangeText={(text) => updateQuestStep(index, 'title', text)}
                  maxLength={100}
                />

                <TextInput
                  style={[styles.input, styles.stepDescriptionInput]}
                  placeholder="Optional description..."
                  placeholderTextColor="#888888"
                  value={step.description}
                  onChangeText={(text) => updateQuestStep(index, 'description', text)}
                  multiline
                  numberOfLines={2}
                  maxLength={200}
                />
              </View>
            ))}

            <TouchableOpacity style={styles.addStepButton} onPress={addQuestStep}>
              <Plus size={20} color="#B8FF00" />
              <Text style={styles.addStepText}>Add Step</Text>
            </TouchableOpacity>
          </View>

          {/* Optional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Optional Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Estimated Cost</Text>
              <View style={styles.costContainer}>
                <DollarSign size={20} color="#888888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#888888"
                  value={formData.cost}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, cost: text }))}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quest Photo</Text>

              {formData.photo_url ? (
                <View style={styles.photoPreviewContainer}>
                  <View style={styles.photoPreview}>
                    <ImageIcon size={48} color="#B8FF00" />
                    <Text style={styles.photoPreviewText} numberOfLines={1}>
                      {formData.photo_url.split('/').pop()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => setFormData(prev => ({ ...prev, photo_url: '' }))}
                  >
                    <X size={20} color="#ff4757" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickImage}
                  disabled={uploading}
                >
                  <Upload size={24} color="#B8FF00" />
                  <Text style={styles.uploadButtonText}>
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                  </Text>
                  <Text style={styles.uploadButtonSubtext}>
                    Tap to choose from gallery
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <TouchableOpacity
                style={styles.toggleContainer}
                onPress={() => setFormData(prev => ({ ...prev, is_public: !prev.is_public }))}
              >
                <View style={[styles.toggle, formData.is_public && styles.toggleActive]}>
                  {formData.is_public && <View style={styles.toggleIndicator} />}
                </View>
                <View style={styles.toggleContent}>
                  <Text style={styles.toggleLabel}>Make quest public</Text>
                  <Text style={styles.toggleDescription}>
                    Other users can discover and attempt this quest
                  </Text>
                </View>
              </TouchableOpacity>
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
  submitButton: {
    backgroundColor: '#B8FF00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
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
  section: {
    marginBottom: 32,
  },
  locationSection: {
    zIndex: 1000,
    elevation: 1000,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#333333',
    fontSize: 16,
    color: '#ffffff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputIcon: {
    marginRight: 12,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    backgroundColor: '#333333',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  levelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#333333',
    gap: 6,
  },
  levelButtonSelected: {
    backgroundColor: '#333333',
  },
  levelText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  durationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333333',
    width: 90,
  },
  durationValue: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'left',
    width: 40,
  },
  unitScroll: {
    flex: 1,
  },
  unitButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  unitButtonSelected: {
    backgroundColor: '#B8FF00',
    borderColor: '#B8FF00',
  },
  unitText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  unitTextSelected: {
    color: '#0a0a0a',
  },
  locationTypeContainer: {
    gap: 8,
    marginBottom: 16,
  },
  locationTypeButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  locationTypeButtonSelected: {
    backgroundColor: '#333333',
    borderColor: '#B8FF00',
  },
  locationTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  locationTypeLabelSelected: {
    color: '#B8FF00',
  },
  locationTypeDescription: {
    fontSize: 12,
    color: '#888888',
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  uploadButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333333',
    borderStyle: 'dashed',
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B8FF00',
    marginTop: 4,
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: '#888888',
  },
  photoPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    padding: 16,
    gap: 12,
  },
  photoPreview: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoPreviewText: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
  },
  removePhotoButton: {
    padding: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333333',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#B8FF00',
  },
  toggleIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0a0a0a',
    alignSelf: 'flex-end',
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  toggleDescription: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  stepCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
    gap: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B8FF00',
  },
  stepDescriptionInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#B8FF00',
    borderStyle: 'dashed',
    gap: 8,
  },
  addStepText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B8FF00',
  },
});