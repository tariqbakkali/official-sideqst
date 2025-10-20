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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Grid3x3 as Grid3X3 } from 'lucide-react-native';
import { router } from 'expo-router';
import { questService, Quest } from '@/services/questService';

interface CompletedQuest extends Quest {
  completed_at: string;
  completion_notes?: string;
  completion_photo_url?: string;
  quest_categories?: {
    name: string;
    icon: string;
    color: string;
  };
}

export default function JournalScreen() {
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  const [completedQuests, setCompletedQuests] = useState<CompletedQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadJournalData();
  }, []);

  const loadJournalData = async () => {
    try {
      const completed = await questService.getCompletedQuests();
      setCompletedQuests(completed as CompletedQuest[]);
    } catch (error) {
      console.error('Error loading journal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJournalData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const groupQuestsByDate = () => {
    const groups: { [key: string]: CompletedQuest[] } = {};
    completedQuests.forEach(quest => {
      const dateKey = new Date(quest.completed_at).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(quest);
    });
    return Object.entries(groups).map(([date, quests]) => ({ date, quests }));
  };

  const getQuestStats = () => {
    const totalQuests = completedQuests.length;
    const uniqueDates = new Set(completedQuests.map(q => new Date(q.completed_at).toDateString())).size;
    return { totalQuests, uniqueDates };
  };

  const getQuestsForDate = (date: Date) => {
    const dateString = date.toDateString();
    return completedQuests.filter(quest => {
      const questDate = new Date(quest.completed_at);
      return questDate.toDateString() === dateString;
    });
  };

  const hasQuestOnDate = (date: Date) => {
    return getQuestsForDate(date).length > 0;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const renderCalendarView = () => {
    const days = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity 
            style={styles.monthButton} 
            onPress={() => changeMonth('prev')}
          >
            <Text style={styles.monthButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{monthName}</Text>
          <TouchableOpacity 
            style={styles.monthButton} 
            onPress={() => changeMonth('next')}
          >
            <Text style={styles.monthButtonText}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekDaysContainer}>
          {weekDays.map(day => (
            <Text key={day} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {days.map((date, index) => {
            if (!date) {
              return <View key={index} style={styles.emptyDay} />;
            }

            const hasQuest = hasQuestOnDate(date);
            const isSelected = selectedDate === date.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  hasQuest && styles.calendarDayWithQuest,
                  isSelected && styles.calendarDaySelected,
                  isToday && styles.calendarDayToday,
                ]}
                onPress={() => {
                  if (hasQuest) {
                    setSelectedDate(isSelected ? null : date.toDateString());
                  }
                }}
              >
                <Text style={[
                  styles.calendarDayText,
                  hasQuest && styles.calendarDayTextWithQuest,
                  isSelected && styles.calendarDayTextSelected,
                  isToday && styles.calendarDayTextToday,
                ]}>
                  {date.getDate()}
                </Text>
                {hasQuest && <View style={styles.questIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedDate && (
          <View style={styles.selectedDateQuests}>
            <Text style={styles.selectedDateTitle}>
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            <View style={styles.selectedDateQuestsList}>
              {getQuestsForDate(new Date(selectedDate)).map(quest => {
                const imageUrl = quest.completion_photo_url || quest.photo_url || 'https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
                
                return (
                  <TouchableOpacity 
                    key={quest.id} 
                    style={styles.selectedDateQuest}
                    onPress={() => router.push(`/quest/${quest.id}`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.questThumbnailContainer}>
                      <Image source={{ uri: imageUrl }} style={styles.questThumbnail} />
                      <View style={styles.questThumbnailOverlay}>
                        <Text style={styles.questCategoryIcon}>
                          {quest.quest_categories?.icon || '⚡'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.questInfo}>
                      <Text style={styles.questTitle}>{quest.name}</Text>
                      <Text style={styles.questCompletionTime}>
                        {new Date(quest.completed_at).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quest Journal</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, viewMode === 'calendar' && styles.headerButtonActive]}
            onPress={() => setViewMode(viewMode === 'timeline' ? 'calendar' : 'timeline')}
          >
            {viewMode === 'timeline' ? (
              <Calendar size={20} color="#ffffff" />
            ) : (
              <Grid3X3 size={20} color="#ffffff" />
            )}
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading journal entries...</Text>
          </View>
        ) : completedQuests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No completed quests yet</Text>
            <Text style={styles.emptyStateSubtext}>Complete your first quest to start your journal!</Text>
          </View>
        ) : viewMode === 'calendar' ? (
          renderCalendarView()
        ) : (
          <>
            {completedQuests.length > 0 && (
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{getQuestStats().totalQuests}</Text>
                  <Text style={styles.statLabel}>Quests Completed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{getQuestStats().uniqueDates}</Text>
                  <Text style={styles.statLabel}>Days Active</Text>
                </View>
              </View>
            )}
            <View style={styles.timelineContainer}>
              <View style={styles.timeline} />
              {groupQuestsByDate().map((group, groupIndex) => {
                return (
                  <View key={group.date}>
                    <View style={styles.dateHeaderContainer}>
                      <View style={styles.dateHeaderLine} />
                      <Text style={styles.dateHeader}>{formatDate(group.quests[0].completed_at)}</Text>
                      <View style={styles.dateHeaderLine} />
                    </View>
                    {group.quests.map((quest, index) => {
                      const isLeft = (groupIndex + index) % 2 === 0;

                      return (
                        <View key={quest.id} style={[styles.timelineItem, isLeft ? styles.timelineItemLeft : styles.timelineItemRight]}>
                          <View style={styles.timelineNode}>
                            <View style={styles.timelineNodeInner} />
                          </View>
                          <TouchableOpacity
                            style={[styles.questCard, isLeft ? styles.questCardLeft : styles.questCardRight]}
                            onPress={() => router.push(`/quest/${quest.id}`)}
                            activeOpacity={0.9}
                          >
                            {quest.completion_photo_url && (
                              <View style={styles.questImageContainer}>
                                <Image
                                  source={{ uri: quest.completion_photo_url }}
                                  style={styles.questCardImage}
                                />
                                <LinearGradient
                                  colors={['transparent', 'rgba(0,0,0,0.6)']}
                                  style={styles.questImageGradient}
                                />
                              </View>
                            )}

                            <View style={styles.questCardContent}>
                              <Text style={styles.questCardTitle}>{quest.name}</Text>

                              {quest.completion_notes && (
                                <Text style={styles.questCardNotes} numberOfLines={2}>
                                  {quest.completion_notes}
                                </Text>
                              )}

                              {quest.quest_categories && (
                                <View style={styles.questCardMeta}>
                                  <Text style={styles.categoryIcon}>{quest.quest_categories.icon}</Text>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </>
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
  headerButtonActive: {
    backgroundColor: '#B8FF00',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  calendarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: '14.28%',
    height: 50,
  },
  calendarDay: {
    width: '14.28%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendarDayWithQuest: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    margin: 2,
  },
  calendarDaySelected: {
    backgroundColor: '#B8FF00',
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#B8FF00',
  },
  calendarDayText: {
    fontSize: 16,
    color: '#ffffff',
  },
  calendarDayTextWithQuest: {
    fontWeight: 'bold',
  },
  calendarDayTextSelected: {
    color: '#0a0a0a',
    fontWeight: 'bold',
  },
  calendarDayTextToday: {
    color: '#B8FF00',
    fontWeight: 'bold',
  },
  questIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#B8FF00',
  },
  selectedDateQuests: {
    marginTop: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  selectedDateQuestsList: {
    gap: 12,
  },
  selectedDateQuest: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  questThumbnailContainer: {
    position: 'relative',
    marginRight: 12,
  },
  questThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  questThumbnailOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questCategoryIcon: {
    fontSize: 10,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  questCompletionTime: {
    fontSize: 12,
    color: '#B8FF00',
    fontWeight: '500',
  },
  timelineContainer: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  timeline: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#333333',
    marginLeft: -1,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#2a2a2a',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#B8FF00',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 20,
  },
  dateHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333333',
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B8FF00',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginHorizontal: 16,
  },
  timelineItem: {
    position: 'relative',
    marginBottom: 35,
    width: '100%',
  },
  timelineItemLeft: {
    alignItems: 'flex-end',
    paddingRight: '52%',
  },
  timelineItemRight: {
    alignItems: 'flex-start',
    paddingLeft: '52%',
  },
  timelineNode: {
    position: 'absolute',
    left: '50%',
    top: 20,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    marginLeft: -8,
    zIndex: 1,
    borderWidth: 3,
    borderColor: '#B8FF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B8FF00',
  },
  questCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
    maxWidth: '90%',
    borderWidth: 1.5,
    borderColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  questCardLeft: {
    marginRight: 20,
  },
  questCardRight: {
    marginLeft: 20,
  },
  questImageContainer: {
    position: 'relative',
  },
  questCardImage: {
    width: '100%',
    height: 160,
  },
  questImageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  questCardContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  questCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 24,
    textAlign: 'center',
  },
  questCardNotes: {
    fontSize: 13,
    color: '#888888',
    lineHeight: 18,
    textAlign: 'center',
  },
  questCardMeta: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  categoryIcon: {
    fontSize: 32,
    textAlign: 'center',
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
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
});