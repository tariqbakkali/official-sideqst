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
import { ArrowLeft, Globe, MapPin, Wifi } from 'lucide-react-native';

const locationOptions = [
  { 
    id: 'anywhere', 
    title: 'Anywhere', 
    description: 'Can be done from any location',
    icon: Globe,
    color: '#4ECDC4',
    filter: 'anywhere'
  },
  { 
    id: 'online', 
    title: 'Online', 
    description: 'Requires internet connection',
    icon: Wifi,
    color: '#45B7D1',
    filter: 'online'
  },
  { 
    id: 'local', 
    title: 'Local/IRL', 
    description: 'Must be done at specific places',
    icon: MapPin,
    color: '#FF6B6B',
    filter: 'address'
  },
];

export default function LocationFilterScreen() {
  const handleLocationSelect = (filter: string) => {
    router.push(`/filter/results?type=location&value=${filter}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Where do you want to do your quest?</Text>
        
        <View style={styles.optionsContainer}>
          {locationOptions.map((option) => (
            <TouchableOpacity 
              key={option.id} 
              style={styles.optionCard}
              onPress={() => handleLocationSelect(option.filter)}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                <option.icon size={28} color="#ffffff" />
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