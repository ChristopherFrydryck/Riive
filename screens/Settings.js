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

    reportIssue = async ( reportText ) => {

    //    console.log(DeviceInfo.getDevice())
    let ipAddr = null;
    let macAddr = null;

    await DeviceInfo.getIpAddress().then((res) => {
        ipAddr = res
    })

    await DeviceInfo.getMacAddress().then((res) => {
        macAddr = res
    })






        if(!reportText || reportText.replace(/\s/g,"") == ""){
            this.setState({reportIssueModalVisible: false})
            Alert.alert(
                "Failed to submit issue",
                "Try inputting valid text into the report text input."
            )
        }else{
         let db = firestore()
         let reportRef = db.collection("reports").doc().id
         let userRef = db.collection("users").doc(this.props.UserStore.userID).id

         let createdTime = new Date().getTime();
         


         try{
            db.collection("reports").doc(reportRef).set({
                reportType: "APP_ISSUE",
                reportID: reportRef,
                reportText: reportText,
                userReport: this.props.UserStore.userID,
                reportDate: createdTime,
                resolved: false,
                resolvedTime: null,
                resolvedBy: null,
                buildDetails:{
                    appName: DeviceInfo.getApplicationName(),
                    bundleID: DeviceInfo.getBundleId(),
                    version: version,
                    deviceOS: Platform.OS,
                    brand: DeviceInfo.getBrand(),
                    buildNumber: DeviceInfo.getBuildNumber(),
                    osVersion: DeviceInfo.getSystemVersion(),
                    ipAddress: ipAddr,
                    macAddress: macAddr 
                },
            }).then(() => {
                db.collection("users").doc(userRef).collection('reports').doc(reportRef).set({
                    reportType: "APP_ISSUE",
                    reportID: reportRef,
                    reportDate: createdTime,
                })
            }).then(() => alert("Thank you for reporting an issue. We will solve it as soon as possible."))
         }catch(e){
             console.log(e)
         }

         this.setState({reportIssueModalVisible: false})
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
      <SafeAreaView />
        <DialogInput 
            isDialogVisible={this.state.reportIssueModalVisible}
            title={"Report an Issue"}
            message={"Type below the issue you are facing in the app."}
            hintInput ={"I discovered a bug that..."}
            submitInput={ (inputText) =>  this.reportIssue(inputText)}
            closeDialog={() => this.setState({reportIssueModalVisible: false})}
        />
      <View style={{flex: 1, justifyContent: 'space-between'}}>
        <View>
            <Text type="SemiBold" style={{ fontSize: 18, marginTop: 16, marginBottom: 8}}>Permissions</Text>
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

            <TouchableOpacity style={{marginTop: 16}} onPress={() => {
               this.setState({reportIssueModalVisible: true})
            }}>
                <View style={styles.contentRowNoIndent}>
                    <Text numberOfLines={1} type="SemiBold" style={{ fontSize: 18}}>Report Issue</Text>
                    <Icon 
                        iconName="chevron-right"
                        iconColor={Colors.cosmos500}
                        iconSize={28}       
                    />
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={{marginTop: 16}} onPress={() => {
               this.props.navigation.navigate("TOS")
            }}>
                <View style={styles.contentRowNoIndent}>
                    <Text numberOfLines={1} type="SemiBold" style={{ fontSize: 18}}>Terms of Service & Privacy Policy</Text>
                    <Icon 
                        iconName="chevron-right"
                        iconColor={Colors.cosmos500}
                        iconSize={28}        
                    />
                </View>
            </TouchableOpacity>           
        </View>
        <Text style={{textAlign: 'center', fontSize: 12, paddingBottom: 8}}>Version {version}</Text>
      </View>
      
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container:{
    minHeight: '100%',
    backgroundColor: "white",
    paddingHorizontal: 16,
  },
  contentRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 4,
    marginLeft: 16
  },
  contentRowNoIndent:{
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 4,
  }
})

export default Settings;