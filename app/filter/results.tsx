import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, MapPin, Target, Clock, Plus, Heart, Share } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { questService, Quest } from '@/services/questService';
import { wishlistService } from '@/services/wishlistService';
import * as Sharing from 'expo-sharing';

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
      const shareContent = {
        message: `Check out this quest: ${quest.name}\n\n${quest.description}\n\nFound on SideQuests app!`,
      };
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync('', shareContent);
      } else {
        Alert.alert('Share Quest', shareContent.message);
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
    const levels = ['', 'Super Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];
    return levels[difficulty] || 'Medium';
  };

  const getDurationDisplay = () => {
    return `${quest.duration_value} ${quest.duration_unit}`;
  };

  const handleQuestPress = (questId: string) => {
    router.push(`/quest/${questId}`);
  };

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
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        >
          <View style={styles.questInfo}>
            <Text style={styles.questTitle} numberOfLines={2}>{quest.name}</Text>
            <Text style={styles.questDescription} numberOfLines={2}>{quest.description}</Text>
            
            <View style={styles.locationRow}>
              <MapPin size={12} color="#B8FF00" />
              <Text style={styles.locationText}>{getLocationDisplay()}</Text>
            </View>
            
            <View style={styles.questMeta}>
              <View style={styles.metaItem}>
                <Target size={12} color="#B8FF00" />
                <Text style={styles.metaValue}>{getDifficultyLabel(quest.difficulty)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={12} color="#B8FF00" />
                <Text style={styles.metaValue}>{getDurationDisplay()}</Text>
              </View>
            </View>
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
              <Text style={[styles.actionText, styles.addedText]}>Added</Text>
            </>
          ) : (
            <>
              <Plus size={16} color="#B8FF00" />
              <Text style={styles.actionText}>
                {addingToQuests ? 'Adding...' : 'Add'}
              </Text>
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
          <Text style={[styles.actionText, isInWishlist && styles.activeActionText]}>
            {isInWishlist ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Share size={16} color="#ffffff" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function FilterResultsScreen() {
  const { type, value } = useLocalSearchParams<{ type: string; value: string }>();
  const [quests, setQuests] = useState<QuestWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (type && value) {
      loadFilteredQuests();
    }
  }, [type, value]);

  const getFilterTitle = () => {
    switch (type) {
      case 'location':
        return value === 'anywhere' ? 'Anywhere' : value === 'online' ? 'Online' : 'Local/IRL';
      case 'difficulty':
        const levels = ['', 'Super Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];
        return levels[parseInt(value)] || 'Unknown';
      case 'duration':
        return value.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
      case 'uniqueness':
        const rarities = ['', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
        return rarities[parseInt(value)] || 'Unknown';
      default:
        return 'Filtered';
    }
  };

  const loadFilteredQuests = async () => {
    try {
      // Get all public quests
      const { data: allQuests, error } = await supabase
        .from('sidequests')
        .select(`
          *,
          quest_categories (
            name,
            icon,
            color
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter quests based on the filter type and value
      let filteredQuests = allQuests || [];

      switch (type) {
        case 'location':
          filteredQuests = filteredQuests.filter(quest => quest.location_type === value);
          break;
        case 'difficulty':
          filteredQuests = filteredQuests.filter(quest => quest.difficulty === parseInt(value));
          break;
        case 'duration':
          filteredQuests = filterByDuration(filteredQuests, value);
          break;
        case 'uniqueness':
          filteredQuests = filteredQuests.filter(quest => quest.uniqueness === parseInt(value));
          break;
      }

      // Filter out quests that are already in user's active quests or completed
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userQuests, error: userQuestsError } = await supabase
          .from('sidequests')
          .select('name, description')
          .eq('created_by', user.id);

        if (userQuestsError) throw userQuestsError;

        // Filter out quests that match user's existing quests by name and description
        const finalQuests = filteredQuests.filter(quest => {
          return !userQuests?.some(userQuest => 
            userQuest.name === quest.name && userQuest.description === quest.description
          );
        });

        setQuests(finalQuests);
      } else {
        setQuests(filteredQuests);
      }
    } catch (error) {
      console.error('Error loading filtered quests:', error);
      Alert.alert('Error', 'Failed to load quests');
    } finally {
      setLoading(false);
    }
  };

  const filterByDuration = (quests: any[], durationFilter: string) => {
    return quests.filter(quest => {
      const durationInMinutes = convertToMinutes(quest.duration_value, quest.duration_unit);
      
      switch (durationFilter) {
        case 'under-15min':
          return durationInMinutes <= 15;
        case 'under-1hour':
          return durationInMinutes <= 60;
        case 'under-1day':
          return durationInMinutes <= 1440; // 24 hours
        case 'under-1week':
          return durationInMinutes <= 10080; // 7 days
        case 'under-1month':
          return durationInMinutes <= 43200; // 30 days
        case 'longer':
          return durationInMinutes > 43200;
        default:
          return true;
      }
    });
  };

  const convertToMinutes = (value: number, unit: string) => {
    switch (unit) {
      case 'minutes':
        return value;
      case 'hours':
        return value * 60;
      case 'days':
        return value * 60 * 24;
      case 'weeks':
        return value * 60 * 24 * 7;
      case 'months':
        return value * 60 * 24 * 30;
      default:
        return value;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFilteredQuests();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading quests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getFilterTitle()}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          <Text style={styles.questCount}>{quests.length} Available Quests</Text>
        </View>

        {quests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No available quests</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your filters or check back later for new quests
            </Text>
          </View>
        ) : (
          <View style={styles.questsContainer}>
            {quests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} style={styles.questCardStyle} />
            ))}
          </View>
        )}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  questCount: {
    fontSize: 16,
    color: '#B8FF00',
    fontWeight: '600',
  },
  questsContainer: {
    paddingHorizontal: 20,
  },
  questCardStyle: {
    marginBottom: 20,
  },
  questCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  questImage: {
    height: 200,
    justifyContent: 'flex-end',
  },
  questImageStyle: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  gradient: {
    padding: 16,
    justifyContent: 'flex-end',
  },
  questInfo: {
    gap: 6,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#888888',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
});