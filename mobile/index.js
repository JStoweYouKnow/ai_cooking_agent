// Entry point wrapper for Expo
// This ensures Expo can find the App component
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
