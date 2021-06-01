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
                    model: DeviceInfo.getModel(),
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
                            this.setState({notificationAccess: false, tripsAndHostingAccess: false, discountsAndNewsAccess: false})
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
                            this.setState({notificationAccess: false, tripsAndHostingAccess: false, discountsAndNewsAccess: false})
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
            textInputProps={{autoCorrect:true, autoCapitalize: true}}
            dialogStyle={{position: 'absolute', top: 150}}
            message={"Type below the issue you are facing in the app."}
            hintInput ={"I discovered a bug that..."}
            submitInput={ (inputText) =>  this.reportIssue(inputText)}
            closeDialog={() => this.setState({reportIssueModalVisible: false})}
        />
      <View style={{flex: 1, justifyContent: 'space-between'}}>
        <View>
           
                <Text numberOfLines={1} style={{ fontSize: 14, marginTop: 16, paddingHorizontal: 16}}>Permissions</Text>
                <View style={styles.category}>
                <View style={styles.contentRow}>
                    <Text style={styles.contentLabel}>Camera</Text>
                    <Switch style={{transform: [{ scaleX: .8 }, { scaleY: .8 }] }} value={this.state.cameraAccess} onValueChange={() => this.changePermission("CAMERA", this.state.cameraAccess, "cameraAccess")}/>
                </View>
                <View style={styles.contentRow}>
                    <Text style={styles.contentLabel}>Camera Roll</Text>
                    <Switch style={{transform: [{ scaleX: .8 }, { scaleY: .8 }] }} value={this.state.cameraRollAccess} onValueChange={() => this.changePermission(Platform.OS ==='ios' ? "PHOTO_LIBRARY" : "WRITE_EXTERNAL_STORAGE", this.state.cameraRollAccess, "cameraRollAccess")}/>
                </View>
                <View style={styles.contentRow}>
                    <Text style={styles.contentLabel}>Location Services</Text>
                    <Switch style={{transform: [{ scaleX: .8 }, { scaleY: .8 }] }} value={this.state.locationAccess} onValueChange={() => this.changePermission(Platform.OS === 'ios' ? "LOCATION_WHEN_IN_USE" : "ACCESS_FINE_LOCATION", this.state.cameraAccess, "cameraAccess")}/>
                </View>
                {/* <View style={styles.contentRow}>
                    <Text style={styles.contentLabel}>Notifications</Text>
                    <Switch style={{transform: [{ scaleX: .8 }, { scaleY: .8 }] }} value={this.state.notificationAccess} onValueChange={() => this.changeNotificationPermissions(this.state.notificationAccess, "notificationAccess")}/>
                </View> */}
            </View>

            <Text numberOfLines={1} style={{ fontSize: 14, marginTop: 16, paddingHorizontal: 16}}>App Notifications</Text>
                <View style={styles.category}>
                    <View style={styles.contentRow}>
                        <Text type="SemiBold" style={[styles.contentLabel, {marginLeft: 12}]}>Notifications</Text>
                        <Switch style={{transform: [{ scaleX: .8 }, { scaleY: .8 }] }} value={this.state.notificationAccess} onValueChange={() => this.changeNotificationPermissions(this.state.notificationAccess, "notificationAccess")}/>
                    </View>
                    <View style={styles.contentRow}>
                        <Text style={this.state.notificationAccess ? styles.contentLabel : [styles.contentLabel, styles.disabledLabel]}>Trips and Hosting</Text>
                        <Switch style={{transform: [{ scaleX: .8 }, { scaleY: .8 }] }} value={this.state.tripsAndHostingAccess} disabled={!this.state.notificationAccess} onValueChange={() => this.changeNotificationPermissions(this.state.notificationAccess, "notificationAccess")}/>
                    </View>
                    <View style={styles.contentRow}>
                        <Text style={this.state.notificationAccess ? styles.contentLabel : [styles.contentLabel, styles.disabledLabel]}>Discounts & News</Text>
                        <Switch style={{transform: [{ scaleX: .8 }, { scaleY: .8 }] }} value={this.state.discountsAndNewsAccess} disabled={!this.state.notificationAccess} onValueChange={() => this.changeNotificationPermissions(this.state.notificationAccess, "notificationAccess")}/>
                    </View>
                </View>

           
            <TouchableOpacity style={styles.category} onPress={() => {
               this.setState({reportIssueModalVisible: true})
            }}>
                <View style={styles.contentRowNoIndent}>
                    <Text numberOfLines={1} style={{ fontSize: 14, paddingHorizontal: 16}}>Report Issue</Text>
                    <Icon 
                        iconName="chevron-right"
                        iconColor={Colors.cosmos500}
                        iconSize={24}       
                    />
                </View>
            </TouchableOpacity>


            <TouchableOpacity style={styles.category} onPress={() => {
               this.props.navigation.navigate("TOS")
            }}>
                <View style={styles.contentRowNoIndent}>
                    <Text numberOfLines={1} style={{ fontSize: 14, paddingHorizontal: 16}}>Terms of Service & Privacy Policy</Text>
                    <Icon 
                        iconName="chevron-right"
                        iconColor={Colors.cosmos500}
                        iconSize={24}        
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
    backgroundColor: Colors.mist500,
    
  },
  category:{
      backgroundColor: "white",
      paddingHorizontal: 16,
      marginTop: 8,
      paddingVertical: 8
  },
  contentRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 4,
    
  },
  contentLabel:{
      fontSize: 14,
      marginLeft: 24,
  },
  disabledLabel:{
      color: Colors.mist900
  },
  contentRowNoIndent:{
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 4,
  }
})

export default Settings;