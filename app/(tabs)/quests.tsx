import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Search, Filter, Target, Clock, MapPin, CircleCheck as CheckCircle, X, Camera, Save } from 'lucide-react-native';
import { router } from 'expo-router';
import { questService, Quest } from '@/services/questService';
import { storageService } from '@/services/storageService';
import * as ImagePicker from 'expo-image-picker';

const handleQuestPress = (questId: string) => {
  router.push(`/quest/${questId}`);
};

interface QuestWithCategory extends Quest {
  quest_categories?: {
    name: string;
    icon: string;
    color: string;
  };
}

const questCategories = [
  { id: 'skill-quests', name: 'Skill Quests', icon: '⚔️', color: '#FF6B6B', description: 'Learn or practice a new skill' },
  { id: 'creative-quests', name: 'Creative Quests', icon: '🎭', color: '#4ECDC4', description: 'Express yourself through art' },
  { id: 'adventure-quests', name: 'Adventure Quests', icon: '🌍', color: '#45B7D1', description: 'Explore outdoors & new places' },
  { id: 'self-discovery-quests', name: 'Self-Discovery Quests', icon: '🧘', color: '#96CEB4', description: 'Reflect, journal, meditate' },
  { id: 'mini-quests', name: 'Mini Quests', icon: '⚡', color: '#FFEAA7', description: 'Quick, fun challenges' },
  { id: 'irl-challenges', name: 'IRL Challenges', icon: '🕹', color: '#DDA0DD', description: 'Gamify daily life' },
  { id: 'social-quests', name: 'Social Quests', icon: '🤝', color: '#98D8C8', description: 'Activities with others' },
  { id: 'local-gems', name: 'Local Gems', icon: '📍', color: '#F7DC6F', description: 'Discover nearby spots' },
];

