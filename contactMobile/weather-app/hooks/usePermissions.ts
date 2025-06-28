import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PermissionStatus {
  location: 'granted' | 'denied' | 'prompt' | null;
  microphone: 'granted' | 'denied' | 'prompt' | null;
  camera: 'granted' | 'denied' | 'prompt' | null;
}

interface PermissionChoices {
  location: boolean;
  microphone: boolean;
  camera: boolean;
}

const PERMISSION_STORAGE_KEY = '@weather_app_permissions';

export const usePermissions = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({
    location: null,
    microphone: null,
    camera: null,
  });
  const [permissionChoices, setPermissionChoices] = useState<PermissionChoices>({
    location: false,
    microphone: false,
    camera: false,
  });
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved permission choices from AsyncStorage
  useEffect(() => {
    loadPermissionChoices();
  }, []);

  const loadPermissionChoices = async () => {
    try {
      console.log('🔄 Loading permission choices from AsyncStorage...');
      const savedChoices = await AsyncStorage.getItem(PERMISSION_STORAGE_KEY);
      if (savedChoices) {
        console.log('✅ Found saved permission choices:', savedChoices);
        const choices = JSON.parse(savedChoices);
        setPermissionChoices(choices);
        setIsFirstLaunch(false);
        
        // Apply saved choices
        await applySavedPermissions(choices);
      } else {
        console.log('🆕 No saved permission choices found, first launch');
        setIsFirstLaunch(true);
      }
    } catch (error) {
      console.error('❌ Error loading permission choices:', error);
      setIsFirstLaunch(true);
    } finally {
      console.log('🏁 Finished loading permissions, setting isLoading to false');
      setIsLoading(false);
    }
  };

  const applySavedPermissions = async (choices: PermissionChoices) => {
    console.log('🔧 Applying saved permissions:', choices);
    const newStatus = { ...permissionStatus };

    if (choices.location) {
      try {
        const locationStatus = await Location.getForegroundPermissionsAsync();
        newStatus.location = locationStatus.status === 'granted' ? 'granted' : 'denied';
        console.log('📍 Location permission status:', newStatus.location);
      } catch (error) {
        console.error('❌ Error checking location permission:', error);
        newStatus.location = 'denied';
      }
    } else {
      newStatus.location = 'denied';
    }

    if (choices.microphone) {
      try {
        const audioStatus = await Audio.getPermissionsAsync();
        newStatus.microphone = audioStatus.status === 'granted' ? 'granted' : 'denied';
        console.log('🎤 Microphone permission status:', newStatus.microphone);
      } catch (error) {
        console.error('❌ Error checking microphone permission:', error);
        newStatus.microphone = 'denied';
      }
    } else {
      newStatus.microphone = 'denied';
    }

    if (choices.camera) {
      try {
        const cameraStatus = await Camera.getCameraPermissionsAsync();
        newStatus.camera = cameraStatus.status === 'granted' ? 'granted' : 'denied';
        console.log('📷 Camera permission status:', newStatus.camera);
      } catch (error) {
        console.error('❌ Error checking camera permission:', error);
        newStatus.camera = 'denied';
      }
    } else {
      newStatus.camera = 'denied';
    }

    console.log('✅ Final permission status:', newStatus);
    setPermissionStatus(newStatus);
  };

  const savePermissionChoices = async (choices: PermissionChoices) => {
    try {
      await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify(choices));
      setPermissionChoices(choices);
      setIsFirstLaunch(false);
      
      // Apply the new choices
      await applySavedPermissions(choices);
    } catch (error) {
      console.error('Error saving permission choices:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const newStatus = status === 'granted' ? 'granted' : 'denied';
      setPermissionStatus(prev => ({ ...prev, location: newStatus }));
      return newStatus;
    } catch (error) {
      setPermissionStatus(prev => ({ ...prev, location: 'denied' }));
      return 'denied';
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      const newStatus = status === 'granted' ? 'granted' : 'denied';
      setPermissionStatus(prev => ({ ...prev, microphone: newStatus }));
      return newStatus;
    } catch (error) {
      setPermissionStatus(prev => ({ ...prev, microphone: 'denied' }));
      return 'denied';
    }
  };

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const newStatus = status === 'granted' ? 'granted' : 'denied';
      setPermissionStatus(prev => ({ ...prev, camera: newStatus }));
      return newStatus;
    } catch (error) {
      setPermissionStatus(prev => ({ ...prev, camera: 'denied' }));
      return 'denied';
    }
  };

  const checkCurrentPermissions = async () => {
    const newStatus = { ...permissionStatus };

    try {
      const locationStatus = await Location.getForegroundPermissionsAsync();
      newStatus.location = locationStatus.status === 'granted' ? 'granted' : 'denied';
    } catch (error) {
      newStatus.location = 'denied';
    }

    try {
      const audioStatus = await Audio.getPermissionsAsync();
      newStatus.microphone = audioStatus.status === 'granted' ? 'granted' : 'denied';
    } catch (error) {
      newStatus.microphone = 'denied';
    }

    try {
      const cameraStatus = await Camera.getCameraPermissionsAsync();
      newStatus.camera = cameraStatus.status === 'granted' ? 'granted' : 'denied';
    } catch (error) {
      newStatus.camera = 'denied';
    }

    setPermissionStatus(newStatus);
  };

  return {
    permissionStatus,
    permissionChoices,
    isFirstLaunch,
    isLoading,
    savePermissionChoices,
    requestLocationPermission,
    requestMicrophonePermission,
    requestCameraPermission,
    checkCurrentPermissions,
  };
}; 