import React from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, SafeAreaView, Linking, Alert } from 'react-native';
import Text from '../components/Txt'
import Input from '../components/Input'
import Icon from '../components/Icon'
import Button from '../components/Button'
import Colors from '../constants/Colors'

import { version } from '../package.json'

import {requestLocationAccuracy, checkMultiple, checkNotifications, requestNotifications, PERMISSIONS, openSettings, check, request} from 'react-native-permissions';
import { getToken, disabledWarningAlert } from '../functions/in-app/notifications'

import { Switch } from 'react-native-paper';

//MobX Imports
import {inject, observer} from 'mobx-react/native'

import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Dropdown from '../components/Dropdown';


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
                { text: 'Cancel' },
                // If they said no initially and want to change their mind,
                // we can automatically open our app in their settings
                // so there's less friction in turning notifications on
                { text: 'Manage Notifications', onPress: () =>{
                    Linking.openSettings();
                }}
            ])
          
        }
    }

    checkPermissionsStatus = async() => {
        try{
            if(Platform.OS === 'ios'){
                await checkMultiple(['ios.permission.LOCATION_WHEN_IN_USE', 'ios.permission.PHOTO_LIBRARY', 'ios.permission.CAMERA']).then(res => {
                    if(res['ios.permission.CAMERA'] === 'granted'){
                        this.setState({cameraAccess: true})
                    }else{
                        this.setState({cameraAccess: false})
                    }
    
                    if(res['ios.permission.PHOTO_LIBRARY'] === 'granted'){
                        this.setState({cameraRollAccess: true})
                    }else{
                        this.setState({cameraRollAccess: false})
                    }
    
                    if(res['ios.permission.LOCATION_WHEN_IN_USE'] === 'granted'){
                        this.setState({locationAccess: true})
                    }else{
                        this.setState({locationAccess: false})
                    }
    
                    checkNotifications().then(res => {
                        if(res.status === 'granted'){
                            this.setState({notificationAccess: true})
                        }else{
                            this.setState({notificationAccess: false})
                        }
                    })
    
                })
            }else{
                await checkMultiple(['android.permission.ACCESS_FINE_LOCATION', 'android.permission.CAMERA', 'android.permission.WRITE_EXTERNAL_STORAGE']).then(res => {
                    if(res['android.permission.CAMERA'] === 'granted'){
                        this.setState({cameraAccess: true})
                    }else{
                        this.setState({cameraAccess: false})
                    }
    
                    if(res['android.permission.WRITE_EXTERNAL_STORAGE'] === 'granted'){
                        this.setState({cameraRollAccess: true})
                    }else{
                        this.setState({cameraRollAccess: false})
                    }
    
                    if(res['android.permission.ACCESS_FINE_LOCATION'] === 'granted'){
                        this.setState({locationAccess: true})
                    }else{
                        this.setState({locationAccess: false})
                    }
    
    
                    checkNotifications().then(res => {
                        if(res.status === 'granted'){
                            this.setState({notificationAccess: true})
                        }else{
                            this.setState({notificationAccess: false})
                        }
                    })
                    
                })
            }
            
           }catch(e){
               alert(e)
           }
    }

    async componentDidMount(){
        this._isMounted = true;
        this._navListener = this.props.navigation.addListener('didFocus', () => {
         StatusBar.setBarStyle('dark-content', true);
         Platform.OS === 'android' && StatusBar.setBackgroundColor('white');
       });

       this.checkPermissionsStatus();
       
    }


    render(){
        return(
            // <View>
            //     <Text>{this.props.ComponentStore.selectedPayment[0].PaymentID}</Text>
            // </View>
      <ScrollView contentContainerStyle={styles.container}>
      <SafeAreaView style={{flex: 0}} />
      <View style={{flex: 1, justifyContent: 'space-between'}}>
        <View>
            <Text type="SemiBold" style={{ fontSize: 18}}>Permissions</Text>
            <View style={styles.contentRow}>
                <Text>Camera</Text>
                <Switch value={this.state.cameraAccess} onValueChange={() => this.changePermission("CAMERA", this.state.cameraAccess, "cameraAccess")}/>
            </View>
            <View style={styles.contentRow}>
                <Text>Camera Roll</Text>
                <Switch value={this.state.cameraRollAccess} onValueChange={() => this.changePermission(Platform.OS ==='ios' ? "PHOTO_LIBRARY" : "WRITE_EXTERNAL_STORAGE", this.state.cameraRollAccess, "cameraRollAccess")}/>
            </View>
            <View style={styles.contentRow}>
                <Text>Location Services</Text>
                <Switch value={this.state.locationAccess} onValueChange={() => this.changePermission(Platform.OS === 'ios' ? "LOCATION_WHEN_IN_USE" : "ACCESS_FINE_LOCATION", this.state.cameraAccess, "cameraAccess")}/>
            </View>
            <View style={styles.contentRow}>
                <Text>Notifications</Text>
                <Switch value={this.state.notificationAccess} onValueChange={() => this.changeNotificationPermissions(this.state.notificationAccess, "notificationAccess")}/>
            </View>
            
        </View>
        <Text style={{textAlign: 'center'}}>Riive Version {version}</Text>
      </View>
      
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container:{
    flex: 1, 
    backgroundColor: "white",
    paddingHorizontal: 16,
  },
  contentRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 4,
  }
})

export default Settings;