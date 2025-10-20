import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Modal,
  Pressable,
} from 'react-native';
import { X } from 'lucide-react-native';

interface PhotoCarouselProps {
  photos: string[];
  onPhotoPress?: (index: number) => void;
}

export function PhotoCarousel({ photos, onPhotoPress }: PhotoCarouselProps) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  if (photos.length === 0) return null;

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {photos.map((photo, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.9}
            onPress={() => onPhotoPress?.(index)}
          >
            <Image
              source={{ uri: photo }}
              style={[styles.photo, { width }]}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      {photos.length > 1 && (
        <View style={styles.pagination}>
          {photos.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === activeIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

interface FullscreenPhotoViewerProps {
  photos: string[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}

export function FullscreenPhotoViewer({
  photos,
  initialIndex,
  visible,
  onClose,
}: FullscreenPhotoViewerProps) {
  const { width, height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.fullscreenContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <View style={styles.closeButtonInner}>
            <X size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentOffset={{ x: initialIndex * width, y: 0 }}
        >
          {photos.map((photo, index) => (
            <Pressable key={index} style={{ width, height }}>
              <Image
                source={{ uri: photo }}
                style={styles.fullscreenPhoto}
                resizeMode="contain"
              />
            </Pressable>
          ))}
        </ScrollView>

        {photos.length > 1 && (
          <View style={styles.fullscreenPagination}>
            {photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.fullscreenPaginationDot,
                  index === activeIndex && styles.fullscreenPaginationDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  photo: {
    height: 300,
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  paginationDotActive: {
    backgroundColor: '#B8FF00',
    width: 24,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenPhoto: {
    width: '100%',
    height: '100%',
  },
  fullscreenPagination: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  fullscreenPaginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  fullscreenPaginationDotActive: {
    backgroundColor: '#B8FF00',
    width: 28,
  },
});
