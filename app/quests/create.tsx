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
import { ArrowLeft, Star, Clock, DollarSign, Camera } from 'lucide-react-native';

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
      
      await questService.createQuest(questData);
      
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
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
          <View style={styles.section}>
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
              <Text style={styles.label}>Photo URL</Text>
              <View style={styles.photoContainer}>
                <Camera size={20} color="#888888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="https://example.com/photo.jpg"
                  placeholderTextColor="#888888"
                  value={formData.photo_url}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, photo_url: text }))}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#333333',
    width: 120,
  },
  durationValue: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
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
});