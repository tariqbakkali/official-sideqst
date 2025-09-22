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
import { ArrowLeft, Star } from 'lucide-react-native';

const difficultyOptions = [
  { 
    id: 1, 
    title: 'Super Easy', 
    description: 'Anyone can do this with minimal effort',
    color: '#4CAF50',
    stars: 1
  },
  { 
    id: 2, 
    title: 'Easy', 
    description: 'Simple tasks that require little skill',
    color: '#8BC34A',
    stars: 2
  },
  { 
    id: 3, 
    title: 'Medium', 
    description: 'Moderate challenge, some effort required',
    color: '#FFC107',
    stars: 3
  },
  { 
    id: 4, 
    title: 'Hard', 
    description: 'Challenging tasks that need dedication',
    color: '#FF9800',
    stars: 4
  },
  { 
    id: 5, 
    title: 'Very Hard', 
    description: 'Extremely challenging, for experts only',
    color: '#F44336',
    stars: 5
  },
];

export default function DifficultyFilterScreen() {
  const handleDifficultySelect = (difficulty: number) => {
    router.push(`/filter/results?type=difficulty&value=${difficulty}`);
  };

  const renderStars = (count: number, color: string) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star 
        key={index} 
        size={16} 
        color={index < count ? color : '#333333'} 
        fill={index < count ? color : 'transparent'}
      />
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Difficulty</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>How challenging do you want your quest to be?</Text>
        
        <View style={styles.optionsContainer}>
          {difficultyOptions.map((option) => (
            <TouchableOpacity 
              key={option.id} 
              style={styles.optionCard}
              onPress={() => handleDifficultySelect(option.id)}
              activeOpacity={0.8}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <Text style={[styles.optionTitle, { color: option.color }]}>{option.title}</Text>
                  <View style={styles.starsContainer}>
                    {renderStars(option.stars, option.color)}
                  </View>
                </View>
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
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 18,
  },
});