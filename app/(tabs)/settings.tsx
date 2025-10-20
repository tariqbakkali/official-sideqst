import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, CircleHelp as HelpCircle, Star, Share2, LogOut, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const settingsData = [
  {
    section: 'Preferences',
    items: [
      { icon: Bell, title: 'Notifications', subtitle: 'Manage your preferences', hasToggle: true, value: true },
    ]
  },
  {
    section: 'Support',
    items: [
      { icon: HelpCircle, title: 'Help & Support', subtitle: 'Get help and contact us', hasChevron: true },
      { icon: Star, title: 'Rate App', subtitle: 'Share your feedback', hasChevron: true },
      { icon: Share2, title: 'Share App', subtitle: 'Invite friends to join', hasChevron: true },
    ]
  },
];

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [toggleValues, setToggleValues] = useState({
    notifications: true,
    darkMode: true,
  });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [questStats, setQuestStats] = useState({ completed: 0, created: 0 });

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadQuestStats();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      } else if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadQuestStats = async () => {
    try {
      const [completedRes, createdRes] = await Promise.all([
        supabase
          .from('user_quest_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user?.id)
          .eq('status', 'completed'),
        supabase
          .from('quests')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', user?.id)
      ]);

      setQuestStats({
        completed: completedRes.count || 0,
        created: createdRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading quest stats:', error);
    }
  };

  const handleToggle = async (key: string) => {
    const newValue = !toggleValues[key as keyof typeof toggleValues];
    setToggleValues(prev => ({
      ...prev,
      [key]: newValue,
    }));

    if (key === 'notifications') {
      Alert.alert(
        'Notifications',
        newValue ? 'Notifications enabled' : 'Notifications disabled',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => signOut()
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleSettingPress = (title: string) => {
    switch (title) {
      case 'Notifications':
        handleToggle('notifications');
        break;
      case 'Help & Support':
        handleHelpSupport();
        break;
      case 'Rate App':
        handleRateApp();
        break;
      case 'Share App':
        handleShareApp();
        break;
    }
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'Help & Support',
      'How can we help you?',
      [
        {
          text: 'Email Support',
          onPress: () => Linking.openURL('mailto:support@sidequests.app')
        },
        {
          text: 'FAQ',
          onPress: () => Alert.alert('FAQ', 'Coming soon!')
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate SideQuests',
      'Enjoying SideQuests? Please rate us on the App Store!',
      [
        {
          text: 'Rate Now',
          onPress: () => {
            Alert.alert('Thank you!', 'This would open the App Store in a real app.');
          }
        },
        { text: 'Maybe Later', style: 'cancel' },
      ]
    );
  };

  const handleShareApp = async () => {
    try {
      const message = 'Check out SideQuests - Turn everyday moments into epic adventures! 🎯';

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync('https://sidequests.app', {
          dialogTitle: 'Share SideQuests',
        });
      } else {
        Alert.alert(
          'Share SideQuests',
          message,
          [
            { text: 'Copy Link', onPress: () => Alert.alert('Link copied!') },
            { text: 'Close', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileSection}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AK</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {userProfile?.display_name || user?.user_metadata?.full_name || 'User'}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {questStats.completed >= 50 ? 'Quest Legend' :
                   questStats.completed >= 20 ? 'Quest Master' :
                   questStats.completed >= 5 ? 'Adventurer' : 'Novice'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
          <Text style={styles.editProfileText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{questStats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{questStats.created}</Text>
          <Text style={styles.statLabel}>Created</Text>
        </View>
      </View>
    </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsData.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.settingItem}
                onPress={() => handleSettingPress(item.title)}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.iconContainer}>
                    <item.icon size={20} color="#B8FF00" />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>{item.title}</Text>
                    <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                
                <View style={styles.settingRight}>
                  {item.hasToggle && (
                    <Switch
                      value={toggleValues[item.title.toLowerCase().replace(/\s/g, '') as keyof typeof toggleValues]}
                      onValueChange={() => handleToggle(item.title.toLowerCase().replace(/\s/g, ''))}
                      trackColor={{ false: '#333333', true: '#B8FF00' }}
                      thumbColor="#ffffff"
                    />
                  )}
                  {item.hasChevron && (
                    <ChevronRight size={16} color="#888888" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <LogOut size={20} color="#ff4757" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>SideQuests v1.0.0</Text>
          <Text style={styles.footerText}>Made with ❤️ for adventurers</Text>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#B8FF00',
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#333333',
    marginHorizontal: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#B8FF00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userEmail: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  badgeContainer: {
    marginTop: 6,
  },
  badge: {
    backgroundColor: '#B8FF00',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  editProfileButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B8FF00',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  settingRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff4757',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
  },
});