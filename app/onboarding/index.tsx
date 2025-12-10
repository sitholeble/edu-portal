import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFamily } from '@/contexts/FamilyContext';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const { addFamilyMember, familyMembers } = useFamily();
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [age, setAge] = useState('');

  const steps = [
    {
      title: 'Welcome to Edu Portal!',
      description: 'Let\'s set up your family profile to get started.',
      component: (
        <View style={styles.stepContent}>
          <ThemedText style={styles.description}>
            We'll help you manage your family's educational activities and calendar in one place.
          </ThemedText>
        </View>
      ),
    },
    {
      title: 'Add Family Members',
      description: 'Add the family members you want to manage.',
      component: (
        <View style={styles.stepContent}>
          <ThemedText style={styles.label}>Name</ThemedText>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter name"
            placeholderTextColor="#999"
          />
          <ThemedText style={styles.label}>Relationship</ThemedText>
          <TextInput
            style={styles.input}
            value={relationship}
            onChangeText={setRelationship}
            placeholder="e.g., Child, Spouse, Parent"
            placeholderTextColor="#999"
          />
          <ThemedText style={styles.label}>Age (optional)</ThemedText>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Enter age"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Button
            title="Add Member"
            onPress={async () => {
              if (name && relationship) {
                await addFamilyMember({
                  name,
                  relationship,
                  age: age ? parseInt(age, 10) : undefined,
                });
                setName('');
                setRelationship('');
                setAge('');
              }
            }}
            disabled={!name || !relationship}
          />
          {familyMembers.length > 0 && (
            <View style={styles.membersList}>
              <ThemedText type="subtitle" style={styles.membersTitle}>
                Family Members ({familyMembers.length})
              </ThemedText>
              {familyMembers.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <ThemedText>{member.name}</ThemedText>
                  <ThemedText style={styles.memberRelationship}>{member.relationship}</ThemedText>
                  {member.age && <ThemedText style={styles.memberAge}>Age: {member.age}</ThemedText>}
                </View>
              ))}
            </View>
          )}
        </View>
      ),
    },
    {
      title: 'You\'re All Set!',
      description: 'Your family profile is ready. Let\'s start managing your calendar.',
      component: (
        <View style={styles.stepContent}>
          <ThemedText style={styles.description}>
            You can always add more family members or update your profile later.
          </ThemedText>
        </View>
      ),
    },
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      await completeOnboarding();
      router.replace('/(tabs)');
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const currentStepData = steps[currentStep];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {currentStepData.title}
          </ThemedText>
          <ThemedText style={styles.subtitle}>{currentStepData.description}</ThemedText>
        </View>

        <View style={styles.content}>{currentStepData.component}</View>

        <View style={styles.progress}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep && styles.progressDotActive,
                index < currentStep && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 0 && (
          <Button title="Back" onPress={() => setCurrentStep(currentStep - 1)} />
        )}
        <View style={styles.buttonSpacer} />
        <Button title="Skip" onPress={handleSkip} color="#999" />
        <View style={styles.buttonSpacer} />
        <Button
          title={currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          disabled={currentStep === 1 && familyMembers.length === 0}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    gap: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  membersList: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  membersTitle: {
    marginBottom: 12,
  },
  memberItem: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  memberRelationship: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  memberAge: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    marginBottom: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  progressDotActive: {
    backgroundColor: '#007AFF',
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: '#34C759',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  buttonSpacer: {
    width: 8,
  },
});

