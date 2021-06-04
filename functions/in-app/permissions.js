import React from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, SafeAreaView, Linking, Alert, Dimensions, TouchableOpacity } from 'react-native';
import Text from '../components/Txt'
import Input from '../components/Input'
import Icon from '../components/Icon'
import Button from '../components/Button'
import Colors from '../constants/Colors'

import { version } from '../package.json'

import {requestLocationAccuracy, checkMultiple, checkNotifications, requestNotifications, PERMISSIONS, openSettings, check, request} from 'react-native-permissions';
import { getToken, disabledWarningAlert } from '../functions/in-app/notifications'

import { Switch } from 'react-native-paper';
import DialogInput from 'react-native-dialog-input';
import DeviceInfo from 'react-native-device-info'

//MobX Imports
import {inject, observer} from 'mobx-react/native'

import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';



@inject("UserStore", "ComponentStore")
@observer
class Settings extends React.Component{
    _isMounted = false;

    constructor(props){
        super(props);

        this.state = {
            locationAccess: false,
            cameraAccess: false,
            cameraRollAccess: false,
            notificationAccess: false,
            reportIssueModalVisible: false,
            tripsAndHostingAccess: false,
            discountsAndNewsAccess: false,

        }
    }

    changePermission = (permissionName, currentStatus, stateName) => {

        if(currentStatus === false){
            request(`${Platform.OS}.permission.${permissionName}`).then(res => {
                
                if(res === 'granted'){
                    
                    this.setState({[stateName]: true})
                }else if(res === 'blocked'){
                    Linking.openSettings();
                }
            })
        }else{
            Linking.openSettings();
        }

        this.forceUpdate();
    }

    changeNotificationPermissions = async(currentStatus, stateName) => {
        if(currentStatus === false){
            requestNotifications(['alert', 'sound']).then(async({status, settings}) => {
                if(status === 'granted'){
                    await getToken().then(tok => {
                        if(!this.props.UserStore.pushTokens.includes(tok)){
                          try{
                              firestore().collection("users").doc(this.props.UserStore.userID).update({
                                  pushTokens: firestore.FieldValue.arrayUnion(tok)
                              })
                              this.props.UserStore.pushTokens.push(tok);
                          }catch(e){
                              alert(e)
                          }
                        }
                        return tok
                    }).then(() => {
                        this.setState({[stateName]: true})
                    })
                }else{
                    Linking.openSettings();
                }
            })
            
        }else{
            await Alert.alert('Warning',
            'You will be unable to see reminders and up to date information on your trips without push notifications.',
            [
                { text: 'Manage Notifications', onPress: () =>{
                    Linking.openSettings();
                }},
                { text: 'Cancel' }
                // If they said no initially and want to change their mind,
                // we can automatically open our app in their settings
                // so there's less friction in turning notifications on
                
            ])
          
        }
    }


    checkPermissionsStatus = async() => {
        let {permissions} = this.props.UserStore
        try{
            if(Platform.OS === 'ios'){
                await checkMultiple(['ios.permission.LOCATION_WHEN_IN_USE', 'ios.permission.PHOTO_LIBRARY', 'ios.permission.CAMERA']).then(res => {
                    if(res['ios.permission.CAMERA'] === 'granted'){
                        this.setState({cameraAccess: true})
                        permissions.camera = true;
                    }else{
                        this.setState({cameraAccess: false})
                        permissions.camera = false;
                    }
    
                    if(res['ios.permission.PHOTO_LIBRARY'] === 'granted'){
                        this.setState({cameraRollAccess: true})
                        permissions.cameraRoll = true;
                    }else{
                        this.setState({cameraRollAccess: false})
                        permissions.cameraRoll = false;
                    }
    
                    if(res['ios.permission.LOCATION_WHEN_IN_USE'] === 'granted'){
                        this.setState({locationAccess: true})
                        permissions.locationServices = true;
                    }else{
                        this.setState({locationAccess: false})
                        permissions.locationServices = false;
                    }
    
                    checkNotifications().then(res => {
                        if(res.status === 'granted'){
                            this.setState({notificationAccess: true})
                            permissions.notifications.notifications = true;

                            if(permissions.notifications.tripsAndHosting){
                                this.setState({tripsAndHostingAccess: true})
                             }else{
                                this.setState({tripsAndHostingAccess: false})
                             }

                             if(permissions.notifications.discountsAndNews){
                                this.setState({discountsAndNewsAccess: true})
                             }else{
                                this.setState({discountsAndNewsAccess: false})
                             }
                        }else{
                            this.setState({notificationAccess: false, tripsAndHostingAccess: false, discountsAndNewsAccess: false})
                            permissions.notifications.notifications = false;
                        }
                    })

                    
                    



                    console.log(permissions)
    
                })
            }else{
                await checkMultiple(['android.permission.ACCESS_FINE_LOCATION', 'android.permission.CAMERA', 'android.permission.WRITE_EXTERNAL_STORAGE']).then(res => {
                    if(res['android.permission.CAMERA'] === 'granted'){
                        this.setState({cameraAccess: true})
                        permissions.camera = true;
                    }else{
                        this.setState({cameraAccess: false})
                        permissions.camera = true;
                    }
    
                    if(res['android.permission.WRITE_EXTERNAL_STORAGE'] === 'granted'){
                        this.setState({cameraRollAccess: true})
                        permissions.cameraRoll = true;
                    }else{
                        this.setState({cameraRollAccess: false})
                        permissions.cameraRoll = true;
                    }
    
                    if(res['android.permission.ACCESS_FINE_LOCATION'] === 'granted'){
                        this.setState({locationAccess: true})
                        permissions.locationServices = true;
                    }else{
                        this.setState({locationAccess: false})
                        permissions.locationServices = false;
                    }
    
    
                    checkNotifications().then(res => {
                        if(res.status === 'granted'){
                            this.setState({notificationAccess: true})
                            permissions.notifications.notifications = true;

                            if(permissions.notifications.tripsAndHosting){
                                this.setState({tripsAndHostingAccess: true})
                             }else{
                                this.setState({tripsAndHostingAccess: false})
                             }

                             if(permissions.notifications.discountsAndNews){
                                this.setState({discountsAndNewsAccess: true})
                             }else{
                                this.setState({discountsAndNewsAccess: false})
                             }
                        }else{
                            this.setState({notificationAccess: false, tripsAndHostingAccess: false, discountsAndNewsAccess: false})
                            permissions.notifications.notifications = false;
                        }
                    })
                    
                })
            }
            
           }catch(e){
               alert(e)
           }
    }


    
})

export default Settings;