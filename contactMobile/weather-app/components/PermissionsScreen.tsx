import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface PermissionChoices {
  location: boolean;
  microphone: boolean;
  camera: boolean;
}

interface PermissionsScreenProps {
  onComplete: (choices: PermissionChoices) => void;
}

export const PermissionsScreen: React.FC<PermissionsScreenProps> = ({ onComplete }) => {
  const [choices, setChoices] = useState<PermissionChoices>({
    location: false,
    microphone: false,
    camera: false,
  });

  const handleChoiceChange = (permission: keyof PermissionChoices, value: boolean) => {
    setChoices(prev => ({
      ...prev,
      [permission]: value,
    }));
  };

  const handleContinue = () => {
    onComplete(choices);
  };

  const getPermissionIcon = (permission: keyof PermissionChoices) => {
    switch (permission) {
      case 'location':
        return 'navigate';
      case 'microphone':
        return 'mic';
      case 'camera':
        return 'camera';
      default:
        return 'help-circle';
    }
  };

  const getPermissionTitle = (permission: keyof PermissionChoices) => {
    switch (permission) {
      case 'location':
        return 'Location Access';
      case 'microphone':
        return 'Microphone Access';
      case 'camera':
        return 'Camera Access';
      default:
        return 'Permission';
    }
  };

  const getPermissionDescription = (permission: keyof PermissionChoices) => {
    switch (permission) {
      case 'location':
        return 'Get weather for your current location automatically';
      case 'microphone':
        return 'Record audio for voice commands and emergency features';
      case 'camera':
        return 'Take photos and scan QR codes for enhanced features';
      default:
        return 'This permission is needed for app functionality';
    }
  };

  const PermissionCard: React.FC<{
    permission: keyof PermissionChoices;
    title: string;
    description: string;
    icon: string;
    isSelected: boolean;
    onToggle: (value: boolean) => void;
  }> = ({ permission, title, description, icon, isSelected, onToggle }) => (
    <TouchableOpacity
      style={[styles.permissionCard, isSelected && styles.permissionCardSelected]}
      onPress={() => onToggle(!isSelected)}
      activeOpacity={0.7}
    >
      <View style={styles.permissionHeader}>
        <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
          <Ionicons 
            name={icon as any} 
            size={24} 
            color={isSelected ? '#FFFFFF' : '#3B82F6'} 
          />
        </View>
        <View style={styles.permissionText}>
          <Text style={styles.permissionTitle}>{title}</Text>
          <Text style={styles.permissionDescription}>{description}</Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#60A5FA', '#2563EB']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={48} color="#FFFFFF" style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Welcome to Weather App</Text>
          <Text style={styles.headerSubtitle}>
            We need your permission to provide the best experience
          </Text>
        </View>

        {/* Permissions List */}
        <View style={styles.permissionsContainer}>
          <PermissionCard
            permission="location"
            title={getPermissionTitle('location')}
            description={getPermissionDescription('location')}
            icon={getPermissionIcon('location')}
            isSelected={choices.location}
            onToggle={(value) => handleChoiceChange('location', value)}
          />

          <PermissionCard
            permission="microphone"
            title={getPermissionTitle('microphone')}
            description={getPermissionDescription('microphone')}
            icon={getPermissionIcon('microphone')}
            isSelected={choices.microphone}
            onToggle={(value) => handleChoiceChange('microphone', value)}
          />

          <PermissionCard
            permission="camera"
            title={getPermissionTitle('camera')}
            description={getPermissionDescription('camera')}
            icon={getPermissionIcon('camera')}
            isSelected={choices.camera}
            onToggle={(value) => handleChoiceChange('camera', value)}
          />
        </View>

        {/* Info Text */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={20} color="#BFDBFE" />
          <Text style={styles.infoText}>
            You can change these settings later in your device settings
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerIcon: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#BFDBFE',
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionsContainer: {
    flex: 1,
    gap: 16,
  },
  permissionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  permissionCardSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerSelected: {
    backgroundColor: '#3B82F6',
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#BFDBFE',
    lineHeight: 18,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#BFDBFE',
    marginLeft: 8,
    flex: 1,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 