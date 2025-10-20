import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Globe, MapPin, Wifi, Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';

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
  const [selectedRadius, setSelectedRadius] = useState(5);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const radiusOptions = [1, 5, 10, 25, 50, 100];

  const handleLocationSelect = (filter: string) => {
    if (filter === 'address') {
      handleLocalSearch();
    } else {
      router.push(`/filter/results?type=location&value=${filter}`);
    }
  };

  const handleLocalSearch = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions to search for nearby quests.',
          [{ text: 'OK' }]
        );
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      router.push(`/filter/results?type=location&value=address&lat=${location.coords.latitude}&lng=${location.coords.longitude}&radius=${selectedRadius}`);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    } finally {
      setLoadingLocation(false);
    }
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
            <View key={option.id}>
              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => handleLocationSelect(option.filter)}
                activeOpacity={0.8}
                disabled={loadingLocation && option.filter === 'address'}
              >
                <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                  {loadingLocation && option.filter === 'address' ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <option.icon size={28} color="#ffffff" />
                  )}
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>

              {option.filter === 'address' && (
                <View style={styles.radiusSelector}>
                  <View style={styles.radiusHeader}>
                    <Navigation size={16} color="#B8FF00" />
                    <Text style={styles.radiusLabel}>Search Radius</Text>
                  </View>
                  <View style={styles.radiusOptions}>
                    {radiusOptions.map((radius) => (
                      <TouchableOpacity
                        key={radius}
                        style={[
                          styles.radiusButton,
                          selectedRadius === radius && styles.radiusButtonActive
                        ]}
                        onPress={() => setSelectedRadius(radius)}
                      >
                        <Text style={[
                          styles.radiusButtonText,
                          selectedRadius === radius && styles.radiusButtonTextActive
                        ]}>
                          {radius} mi
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
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
  radiusSelector: {
    marginTop: 12,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  radiusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  radiusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radiusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
  },
  radiusButtonActive: {
    backgroundColor: '#B8FF00',
    borderColor: '#B8FF00',
  },
  radiusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
  },
  radiusButtonTextActive: {
    color: '#0a0a0a',
  },
});