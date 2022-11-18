
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

 import React from 'react';
 import {
   ActivityIndicator,
   SafeAreaView,
   StyleSheet,
   ScrollView,
   View,
   Text,
   StatusBar,
   LogBox
 } from 'react-native';

 import { SafeAreaProvider,  initialWindowMetrics } from 'react-native-safe-area-context'
 
 import AppNavigator from './navigators/AppNavigator'

 import config from 'react-native-config';
 
 // import {
 //   Header,
 //   LearnMoreLinks,
 //   Colors,
 //   DebugInstructions,
 //   ReloadInstructions,
 // } from 'react-native/Libraries/NewAppScreen';
 
 import Icon from './components/Icon'
 import Colors from './constants/Colors'
 
 import { observer, Provider } from 'mobx-react'
 import UserStore from './stores/userStore'
 import ComponentStore from './stores/componentStore'
 
 import FlashMessage from "react-native-flash-message";
 
 // Firebase imports
 import firebase from '@react-native-firebase/app'
 import auth from '@react-native-firebase/auth';
 import firestore from '@react-native-firebase/firestore';
 import messaging from '@react-native-firebase/messaging';
 import firebaseConfig from './firebaseConfig'
 
 
 if (!firebase.apps.length) {
   // Initlialized FB Vars
   firebase.initializeApp(firebaseConfig);
 }
 
 
 const stores = {
   UserStore, ComponentStore
 }
 
 class App extends React.Component {
   constructor(props){
     super(props);
     LogBox.ignoreLogs(['Setting a timer', 'Animated: `useNativeDriver`', 'Cannot update during an existing state transition', "Require cycle:", 'Reanimated 2', 'new NativeEventEmitter', 'EventEmitter.removeListener', "Warning: Encountered two children with the same key"])
     this.state ={
       notificationVisible: false,
     }
 
   }
 
 
   render() {
      console.log(config)
       return (        
         <Provider {...stores}>
             
                  <AppNavigator />
                  <FlashMessage position="top" />
                  <SafeAreaView /> 
         </Provider>
       )
     }
 }
 
 export default App;