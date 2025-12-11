import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Button, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';

export default function HomeScreen() {
  const { user, logout, isAuthenticated } = useAuth();
  const { familyMembers } = useFamily();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Home screen: User is authenticated');
      console.log('User data:', {
        id: user.id,
        email: user.email,
        username: user.preferred_username,
        name: user.name,
      });
    }
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
      </ThemedView>
      {user && (
        <ThemedView style={styles.userContainer}>
          <ThemedText type="subtitle">Signed in as:</ThemedText>
          <ThemedText>{user.email || user.preferred_username || user.name || 'User'}</ThemedText>
          <View style={styles.logoutButton}>
            <Button title="Sign Out" onPress={handleLogout} color="#888" />
          </View>
        </ThemedView>
      )}

      <ThemedView style={styles.familyContainer}>
        <View style={styles.familyHeader}>
          <ThemedText type="subtitle">Family Members</ThemedText>
          <TouchableOpacity onPress={() => router.push('/(tabs)/family')}>
            <ThemedText style={styles.manageLink}>Manage</ThemedText>
          </TouchableOpacity>
        </View>
        {familyMembers.length > 0 ? (
          <FlatList
            data={familyMembers}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ThemedView style={styles.familyCard}>
                <ThemedText type="defaultSemiBold" style={styles.familyName}>
                  {item.name}
                </ThemedText>
                <ThemedText style={styles.familyRelationship}>{item.relationship}</ThemedText>
                {item.age && <ThemedText style={styles.familyAge}>Age: {item.age}</ThemedText>}
              </ThemedView>
            )}
            contentContainerStyle={styles.familyList}
          />
        ) : (
          <ThemedView style={styles.emptyFamily}>
            <ThemedText style={styles.emptyFamilyText}>No family members yet</ThemedText>
            <Button
              title="Add Family Member"
              onPress={() => router.push('/(tabs)/family')}
            />
          </ThemedView>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userContainer: {
    gap: 8,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  logoutButton: {
    marginTop: 8,
  },
  familyContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  familyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  manageLink: {
    color: '#888',
    fontWeight: '600',
  },
  familyList: {
    gap: 12,
  },
  familyCard: {
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    minWidth: 120,
  },
  familyName: {
    fontSize: 16,
    marginBottom: 4,
  },
  familyRelationship: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  familyAge: {
    fontSize: 11,
    opacity: 0.6,
  },
  emptyFamily: {
    padding: 20,
    alignItems: 'center',
  },
  emptyFamilyText: {
    marginBottom: 12,
    opacity: 0.7,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
