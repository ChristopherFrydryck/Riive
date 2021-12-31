import React from 'react'
import { ActivityIndicator, StyleSheet, StatusBar, Platform, View, ScrollView, SafeAreaView, Dimensions, Image, Alert, LogBox} from 'react-native';
import {requestLocationAccuracy, check ,PERMISSIONS, openSettings, checkMultiple, checkNotifications} from 'react-native-permissions';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import Text from '../../components/Txt'
import Icon from '../../components/Icon'
import Colors from '../../constants/Colors'
import Input from '../../components/Input'
import Button from '../../components/Button'
import FloatingCircles from '../../components/FloatingCircles'
import { checkPermissionsStatus } from '../../functions/in-app/permissions'

import config from 'react-native-config'
import { version } from '../../package.json'

import logo from '../../assets/img/Logo_001.png'

// Firebase
import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import 'firebase/firestore';
import 'firebase/auth';

//MobX Imports
import { inject, observer } from 'mobx-react'
import UserStore from '../../stores/userStore'
import ComponentStore from '../../stores/componentStore'

@inject("UserStore")
@observer
export default class PasswordReset extends React.Component {
  constructor(){
    super();   
    

    this.state = {
      // Errors that may show if firebase catches them.
      sendingEmail: false,
      emailError: '',
    }
  }

    // Resets the password of the state with email
    resetPassword = () => {
      this.setState({sendingEmail: true})
      auth().sendPasswordResetEmail(this.props.UserStore.email || " ").then(() => {
          this.setState({sendingEmail: false})
          Alert.alert(
              'Reset Email Sent',
              'Check your email for a password reset email. If you did not recieve it, try again.',
              [
                  { text: 'Return To Sign In', onPress: () => this.props.navigation.navigate("Auth")},
              ]
          )
        }).catch((error) => {
          let errorMessage = error.message.split("] ")[1]
          this.setState({emailError: errorMessage, sendingEmail: false})
      });
    }

    render(){
      return(
        <ScrollView style={{backgroundColor: 'white'}} contentContainerStyle={{flex: 1, justifyContent: 'center'}}>
          <View style={styles.primaryView}>
            <Image source={logo} style={styles.img}/>
            <Input 
              placeholder='Enter email...'
              label="Email"
              name="email"
              onChangeText = {(email) => this.props.UserStore.email = email}
              value={this.props.UserStore.email}
              keyboardType='email-address'
              maxLength = {55} 
              error={this.state.emailError}
              />
              <Button style={{backgroundColor: "#FF8708"}} textStyle={{color:"#FFFFFF"}} onPress={() => this.resetPassword()}>{this.state.sendingEmail ? null : "Send Password Reset"}</Button>
          </View>
        </ScrollView>
      )
    }

}

const styles = StyleSheet.create({
  primaryView:{
    flexGrow: 0,
    // backgroundColor: 'orange',
    overflow: 'visible',
    paddingHorizontal: 24,
    paddingBottom: 80
  },
  img:{
    width: 150,
    resizeMode: 'contain',
    alignSelf: 'center'
  },
  form: {
    // flexGrow: 1,
    // backgroundColor: 'green'
  },
  hyperlink: {
    color: Colors.apollo500,
    textDecorationLine: 'underline',
    fontSize: 12,
  }
});