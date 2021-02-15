
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



// import {
//   Header,
//   LearnMoreLinks,
//   Colors,
//   DebugInstructions,
//   ReloadInstructions,
// } from 'react-native/Libraries/NewAppScreen';

import Icon from '../components/Icon'
import Colors from '../constants/Colors'

import { observer, inject } from 'mobx-react/native'
import UserStore from '../stores/userStore'
import ComponentStore from '../stores/componentStore'

// Firebase imports
import * as firebase from 'firebase'
import firebaseConfig from '../firebaseConfig'
import 'firebase/firestore';
import 'firebase/auth';



if (!firebase.apps.length) {
  // Initlialized FB Vars
  firebase.initializeApp(firebaseConfig);
}


const stores = {
  UserStore, ComponentStore
}

@inject("UserStore")
@observer
export default class App extends React.Component {
  constructor(props){
    super(props);
    LogBox.ignoreLogs(['Setting a timer'])
    this.state ={
      fontLoaded: false
    }
  }


  async componentDidMount(){
  
  }

  render() {

      return (
        <SafeAreaView>
          <Text style={{fontFamily: "Poppins-Regular"}}>Hello World</Text>
          <Icon 
                    iconName="parking"
                    iconLib="FontAwesome5"
                    iconColor={Colors.cosmos500}
                    iconSize={120}
                    style={{marginBottom: 32}}
                />
        </SafeAreaView>
        
    
      )
    }
}