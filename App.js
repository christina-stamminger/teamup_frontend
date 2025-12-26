import { UserProvider } from "./srce/components/context/UserContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { toastConfig } from './srce/config/toastConfig';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { NetworkProvider } from "./srce/components/context/NetworkContext";
import OfflineBanner from "./srce/components/OfflineBanner";

import 'react-native-gesture-handler';
import AppRoot from "./AppRoot";


export default function App() {
  console.log('🔥 App component rendered');

  const navigationRef = useNavigationContainerRef();

 
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <NetworkProvider>
          <NavigationContainer ref={navigationRef}>
            <OfflineBanner />
            <AppRoot />
          </NavigationContainer>

          <Toast config={toastConfig} />
        </NetworkProvider>
      </UserProvider>
    </GestureHandlerRootView>
  );
}
