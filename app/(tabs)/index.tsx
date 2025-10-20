import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { questService, Quest } from '@/services/questService';
import { supabase } from '@/lib/supabase';
import { wishlistService } from '@/services/wishlistService';
import { Heart, Share, Plus, MapPin, Clock, Target } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';

interface QuestWithCategory extends Quest {
  quest_categories?: {
    name: string;
    icon: string;
    color: string;
  };
}

const QuestCard = ({ quest, style }: { quest: QuestWithCategory; style: any }) => {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddedToMyQuests, setIsAddedToMyQuests] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingToQuests, setAddingToQuests] = useState(false);

  // Check if this is a large card based on height
  const isLargeCard = style?.height >= 250;

  useEffect(() => {
    checkWishlistStatus();
    checkAddedStatus();
  }, [quest.id]);

  const checkWishlistStatus = async () => {
    try {
      const inWishlist = await wishlistService.isInWishlist(quest.id);
      setIsInWishlist(inWishlist);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const checkAddedStatus = async () => {
    try {
      const hasAdded = await questService.hasAddedToMyQuests(quest.id);
      setIsAddedToMyQuests(hasAdded);
    } catch (error) {
      console.error('Error checking added status:', error);
    }
  };

  const handleAddToMyQuests = async () => {
    if (addingToQuests || isAddedToMyQuests) return;
    
    setAddingToQuests(true);
    try {
      await questService.addToMyQuests(quest.id);
      setIsAddedToMyQuests(true);
      Alert.alert('Success!', 'Quest added to your active quests');
    } catch (error) {
      console.error('Error adding to my quests:', error);
      Alert.alert('Error', 'Failed to add quest to your active quests');
    } finally {
      setAddingToQuests(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (isInWishlist) {
        await wishlistService.removeFromWishlist(quest.id);
        setIsInWishlist(false);
      } else {
        await wishlistService.addToWishlist(quest.id);
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      Alert.alert('Error', 'Failed to update wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const locationInfo = getLocationDisplay();
      const difficultyInfo = getDifficultyLabel(quest.difficulty);
      const durationInfo = getDurationDisplay();

      const shareMessage = `🎯 ${quest.name}\n\n${quest.description}\n\n📍 ${locationInfo}\n⚡ ${difficultyInfo}\n⏱️ ${durationInfo}\n\nDiscover this quest on SideQuests!`;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync('', {
          message: shareMessage,
        });
      } else {
        // Fallback for web - copy to clipboard
        Alert.alert('Quest Details', shareMessage, [
          { text: 'OK', style: 'default' }
        ]);
      }
    } catch (error) {
      console.error('Error sharing quest:', error);
      Alert.alert('Error', 'Failed to share quest');
    }
  };

  const getLocationDisplay = () => {
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

  const getDurationDisplay = () => {
    return `${quest.duration_value} ${quest.duration_unit}`;
  };

  const handleQuestPress = (questId: string) => {
    router.push(`/quest/${questId}`);
  };

  // Use photo_url if available, otherwise fallback to a default image
  const imageUrl = quest.photo_url || 'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';

  return (
    <TouchableOpacity 
      style={[styles.questCard, style]} 
      activeOpacity={0.9}
      onPress={() => handleQuestPress(quest.id)}
    >
      <ImageBackground 
        source={{ uri: imageUrl }} 
        style={styles.questImage}
        imageStyle={styles.questImageStyle}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.gradient}
        >
          <View style={styles.questInfo}>
            <Text style={styles.questTitle} numberOfLines={2}>{quest.name}</Text>
            {isLargeCard && (
              <Text style={styles.questDescription} numberOfLines={2}>{quest.description}</Text>
            )}

            {isLargeCard && (
              <>
                <View style={styles.locationRow}>
                  <MapPin size={12} color="#B8FF00" />
                  <Text style={styles.locationText}>{getLocationDisplay()}</Text>
                </View>

                <View style={styles.questMeta}>
                  <View style={styles.metaItem}>
                    <Text style={styles.categoryBadge}>{quest.quest_categories?.icon || '⚡'}</Text>
                    <Text style={styles.metaValue}>{quest.quest_categories?.name || 'Quest'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Target size={12} color="#B8FF00" />
                    <Text style={styles.metaValue}>{getDifficultyLabel(quest.difficulty)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={12} color="#B8FF00" />
                    <Text style={styles.metaValue}>{getDurationDisplay()}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </LinearGradient>
      </ImageBackground>
      
      <View style={styles.questActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleAddToMyQuests}
          disabled={addingToQuests || isAddedToMyQuests}
        >
          {isAddedToMyQuests ? (
            <>
              <Text style={styles.checkmark}>✓</Text>
              {isLargeCard && <Text style={[styles.actionText, styles.addedText]}>Added</Text>}
            </>
          ) : (
            <>
              <Plus size={16} color="#B8FF00" />
              {isLargeCard && (
                <Text style={styles.actionText}>
                  {addingToQuests ? 'Adding...' : 'Add'}
                </Text>
              )}
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleToggleWishlist}
          disabled={loading}
        >
          <Heart 
            size={16} 
            color={isInWishlist ? "#ff4757" : "#ffffff"} 
            fill={isInWishlist ? "#ff4757" : "transparent"}
          />
          {isLargeCard && (
            <Text style={[styles.actionText, isInWishlist && styles.activeActionText]}>
              {isInWishlist ? 'Saved' : 'Save'}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Share size={16} color="#ffffff" />
          {isLargeCard && <Text style={styles.actionText}>Share</Text>}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function FeedScreen() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<QuestWithCategory[]>([]);
  const [filteredQuests, setFilteredQuests] = useState<QuestWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  const filterOptions = [
    { id: 'online', label: 'Online' },
    { id: 'anywhere', label: 'Anywhere' },
    { id: 'address', label: 'IRL' },
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' },
  ];

  useEffect(() => {
    loadQuests();
    loadProfilePhoto();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [quests, activeFilters]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadQuests = async () => {
    try {
      const data = await questService.getPublicQuests(20);
      const shuffledData = shuffleArray(data);
      setQuests(shuffledData);
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfilePhoto = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('photo_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data?.photo_url) {
        setProfilePhotoUrl(data.photo_url);
      }
    } catch (error) {
      console.error('Error loading profile photo:', error);
    }
  };

  const applyFilters = () => {
    if (activeFilters.length === 0) {
      setFilteredQuests(quests);
      return;
    }

    const filtered = quests.filter(quest => {
      // Location filters
      const locationFilters = activeFilters.filter(f => ['online', 'anywhere', 'address'].includes(f));
      const difficultyFilters = activeFilters.filter(f => ['easy', 'medium', 'hard'].includes(f));

      let matchesLocation = locationFilters.length === 0;
      let matchesDifficulty = difficultyFilters.length === 0;

      // Check location filters
      if (locationFilters.length > 0) {
        if (locationFilters.includes('address') && quest.location_type === 'address') {
          matchesLocation = true;
        } else if (locationFilters.includes('online') && quest.location_type === 'online') {
          matchesLocation = true;
        } else if (locationFilters.includes('anywhere') && quest.location_type === 'anywhere') {
          matchesLocation = true;
        } else {
          matchesLocation = false;
        }
      }

      // Check difficulty filters
      if (difficultyFilters.length > 0) {
        matchesDifficulty = false;
        if (difficultyFilters.includes('easy') && quest.difficulty <= 2) {
          matchesDifficulty = true;
        } else if (difficultyFilters.includes('medium') && quest.difficulty === 3) {
          matchesDifficulty = true;
        } else if (difficultyFilters.includes('hard') && quest.difficulty >= 4) {
          matchesDifficulty = true;
        }
      }

      return matchesLocation && matchesDifficulty;
    });

    setFilteredQuests(filtered);
  };

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => {
      if (prev.includes(filterId)) {
        return prev.filter(id => id !== filterId);
      } else {
        return [...prev, filterId];
      }
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuests();
    setRefreshing(false);
  };

  const renderCollageLayout = () => {
    const questsToRender = filteredQuests;
    
    if (questsToRender.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {activeFilters.length > 0 ? 'No quests match your filters' : 'No quests available yet'}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            {activeFilters.length > 0 ? 'Try adjusting your filters' : 'Create the first quest to get started!'}
          </Text>
        </View>
      );
    }

    const rows = [];
    let currentIndex = 0;
    
    while (currentIndex < questsToRender.length) {
      const quest1 = questsToRender[currentIndex];
      const quest2 = questsToRender[currentIndex + 1];
      
      if (currentIndex % 3 === 0 && quest1) {
        // Every third row is a large card
        rows.push(
          <View key={`row-${currentIndex}`} style={styles.collageRow}>
            <QuestCard quest={quest1} style={styles.largeCard} />
          </View>
        );
        currentIndex += 1;
      } else if (quest1 && quest2) {
        // Two cards side by side
        rows.push(
          <View key={`row-${currentIndex}`} style={styles.collageRow}>
            <QuestCard quest={quest1} style={styles.halfCard} />
            <QuestCard quest={quest2} style={styles.halfCard} />
          </View>
        );
        currentIndex += 2;
      } else if (quest1) {
        // Single remaining card
        rows.push(
          <View key={`row-${currentIndex}`} style={styles.collageRow}>
            <QuestCard quest={quest1} style={styles.largeCard} />
          </View>
        );
        currentIndex += 1;
      } else {
        break;
      }
    }
    
    return rows;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.userInfo}>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => router.push('/profile/edit')}
              activeOpacity={0.7}
            >
              {profilePhotoUrl ? (
                <Image
                  source={{ uri: profilePhotoUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || '👤'}
                </Text>
              )}
            </TouchableOpacity>
            <View>
              <Text style={styles.greeting}>
                Hi {user?.user_metadata?.full_name?.split(' ')[0] || 'Adventurer'}
              </Text>
              <Text style={styles.subtitle}>Ready for Adventure</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationText}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <View style={styles.filtersContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filtersScroll}
              contentContainerStyle={styles.filtersContent}
            >
              {filterOptions.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterButton,
                    activeFilters.includes(filter.id) && styles.filterButtonActive,
                  ]}
                  onPress={() => toggleFilter(filter.id)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    activeFilters.includes(filter.id) && styles.filterButtonTextActive,
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <Text style={styles.sectionTitle}>Featured Quests</Text>
        </View>

        <View style={styles.collageContainer}>
          {renderCollageLayout()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#B8FF00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
  },
  avatarText: {
    fontSize: 20,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  collageContainer: {
    paddingHorizontal: 20,
  },
  collageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  largeCard: {
    flex: 1,
    height: 280,
  },
  halfCard: {
    flex: 1,
    height: 200,
  },
  questCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  questImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  questImageStyle: {
    borderRadius: 16,
  },
  gradient: {
    padding: 16,
    justifyContent: 'flex-end',
  },
  questInfo: {
    gap: 6,
  },
  questTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 22,
  },
  questDescription: {
    fontSize: 12,
    color: '#cccccc',
    lineHeight: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#B8FF00',
    fontWeight: '500',
  },
  questMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaValue: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
    backgroundColor: 'rgba(184, 255, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryBadge: {
    fontSize: 12,
  },
  questActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 4,
  },
  activeActionText: {
    color: '#ff4757',
  },
  checkmark: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  addedText: {
    color: '#4CAF50',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filtersContent: {
    paddingHorizontal: 0,
    gap: 8,
  },
  filterButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  filterButtonActive: {
    backgroundColor: '#B8FF00',
    borderColor: '#B8FF00',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  filterButtonTextActive: {
    color: '#0a0a0a',
  },
});