export default function QuestsScreen() {
  const [activeTab, setActiveTab] = useState('active');
  const [userQuests, setUserQuests] = useState<QuestWithCategory[]>([]);
  const [publicQuests, setPublicQuests] = useState<QuestWithCategory[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [selectedQuestForCompletion, setSelectedQuestForCompletion] = useState<QuestWithCategory | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionPhoto, setCompletionPhoto] = useState<string | null>(null);
  const [submittingCompletion, setSubmittingCompletion] = useState(false);
  const [startingQuests, setStartingQuests] = useState<Set<string>>(new Set());

  const { wishlistService } = require('@/services/wishlistService');

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      const [userQuestsData, publicQuestsData] = await Promise.all([
        questService.getUserQuests(),
        questService.getPublicQuests(10),
      ]);
      
      setUserQuests(userQuestsData);
      setPublicQuests(publicQuestsData);
      
      // Load wishlist if wishlist tab might be accessed
      if (activeTab === 'wishlist') {
        await loadWishlist();
      }
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWishlist = async () => {
    try {
      const { wishlistService } = await import('@/services/wishlistService');
      const items = await wishlistService.getUserWishlist();
      setWishlistItems(items);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuests();
    setRefreshing(false);
  };

  const handleCompleteQuest = async () => {
    if (!selectedQuestForCompletion || submittingCompletion) return;

    if (!completionNotes.trim()) {
      Alert.alert('Required', 'Please add some notes about completing this quest');
      return;
    }

    setSubmittingCompletion(true);
    try {
      let photoUrl: string | undefined = undefined;

      if (completionPhoto) {
        console.log('[QuestCompletion] Uploading photo:', completionPhoto);
        try {
          photoUrl = await storageService.uploadPhoto(completionPhoto);
          console.log('[QuestCompletion] Photo uploaded successfully:', photoUrl);
        } catch (uploadError) {
          console.error('[QuestCompletion] Error uploading photo:', uploadError);
          Alert.alert('Warning', 'Failed to upload photo, but quest will still be completed');
        }
      }

      console.log('[QuestCompletion] Completing quest with photo URL:', photoUrl);
      await questService.completeQuest(
        selectedQuestForCompletion.id,
        completionNotes.trim(),
        photoUrl
      );
      console.log('[QuestCompletion] Quest completed successfully');

      setUserQuests(quests => quests.filter(q => q.id !== selectedQuestForCompletion.id));

      setCompletionModalVisible(false);
      setSelectedQuestForCompletion(null);
      setCompletionNotes('');
      setCompletionPhoto(null);

      Alert.alert('🎉 Quest Completed!', 'Your quest has been moved to your journal');
    } catch (error) {
      console.error('Error completing quest:', error);
      Alert.alert('Error', 'Failed to complete quest. Please try again.');
    } finally {
      setSubmittingCompletion(false);
    }
  };

  const handleRemoveQuest = async (questId: string) => {
    Alert.alert(
      'Remove Quest',
      'Are you sure you want to remove this quest from your active quests?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await questService.removeUserQuest(questId);
              setUserQuests(quests => quests.filter(q => q.id !== questId));
            } catch (error) {
              console.error('Error removing quest:', error);
              Alert.alert('Error', 'Failed to remove quest');
            }
          },
        },
      ]
    );
  };

  const handleRemoveFromWishlist = async (questId: string) => {
    Alert.alert(
      'Remove from Wishlist',
      'Are you sure you want to remove this quest from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { wishlistService } = await import('@/services/wishlistService');
              await wishlistService.removeFromWishlist(questId);
              setWishlistItems(items => items.filter(item => item.quest_id !== questId));
            } catch (error) {
              console.error('Error removing from wishlist:', error);
              Alert.alert('Error', 'Failed to remove quest from wishlist');
            }
          },
        },
      ]
    );
  };

  const handleStartQuest = async (questId: string) => {
    if (startingQuests.has(questId)) return;
    
    setStartingQuests(prev => new Set(prev).add(questId));
    try {
      // Check if already added to avoid duplicates
      const hasAdded = await questService.hasAddedToMyQuests(questId);
      
      if (!hasAdded) {
        await questService.addToMyQuests(questId);
      }
      
      // Remove from wishlist since it's now active
      const { wishlistService } = await import('@/services/wishlistService');
      await wishlistService.removeFromWishlist(questId);
      
      // Update local state to remove the item immediately
      setWishlistItems(items => items.filter(item => item.quest_id !== questId));
      
      Alert.alert('Success!', 'Quest started and moved to your active quests');
      
      // Switch to active tab to show the new quest
      setActiveTab('active');
      await loadQuests();
    } catch (error) {
      console.error('Error starting quest:', error);
      Alert.alert('Error', 'Failed to start quest');
    } finally {
      setStartingQuests(prev => {
        const newSet = new Set(prev);
        newSet.delete(questId);
        return newSet;
      });
    }
  };

  const addCompletionPhoto = async () => {
    if (completionPhoto) {
      Alert.alert('Photo Limit', 'You can only add one photo per quest');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to add a photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCompletionPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to pick photo');
    }
  };

  const getLocationDisplay = (quest: Quest) => {
    switch (quest.location_type) {
      case 'anywhere':
        return 'Anywhere';
      case 'online':
        return 'Online';
      case 'address':
        return quest.location_text || 'Specific Location';
      default:
        return 'Anywhere';
    }
  };

  const getDifficultyLabel = (difficulty: number) => {
    const levels = ['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];
    return levels[difficulty] || 'Medium';
  };

  const getDurationDisplay = (quest: Quest) => {
    return `${quest.duration_value} ${quest.duration_unit}`;
  };

  const renderActiveQuests = () => {
    if (userQuests.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No active quests yet</Text>
          <Text style={styles.emptyStateSubtext}>Start your first quest from the Discover tab!</Text>
          <TouchableOpacity 
            style={styles.createFirstQuestButton}
            onPress={() => router.push('/quests/create')}
          >
            <Plus size={16} color="#0a0a0a" />
            <Text style={styles.createFirstQuestText}>Create Quest</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return userQuests.map((quest) => {
      const imageUrl = quest.photo_url || 'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
      
      return (
        <View key={quest.id} style={styles.activeQuestCard}>
          <TouchableOpacity 
            onPress={() => handleQuestPress(quest.id)}
            activeOpacity={0.9}
          >
            <ImageBackground 
              source={{ uri: imageUrl }} 
              style={styles.questImage}
              imageStyle={styles.questImageStyle}
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
              >
                <View style={styles.questInfo}>
                  <Text style={styles.questTitle}>{quest.name}</Text>
                  <Text style={styles.questDescription}>{quest.description}</Text>
                  
                  <View style={styles.locationRow}>
                    <MapPin size={12} color="#B8FF00" />
                    <Text style={styles.locationText}>{getLocationDisplay(quest)}</Text>
                  </View>
                  
                  <View style={styles.questMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.categoryBadge}>{quest.quest_categories?.icon || '⚡'}</Text>
                      <Text style={styles.metaText}>{quest.quest_categories?.name || 'Quest'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Target size={16} color="#B8FF00" />
                      <Text style={styles.metaText}>{getDifficultyLabel(quest.difficulty)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Clock size={16} color="#B8FF00" />
                      <Text style={styles.metaText}>{getDurationDisplay(quest)}</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
          
          <View style={styles.questActions}>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => {
                setSelectedQuestForCompletion(quest);
                setCompletionModalVisible(true);
              }}
            >
              <CheckCircle size={16} color="#0a0a0a" />
              <Text style={styles.completeButtonText}>Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveQuest(quest.id)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    });
  };

  const renderWishlistQuests = () => {
    if (wishlistItems.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Your wishlist is empty</Text>
          <Text style={styles.emptyStateSubtext}>
            Save quests you want to try later by tapping the heart icon
          </Text>
        </View>
      );
    }

    return wishlistItems.map((item) => {
      const quest = item.sidequests;
      if (!quest) return null;

      const imageUrl = quest.photo_url || 'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';

      return (
        <View key={item.id} style={styles.activeQuestCard}>
          <TouchableOpacity 
            onPress={() => handleQuestPress(quest.id)}
            activeOpacity={0.9}
          >
            <ImageBackground 
              source={{ uri: imageUrl }} 
              style={styles.questImage}
              imageStyle={styles.questImageStyle}
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
              >
                <View style={styles.questInfo}>
                  <Text style={styles.questTitle}>{quest.name}</Text>
                  <Text style={styles.questDescription}>{quest.description}</Text>
                  
                  <View style={styles.locationRow}>
                    <MapPin size={12} color="#B8FF00" />
                    <Text style={styles.locationText}>{getLocationDisplay(quest)}</Text>
                  </View>
                  
                  <View style={styles.questMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.categoryBadge}>{quest.quest_categories?.icon || '⚡'}</Text>
                      <Text style={styles.metaText}>{quest.quest_categories?.name || 'Quest'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Target size={16} color="#B8FF00" />
                      <Text style={styles.metaText}>{getDifficultyLabel(quest.difficulty)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Clock size={16} color="#B8FF00" />
                      <Text style={styles.metaText}>{getDurationDisplay(quest)}</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
          
          <View style={styles.questActions}>
            <TouchableOpacity 
              style={styles.completeButton}
              onPress={() => handleStartQuest(quest.id)}
              disabled={startingQuests.has(quest.id)}
            >
              <Plus size={16} color="#0a0a0a" />
              <Text style={styles.completeButtonText}>
                {startingQuests.has(quest.id) ? 'Starting...' : 'Start Quest'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => handleRemoveFromWishlist(quest.id)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    });
  };

  const filterOptions = [
    { 
      id: 'create', 
      title: 'Create', 
      description: 'Make your own quest',
      icon: '✨',
      color: '#B8FF00',
      action: () => router.push('/quests/create')
    },
    { 
      id: 'categories', 
      title: 'Categories', 
      description: 'Browse by type',
      icon: '📂',
      color: '#4ECDC4',
      action: () => router.push('/filter/categories')
    },
    { 
      id: 'location', 
      title: 'Location', 
      description: 'Where to do it',
      icon: '📍',
      color: '#FF6B6B',
      action: () => router.push('/filter/location')
    },
    { 
      id: 'difficulty', 
      title: 'Difficulty', 
      description: 'How challenging',
      icon: '⚔️',
      color: '#45B7D1',
      action: () => router.push('/filter/difficulty')
    },
    { 
      id: 'duration', 
      title: 'Duration', 
      description: 'How long it takes',
      icon: '⏱️',
      color: '#96CEB4',
      action: () => router.push('/filter/duration')
    },
    { 
      id: 'uniqueness', 
      title: 'Uniqueness', 
      description: 'How rare it is',
      icon: '✦',
      color: '#DDA0DD',
      action: () => router.push('/filter/uniqueness')
    },
  ];

  const renderDiscoverContent = () => (
    <View style={styles.section}>
      <View style={styles.filterGrid}>
        {filterOptions.map((filter) => (
          <TouchableOpacity 
            key={filter.id} 
            style={styles.filterCard}
            onPress={filter.action}
            activeOpacity={0.8}
          >
            <View style={[styles.filterIcon, { backgroundColor: filter.color }]}>
              <Text style={styles.filterIconText}>{filter.icon}</Text>
            </View>
            <Text style={styles.filterTitle}>{filter.title}</Text>
            <Text style={styles.filterDescription}>{filter.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Quests</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Search size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Filter size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
            Discover
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'wishlist' && styles.activeTab]}
          onPress={() => {
            setActiveTab('wishlist');
            if (wishlistItems.length === 0) {
              loadWishlist();
            }
          }}
        >
          <Text style={[styles.tabText, activeTab === 'wishlist' && styles.activeTabText]}>
            Wishlist
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'active' ? (
          <View style={styles.section}>
            {renderActiveQuests()}
          </View>
        ) : activeTab === 'wishlist' ? (
          <View style={styles.section}>
            {renderWishlistQuests()}
          </View>
        ) : (
          renderDiscoverContent()
        )}
      </ScrollView>

      <Modal
        visible={completionModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView 
            style={styles.modalKeyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  setCompletionModalVisible(false);
                  setSelectedQuestForCompletion(null);
                  setCompletionNotes('');
                  setCompletionPhoto(null);
                }}
              >
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Complete Quest</Text>
              <TouchableOpacity 
                style={[styles.modalSaveButton, submittingCompletion && styles.modalSaveButtonDisabled]}
                onPress={handleCompleteQuest}
                disabled={submittingCompletion}
              >
                <Save size={16} color="#0a0a0a" />
                <Text style={styles.modalSaveButtonText}>
                  {submittingCompletion ? 'Saving...' : 'Complete'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {selectedQuestForCompletion && (
                <View style={styles.questSummary}>
                  <Text style={styles.questSummaryTitle}>{selectedQuestForCompletion.name}</Text>
                  <Text style={styles.questSummaryDescription}>{selectedQuestForCompletion.description}</Text>
                </View>
              )}

              <View style={styles.completionSection}>
                <Text style={styles.sectionLabel}>How did it go? *</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Share your experience, what you learned, or how you felt..."
                  placeholderTextColor="#888888"
                  multiline
                  value={completionNotes}
                  onChangeText={setCompletionNotes}
                  maxLength={500}
                />
                <Text style={styles.characterCount}>{completionNotes.length}/500</Text>
              </View>

              <View style={styles.completionSection}>
                <Text style={styles.sectionLabel}>Add a Photo (Optional)</Text>
                {completionPhoto ? (
                  <View style={styles.photoContainer}>
                    <Image source={{ uri: completionPhoto }} style={styles.completionPhotoPreview} />
                    <TouchableOpacity 
                      style={styles.removePhotoButton}
                      onPress={() => setCompletionPhoto(null)}
                    >
                      <X size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addPhotoButton} onPress={addCompletionPhoto}>
                    <Camera size={32} color="#B8FF00" />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#B8FF00',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888888',
  },
  activeTabText: {
    color: '#0a0a0a',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#B8FF00',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  filterCard: {
    width: '47%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#333333',
  },
  filterIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  filterIconText: {
    fontSize: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  filterDescription: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 16,
  },
  categoryBadge: {
    fontSize: 16,
    marginRight: 4,
  },
  activeQuestCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  suggestedQuestCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  questImage: {
    height: 200,
    justifyContent: 'flex-end',
  },
  suggestedQuestImage: {
    height: 180,
    justifyContent: 'flex-end',
  },
  questImageStyle: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  gradient: {
    padding: 20,
    justifyContent: 'flex-end',
  },
  questInfo: {
    gap: 8,
  },
  questTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  questDescription: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#B8FF00',
  },
  questActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#B8FF00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  modalKeyboardView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#B8FF00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questSummary: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
  },
  questSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  questSummaryDescription: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  completionSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
    fontSize: 16,
    color: '#ffffff',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'right',
    marginTop: 8,
  },
  photosScroll: {
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  completionPhotoPreview: {
    width: 120,
    height: 200,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: '#333333',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  addPhotoButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333333',
    borderStyle: 'dashed',
    gap: 12,
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B8FF00',
  },
  questMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  primaryButton: {
    backgroundColor: '#B8FF00',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#B8FF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#B8FF00',
    margin: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  startButton: {
    backgroundColor: '#B8FF00',
    margin: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 20,
  },
  createFirstQuestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#B8FF00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createFirstQuestText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});