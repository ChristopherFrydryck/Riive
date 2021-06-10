import React from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, SafeAreaView, Linking, Alert, Dimensions, TouchableOpacity } from 'react-native';


import {requestLocationAccuracy, checkMultiple, checkNotifications, requestNotifications, PERMISSIONS, openSettings, check, request} from 'react-native-permissions';


//MobX Imports
import {inject, observer} from 'mobx-react/native'

import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';







   export let checkPermissionsStatus = async() => {

        let perms = {
          notifications: {
            notifications: null,
            tripsAndHosting: null,
            discountsAndNews: null,
          },
          cameraRoll: null,
          camera: null,
          locationServices: null,
        }
    
    
          const db = firestore();
          const doc = db.collection('users').doc(auth().currentUser.uid);
          await doc.get().then((doc) => {
            if (doc.exists){
                  perms.notifications.tripsAndHosting = doc.data().permissions.notifications.tripsAndHosting;
                  perms.notifications.discountsAndNews = doc.data().permissions.notifications.discountsAndNews;
            }else{
              alert("Failure to gather account permissions.")
              perms.notifications.tripsAndHosting = true;
              perms.notifications.discountsAndNews = false;
            }
            return perms
          }).then(async() => {
            if(Platform.OS === 'ios'){
              let res = await checkMultiple(['ios.permission.LOCATION_WHEN_IN_USE', 'ios.permission.PHOTO_LIBRARY', 'ios.permission.CAMERA'])
    
                  if(res['ios.permission.CAMERA'] === 'granted'){
                      // this.setState({cameraAccess: true})
                      perms.camera = true;
                  }else{
                      // this.setState({cameraAccess: false})
                      perms.camera = false;
                  }
    
                  if(res['ios.permission.PHOTO_LIBRARY'] === 'granted'){
                      // this.setState({cameraRollAccess: true})
                      perms.cameraRoll = true;
                  }else{
                      // this.setState({cameraRollAccess: false})
                      perms.cameraRoll = false;
                  }
    
                  if(res['ios.permission.LOCATION_WHEN_IN_USE'] === 'granted'){
                      // this.setState({locationAccess: true})
                      perms.locationServices = true;
                  }else{
                      // this.setState({locationAccess: false})
                      perms.locationServices = false;
                  }
    
                  return res
                  
               
                
        
            }else{
            
                let res = await checkMultiple(['android.permission.ACCESS_FINE_LOCATION', 'android.permission.CAMERA', 'android.permission.WRITE_EXTERNAL_STORAGE']);
    
                    if(res['android.permission.CAMERA'] === 'granted'){
                        // this.setState({cameraAccess: true})
                        perms.camera = true;
                    }else{
                        // this.setState({cameraAccess: false})
                        perms.camera = true;
                    }
    
                    if(res['android.permission.WRITE_EXTERNAL_STORAGE'] === 'granted'){
                        // this.setState({cameraRollAccess: true})
                        perms.cameraRoll = true;
                    }else{
                        // this.setState({cameraRollAccess: false})
                        perms.cameraRoll = true;
                    }
    
                    if(res['android.permission.ACCESS_FINE_LOCATION'] === 'granted'){
                        // this.setState({locationAccess: true})
                        perms.locationServices = true;
                    }else{
                        // this.setState({locationAccess: false})
                        perms.locationServices = false;
                    }
    
                    return res
            }
          }).then(async() => {
            let notifs = await checkNotifications();
                    
                  if(notifs.status === 'granted'){
                      // this.setState({notificationAccess: true})
                      perms.notifications.notifications = true;
                     
                  }else{
                      // this.setState({notificationAccess: false, tripsAndHostingAccess: false, discountsAndNewsAccess: false})
                      perms.notifications.notifications = false;
                      
                  }
    
                  
    
              return perms
          }).catch(e => {
            alert(e)
          })
           
          return perms
    }


    


