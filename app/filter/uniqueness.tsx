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
import { ArrowLeft } from 'lucide-react-native';

const uniquenessOptions = [
  { 
    id: 1, 
    title: 'Common', 
    description: 'Everyone does these - great for beginners',
    color: '#9E9E9E',
    rarity: '✦'
  },
  { 
    id: 2, 
    title: 'Uncommon', 
    description: 'Slightly unique experiences',
    color: '#4CAF50',
    rarity: '✦✦'
  },
  { 
    id: 3, 
    title: 'Rare', 
    description: 'Not many people do these',
    color: '#2196F3',
    rarity: '✦✦✦'
  },
  { 
    id: 4, 
    title: 'Epic', 
    description: 'Very few people attempt these',
    color: '#9C27B0',
    rarity: '✦✦✦✦'
  },
  { 
    id: 5, 
    title: 'Legendary', 
    description: 'Extremely rare, once-in-a-lifetime experiences',
    color: '#FF9800',
    rarity: '✦✦✦✦✦'
  },
];

export default function UniquenessFilterScreen() {
  const handleUniquenessSelect = (uniqueness: number) => {
    router.push(`/filter/results?type=uniqueness&value=${uniqueness}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Uniqueness</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>How rare do you want your quest to be?</Text>
        
        <View style={styles.optionsContainer}>
          {uniquenessOptions.map((option) => (
            <TouchableOpacity 
              key={option.id} 
              style={styles.optionCard}
              onPress={() => handleUniquenessSelect(option.id)}
              activeOpacity={0.8}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <Text style={[styles.optionTitle, { color: option.color }]}>{option.title}</Text>
                  <Text style={[styles.rarityStars, { color: option.color }]}>{option.rarity}</Text>
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
  rarityStars: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionDescription: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 18,
  },
});