import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Clock } from 'lucide-react-native';

const durationOptions = [
  { 
    id: 'under-15min', 
    title: 'Under 15 minutes', 
    description: 'Quick tasks you can do right now',
    color: '#4CAF50',
    icon: '⚡'
  },
  { 
    id: 'under-1hour', 
    title: 'Under 1 hour', 
    description: 'Short activities for your free time',
    color: '#8BC34A',
    icon: '⏰'
  },
  { 
    id: 'under-1day', 
    title: 'Under 1 day', 
    description: 'Day-long adventures and projects',
    color: '#FFC107',
    icon: '🌅'
  },
  { 
    id: 'under-1week', 
    title: 'Under 1 week', 
    description: 'Weekly challenges and goals',
    color: '#FF9800',
    icon: '📅'
  },
  { 
    id: 'under-1month', 
    title: 'Under 1 month', 
    description: 'Monthly projects and habits',
    color: '#9C27B0',
    icon: '🗓️'
  },
  { 
    id: 'longer', 
    title: 'Longer', 
    description: 'Long-term commitments and journeys',
    color: '#F44336',
    icon: '🎯'
  },
];

export default function DurationFilterScreen() {
  const handleDurationSelect = (duration: string) => {
    router.push(`/filter/results?type=duration&value=${duration}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Duration</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>How much time do you want to spend?</Text>
        
        <View style={styles.optionsContainer}>
          {durationOptions.map((option) => (
            <TouchableOpacity 
              key={option.id} 
              style={styles.optionCard}
              onPress={() => handleDurationSelect(option.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                <Text style={styles.optionIconText}>{option.icon}</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
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
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 16,
    paddingBottom: 32,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionIconText: {
    fontSize: 24,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 18,
  },
});