/**
 * SomoAI Mobile App
 *
 * Root application component with Redux and Navigation setup
 */

import React from 'react';
import {StatusBar} from 'react-native';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {store, persistor} from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import {Colors} from './src/constants/theme';

/**
 * Main App Component
 */
export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.background}
        />
        <RootNavigator />
      </PersistGate>
    </Provider>
  );
}
