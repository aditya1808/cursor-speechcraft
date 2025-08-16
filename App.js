import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RecordingScreen from './src/screens/RecordingScreen';
import NotesListScreen from './src/screens/NotesListScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Recording"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#6366f1',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Recording" 
            component={RecordingScreen}
            options={{ 
              title: 'SpeechCraft',
              headerRight: () => null
            }}
          />
          <Stack.Screen 
            name="NotesList" 
            component={NotesListScreen}
            options={{ title: 'My Notes' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
