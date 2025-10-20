import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { questService, Quest, QuestStep, QuestStepProgress } from '@/services/questService';
import { wishlistService } from '@/services/wishlistService';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  Heart,
  Share,
  Plus,
  MapPin,
  Clock,
  Target,
  DollarSign,
  User,
  Calendar,
  CheckCircle2,
  Circle
} from 'lucide-react-native';
import * as Sharing from 'expo-sharing';

interface QuestWithCategory extends Quest {
  quest_categories?: {
    name: string;
    icon: string;
    color: string;
  };
}

export default function QuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [quest, setQuest] = useState<QuestWithCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddedToMyQuests, setIsAddedToMyQuests] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addingToQuests, setAddingToQuests] = useState(false);
  const [questSteps, setQuestSteps] = useState<QuestStep[]>([]);
  const [stepProgress, setStepProgress] = useState<QuestStepProgress[]>([]);
  const [isUserQuest, setIsUserQuest] = useState(false);

  useEffect(() => {
    if (id) {
      loadQuest();
    }
  }, [id]);

  useEffect(() => {
    if (quest) {
      checkWishlistStatus();
      checkAddedStatus();
    }
  }, [quest]);

  const loadQuest = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('sidequests')
        .select(`
          *,
          quest_categories (
            name,
            icon,
            color
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setQuest(data);

      // Check if this quest belongs to the current user
      const isOwned = userData.user?.id === data.created_by;
      setIsUserQuest(isOwned);

      // Load quest steps
      const steps = await questService.getQuestSteps(id);
      setQuestSteps(steps);

      // Load step progress if this is the user's quest
      if (isOwned && steps.length > 0) {
        const progress = await questService.getUserQuestStepProgress(id);
        setStepProgress(progress);
      }
    } catch (error) {
      console.error('Error loading quest:', error);
      Alert.alert('Error', 'Failed to load quest details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const checkWishlistStatus = async () => {
    if (!quest) return;
    try {
      const inWishlist = await wishlistService.isInWishlist(quest.id);
      setIsInWishlist(inWishlist);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const checkAddedStatus = async () => {
    if (!quest) return;
    try {
      const hasAdded = await questService.hasAddedToMyQuests(quest.id);
      setIsAddedToMyQuests(hasAdded);
    } catch (error) {
      console.error('Error checking added status:', error);
    }
  };

  const handleAddToMyQuests = async () => {
    if (!quest || addingToQuests || isAddedToMyQuests) return;
    
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
    if (!quest || wishlistLoading) return;
    
    setWishlistLoading(true);
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
      setWishlistLoading(false);
    }
  };

  const handleShare = async () => {
    if (!quest) return;
    
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
    if (!quest) return '';
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

  const getDifficultyColor = (difficulty: number) => {
    const colors = ['', '#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#F44336'];
    return colors[difficulty] || '#FFC107';
  };

  const getUniquenessLabel = (uniqueness: number) => {
    const levels = ['', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
    return levels[uniqueness] || 'Common';
  };

  const getUniquenessColor = (uniqueness: number) => {
    const colors = ['', '#9E9E9E', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];
    return colors[uniqueness] || '#9E9E9E';
  };

  const getDurationDisplay = () => {
    if (!quest) return '';
    return `${quest.duration_value} ${quest.duration_unit}`;
  };

  const handleToggleStep = async (stepOrder: number) => {
    if (!isUserQuest || !id) return;

    try {
      const isCompleted = stepProgress.some(
        p => p.step_order === stepOrder && p.completed_at
      );

      if (isCompleted) {
        await questService.uncompleteQuestStep(id, stepOrder);
        setStepProgress(prev => prev.map(p =>
          p.step_order === stepOrder ? { ...p, completed_at: undefined } : p
        ));
      } else {
        await questService.completeQuestStep(id, stepOrder);
        const newProgress = {
          id: `temp-${stepOrder}`,
          user_quest_id: id,
          step_order: stepOrder,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        setStepProgress(prev => {
          const existingIndex = prev.findIndex(p => p.step_order === stepOrder);
          if (existingIndex >= 0) {
            return prev.map((p, i) => i === existingIndex ? newProgress : p);
          }
          return [...prev, newProgress];
        });
      }
    } catch (error) {
      console.error('Error toggling step:', error);
      Alert.alert('Error', 'Failed to update step progress');
    }
  };

  const isStepCompleted = (stepOrder: number) => {
    return stepProgress.some(p => p.step_order === stepOrder && p.completed_at);
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
          <Text style={styles.loadingText}>Loading quest...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!quest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Quest not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const imageUrl = quest.photo_url || 'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <ImageBackground 
            source={{ uri: imageUrl }} 
            style={styles.heroImage}
            imageStyle={styles.heroImageStyle}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.8)']}
              style={styles.heroGradient}
            >
              <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                  <ArrowLeft size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.heroContent}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryIcon}>{quest.quest_categories?.icon || '⚡'}</Text>
                  <Text style={styles.categoryName}>{quest.quest_categories?.name || 'Quest'}</Text>
                </View>
                <Text style={styles.questTitle}>{quest.name}</Text>
                <View style={styles.locationRow}>
                  <MapPin size={16} color="#B8FF00" />
                  <Text style={styles.locationText}>{getLocationDisplay()}</Text>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{quest.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quest Details</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailCard}>
                <Target size={20} color={getDifficultyColor(quest.difficulty)} />
                <Text style={styles.detailLabel}>Difficulty</Text>
                <Text style={[styles.detailValue, { color: getDifficultyColor(quest.difficulty) }]}>
                  {getDifficultyLabel(quest.difficulty)}
                </Text>
              </View>
              
              <View style={styles.detailCard}>
                <Clock size={20} color="#B8FF00" />
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>{getDurationDisplay()}</Text>
              </View>
              
              <View style={styles.detailCard}>
                <Text style={[styles.uniquenessIcon, { color: getUniquenessColor(quest.uniqueness) }]}>
                  ✦
                </Text>
                <Text style={styles.detailLabel}>Uniqueness</Text>
                <Text style={[styles.detailValue, { color: getUniquenessColor(quest.uniqueness) }]}>
                  {getUniquenessLabel(quest.uniqueness)}
                </Text>
              </View>
              
              {quest.cost && (
                <View style={styles.detailCard}>
                  <DollarSign size={20} color="#FFC107" />
                  <Text style={styles.detailLabel}>Est. Cost</Text>
                  <Text style={styles.detailValue}>${quest.cost}</Text>
                </View>
              )}
            </View>
          </View>

          {quest.location_type === 'online' && quest.location_text && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Online Link</Text>
              <TouchableOpacity style={styles.linkCard}>
                <Text style={styles.linkText} numberOfLines={1}>
                  {quest.location_text}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {questSteps.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Progression Steps</Text>
              <View style={styles.stepsContainer}>
                {questSteps.map((step) => {
                  const completed = isStepCompleted(step.step_order);
                  return (
                    <TouchableOpacity
                      key={step.id}
                      style={[styles.stepItem, completed && styles.stepItemCompleted]}
                      onPress={() => isUserQuest && handleToggleStep(step.step_order)}
                      disabled={!isUserQuest}
                    >
                      <View style={styles.stepIconContainer}>
                        {completed ? (
                          <CheckCircle2 size={24} color="#B8FF00" fill="#B8FF00" />
                        ) : (
                          <Circle size={24} color="#888888" />
                        )}
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={[styles.stepTitle, completed && styles.stepTitleCompleted]}>
                          {step.title}
                        </Text>
                        {step.description && (
                          <Text style={styles.stepDescription}>{step.description}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quest Info</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <User size={16} color="#888888" />
                <Text style={styles.infoLabel}>Created by</Text>
                <Text style={styles.infoValue}>Quest Creator</Text>
              </View>
              <View style={styles.infoRow}>
                <Calendar size={16} color="#888888" />
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>
                  {new Date(quest.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.addButton]}
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
              <Plus size={20} color="#0a0a0a" />
              <Text style={[styles.actionText, styles.addButtonText]}>
                {addingToQuests ? 'Adding...' : 'Add'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleToggleWishlist}
          disabled={wishlistLoading}
        >
          <Heart 
            size={20} 
            color={isInWishlist ? "#ff4757" : "#ffffff"} 
            fill={isInWishlist ? "#ff4757" : "transparent"}
          />
          <Text style={[styles.actionText, isInWishlist && styles.activeActionText]}>
            {isInWishlist ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Share size={20} color="#ffffff" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 400,
  },
  heroImage: {
    flex: 1,
  },
  heroImageStyle: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    gap: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(184, 255, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B8FF00',
  },
  questTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 38,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 16,
    color: '#B8FF00',
    fontWeight: '500',
  },
  content: {
    padding: 20,
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
  description: {
    fontSize: 16,
    color: '#cccccc',
    lineHeight: 24,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: '45%',
    flex: 1,
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  uniquenessIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  linkCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  linkText: {
    fontSize: 14,
    color: '#B8FF00',
    textDecorationLine: 'underline',
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888888',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  stepsContainer: {
    gap: 12,
  },
  stepItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  stepItemCompleted: {
    borderColor: '#B8FF00',
    backgroundColor: 'rgba(184, 255, 0, 0.05)',
  },
  stepIconContainer: {
    paddingTop: 2,
  },
  stepContent: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  stepTitleCompleted: {
    color: '#B8FF00',
  },
  stepDescription: {
    fontSize: 14,
    color: '#888888',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#333333',
    minWidth: 80,
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#B8FF00',
  },
  actionText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  addButtonText: {
    color: '#0a0a0a',
  },
  activeActionText: {
    color: '#ff4757',
  },
  checkmark: {
    fontSize: 18,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#ff4757',
    fontWeight: 'bold',
  },
});