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

import AuthNavigator from './navigators/AuthNavigator'

// import {
//   Header,
//   LearnMoreLinks,
//   Colors,
//   DebugInstructions,
//   ReloadInstructions,
// } from 'react-native/Libraries/NewAppScreen';

import Icon from './components/Icon'
import Colors from './constants/Colors'

import { observer, Provider } from 'mobx-react/native'
import UserStore from './stores/userStore'
import ComponentStore from './stores/componentStore'

import FlashMessage from "react-native-flash-message";

// Firebase imports
import * as firebase from 'firebase'
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import firebaseConfig from './firebaseConfig'


import stripe from 'tipsi-stripe'

stripe.setOptions({
  publishableKey: 'pk_test_lojsrOCvzrsIiGQFXSUquLHX00pzpkST7r',
  // merchantId: 'MERCHANT_ID', // Optional
  androidPayMode: 'test', // Android only
})

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
    LogBox.ignoreLogs(['Setting a timer', 'Animated: `useNativeDriver`', 'Cannot update during an existing state transition'])
    this.state ={
      notificationVisible: false,
    }

  }


  render() {

      return (        
        <Provider {...stores}>
            <View style={{flex: 1}}>
              <AuthNavigator />
              <FlashMessage position="top" />
            </View>
        </Provider>
      )
    }
}

export default App;