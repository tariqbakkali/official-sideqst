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

export default function CategoriesFilterScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Choose a category to explore</Text>
        
        <View style={styles.categoriesGrid}>
          {questCategories.map((category) => (
            <TouchableOpacity 
              key={category.id} 
              style={styles.categoryCard}
              onPress={() => router.push(`/category/${category.id}`)}
              activeOpacity={0.8}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <Text style={styles.categoryIconText}>{category.icon}</Text>
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingBottom: 32,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#333333',
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 16,
  },
});