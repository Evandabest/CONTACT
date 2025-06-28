import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface PermissionStatus {
  location: 'granted' | 'denied' | 'prompt' | null;
  microphone: 'granted' | 'denied' | 'prompt' | null;
  camera: 'granted' | 'denied' | 'prompt' | null;
}

interface SettingsScreenProps {
  permissionStatus: PermissionStatus;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  permissionStatus, 
  onBack 
}) => {
  const openSettings = () => {
    Linking.openSettings().catch(() => {
      Alert.alert(
        'Cannot Open Settings',
        'Please manually open your device settings to manage permissions.',
        [{ text: 'OK' }]
      );
    });
  };

  const getPermissionIcon = (status: 'granted' | 'denied' | 'prompt' | null) => {
    switch (status) {
      case 'granted':
        return 'checkmark-circle';
      case 'denied':
        return 'close-circle';
      case 'prompt':
        return 'help-circle';
      default:
        return 'help-circle';
    }
  };

  const getPermissionColor = (status: 'granted' | 'denied' | 'prompt' | null) => {
    switch (status) {
      case 'granted':
        return '#10B981';
      case 'denied':
        return '#EF4444';
      case 'prompt':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getPermissionText = (status: 'granted' | 'denied' | 'prompt' | null) => {
    switch (status) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      case 'prompt':
        return 'Not Determined';
      default:
        return 'Unknown';
    }
  };

  const PermissionItem: React.FC<{
    title: string;
    description: string;
    icon: string;
    status: 'granted' | 'denied' | 'prompt' | null;
  }> = ({ title, description, icon, status }) => (
    <View style={styles.permissionItem}>
      <View style={styles.permissionHeader}>
        <View style={styles.permissionIconContainer}>
          <Ionicons name={icon as any} size={24} color="#3B82F6" />
        </View>
        <View style={styles.permissionText}>
          <Text style={styles.permissionTitle}>{title}</Text>
          <Text style={styles.permissionDescription}>{description}</Text>
        </View>
        <View style={styles.permissionStatus}>
          <Ionicons 
            name={getPermissionIcon(status)} 
            size={20} 
            color={getPermissionColor(status)} 
          />
          <Text style={[styles.permissionStatusText, { color: getPermissionColor(status) }]}>
            {getPermissionText(status)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#60A5FA', '#2563EB']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <Text style={styles.sectionSubtitle}>
            Manage app permissions and access settings
          </Text>
        </View>

        <View style={styles.permissionsContainer}>
          <PermissionItem
            title="Location"
            description="Access your location for weather information"
            icon="navigate"
            status={permissionStatus.location}
          />

          <PermissionItem
            title="Microphone"
            description="Record audio for voice commands"
            icon="mic"
            status={permissionStatus.microphone}
          />

          <PermissionItem
            title="Camera"
            description="Take photos and scan QR codes"
            icon="camera"
            status={permissionStatus.camera}
          />
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Device Settings</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
            <View style={styles.settingsButtonContent}>
              <Ionicons name="settings" size={24} color="#3B82F6" />
              <Text style={styles.settingsButtonText}>Open Device Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#BFDBFE" />
            <Text style={styles.infoText}>
              To change permissions, you need to go to your device settings. 
              Tap "Open Device Settings" above to go there directly.
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#BFDBFE',
  },
  permissionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  permissionItem: {
    marginBottom: 16,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#BFDBFE',
  },
  permissionStatus: {
    alignItems: 'center',
  },
  permissionStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  settingsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#BFDBFE',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
}); 