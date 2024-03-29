import React from 'react'
import { Alert, Linking, Platform } from 'react-native'

import DeviceInfo from 'react-native-device-info'
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false
};

import { showMessage, hideMessage, renderFlashMessageIcon } from "react-native-flash-message";

// import * as firebase from 'firebase/app';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

//MobX Imports
import {inject, observer} from 'mobx-react'
import UserStore from '../../stores/userStore'
import ComponentStore from '../../stores/componentStore'

let notificationPermissions = async() => {
    const authorizationStatus = await messaging().requestPermission();

    if (authorizationStatus === messaging.AuthorizationStatus.AUTHORIZED) {
        return true;
    } else if (authorizationStatus === messaging.AuthorizationStatus.PROVISIONAL) {
        return true;
    } else {
        return false;
    }
}

export let disabledWarningAlert = () => {
    Alert.alert(
        'Warning',
        'You will be unable to see reminders and up to date information on your trips without push notifications. Please enable push notifications for Riive in your settings.',
        [
        { text: 'Cancel' },
        // If they said no initially and want to change their mind,
        // we can automatically open our app in their settings
        // so there's less friction in turning notifications on
        { text: 'Enable Notifications', onPress: () =>{
            Platform.OS === 'ios' ? Linking.openURL('app-settings:') : Linking.openSettings();
        }}
        ]
    )
}

export let getToken = async() => {
   let enabled = await notificationPermissions();
   let isEmulator = DeviceInfo.isEmulatorSync();

    try{
        if(enabled){
            if(isEmulator){
                throw "Push notifications are not working on emulators. Run the app on a physical device to see push notifications."
            }
            
            let tok = await messaging().getToken();
            // console.log(tok)
            return tok;
            
         
        }else{
            disabledWarningAlert();
            return null
        }
    }catch(e){ 
        console.warn(e)
        return null
    }
    
}



export let pushNotification = (title, body, onPress) => {
    ReactNativeHapticFeedback.trigger("notificationSuccess", options);
    return showMessage({
        titleStyle: {fontFamily: 'Poppins-SemiBold'},
        message: title,
        description: body,
        type: "default",
        onPress: onPress,
        duration: 3500,
      });
}