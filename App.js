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
              backgroundColor: '#8b5cf6',
              elevation: 10,
              shadowOpacity: 0.4,
              shadowRadius: 16,
              shadowColor: '#8b5cf6',
              shadowOffset: { width: 0, height: 6 },
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: '600',
              fontSize: 20,
            },
            cardStyleInterpolator: ({ current, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                      }),
                    },
                  ],
                  opacity: current.progress.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.5, 1],
                  }),
                },
              };
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
