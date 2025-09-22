import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MapPin, Search, X } from 'lucide-react-native';
import { geocodingService, AddressSuggestion } from '@/services/geocoding';

interface LocationInputProps {
  locationType: 'anywhere' | 'online' | 'address';
  locationText: string;
  onLocationChange: (text: string, coordinates?: { latitude: number; longitude: number }) => void;
  placeholder?: string;
}

export default function LocationInput({
  locationType,
  locationText,
  onLocationChange,
  placeholder,
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState(locationText);

  useEffect(() => {
    setSearchQuery(locationText);
  }, [locationText]);

  const searchAddresses = async (query: string) => {
    if (locationType !== 'address' || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const results = await geocodingService.searchAddresses(query);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Error searching addresses:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    setSearchQuery(text);
    
    if (locationType === 'address') {
      // Debounce the search
      const timeoutId = setTimeout(() => {
        searchAddresses(text);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      // For 'online' type, just update the text
      onLocationChange(text);
    }
  };

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    const coordinates = {
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
    };
    
    setSearchQuery(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    onLocationChange(suggestion.display_name, coordinates);
  };

  const clearInput = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    setSuggestions([]);
    onLocationChange('');
  };

  const getPlaceholder = () => {
    switch (locationType) {
      case 'online':
        return placeholder || 'Enter URL (e.g., https://zoom.us/...)';
      case 'address':
        return placeholder || 'Search for an address or place...';
      default:
        return placeholder || 'No specific location needed';
    }
  };

  if (locationType === 'anywhere') {
    return (
      <View style={styles.container}>
        <View style={styles.anywhereContainer}>
          <MapPin size={20} color="#B8FF00" />
          <Text style={styles.anywhereText}>This quest can be done anywhere</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          {locationType === 'address' ? (
            <Search size={20} color="#888888" style={styles.inputIcon} />
          ) : (
            <MapPin size={20} color="#888888" style={styles.inputIcon} />
          )}
          
          <TextInput
            style={styles.input}
            placeholder={getPlaceholder()}
            placeholderTextColor="#888888"
            value={searchQuery}
            onChangeText={handleTextChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          {loading && <ActivityIndicator size="small" color="#B8FF00" />}
          
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearInput} style={styles.clearButton}>
              <X size={16} color="#888888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSuggestionSelect(item)}
              >
                <MapPin size={16} color="#B8FF00" style={styles.suggestionIcon} />
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {item.display_name}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  anywhereContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#333333',
    gap: 12,
  },
  anywhereText: {
    fontSize: 16,
    color: '#888888',
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    maxHeight: 200,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  suggestionIcon: {
    marginRight: 12,
    flexShrink: 0,
  },
  suggestionText: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
    lineHeight: 18,
  },
});