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
import { checkPermissionsStatus } from '../functions/in-app/permissions'

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
            locationAccess: this.props.UserStore.permissions.locationServices,
            cameraAccess: this.props.UserStore.permissions.camera,
            cameraRollAccess: this.props.UserStore.permissions.cameraRoll,
            notificationAccess: this.props.UserStore.permissions.notifications.notifications,
            reportIssueModalVisible: false,
            tripsAndHosting: this.props.UserStore.permissions.notifications.tripsAndHosting,
            discountsAndNews: this.props.UserStore.permissions.notifications.discountsAndNews,

        }
    }

    changePermission = (permissionName, currentStatus, stateName) => {

        // console.log(`Permission name: ${permissionName}, currentStatus: ${currentStatus}, stateName: ${stateName}`)

        if(currentStatus === false){
            request(`${Platform.OS}.permission.${permissionName}`).then(res => {
                if(res === 'granted'){
                    this.setState({[stateName]: true})
                }else if(res === 'blocked'){
                    this.setState({[stateName]: false})
                    Linking.openSettings();
                }
            })
        }else{
            Linking.openSettings();
        }

        this.forceUpdate();
    }

    changeNotificationPermissions = async(currentStatus, stateName) => {
        if(stateName === "notificationAccess"){
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
        }else{
            let db = firestore()
            const doc = db.collection('users').doc(auth().currentUser.uid);
            
                let pathName = `permissions.notifications.${stateName}`
                if(currentStatus === false){
                    this.setState({[stateName]: true})
                    
                    doc.update({[pathName]: true })
                }else{
                    this.setState({[stateName]: false})
                    doc.update({[pathName]: false })
                }
            
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


    setPermissions = () => {
        checkPermissionsStatus().then(res => {
          this.props.UserStore.permissions = res;
        }).then(() => {
            this.setState({
                locationAccess: this.props.UserStore.permissions.locationServices,
                cameraAccess: this.props.UserStore.permissions.camera,
                cameraRollAccess: this.props.UserStore.permissions.cameraRoll,
                notificationAccess: this.props.UserStore.permissions.notifications.notifications,
                tripsAndHosting: this.props.UserStore.permissions.notifications.tripsAndHosting,
                discountsAndNews: this.props.UserStore.permissions.notifications.discountsAndNews,
            })
        })
      
      }

    async componentDidMount(){
        this._isMounted = true;
        this._navListener = this.props.navigation.addListener('didFocus', () => {
         StatusBar.setBarStyle('dark-content', true);
         Platform.OS === 'android' && StatusBar.setBackgroundColor('white');
         console.log("MOUNTED")
         this.setPermissions();
   
       });


      
         
       
    }

    componentDidUpdate(prevProps, prevState){
        if(prevState.locationAccess !== this.state.locationAccess || prevState.cameraAccess !== this.state.cameraAccess || prevState.cameraRollAccess !== this.state.cameraRollAccess || prevState.notificationAccess !== this.state.notificationAccess || prevState.tripsAndHosting !== this.state.tripsAndHosting || prevState.discountsAndNews !== this.state.discountsAndNews){
            console.log("CHANGED")
            this.setPermissions();
        }
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
            textInputProps={{autoCorrect:true}}
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
                    <Switch style={{transform: [{ scaleX: .8 }, { scaleY: .8 }] }} value={this.state.locationAccess} onValueChange={() => this.changePermission(Platform.OS === 'ios' ? "LOCATION_WHEN_IN_USE" : "ACCESS_FINE_LOCATION", this.state.locationAccess, "locationAccess")}/>
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
                        <Switch style={{transform: [{ scaleX: .8 }, { scaleY: .8 }] }} value={this.state.notificationAccess ? this.state.tripsAndHosting : false} disabled={true} onValueChange={() => this.changeNotificationPermissions(this.state.tripsAndHosting, "tripsAndHosting")}/>
                    </View>
                    <View style={styles.contentRow}>
                        <Text style={this.state.notificationAccess ? styles.contentLabel : [styles.contentLabel, styles.disabledLabel]}>Discounts & News</Text>
                        <Switch style={{transform: [{ scaleX: .8 }, { scaleY: .8 }] }} value={this.state.notificationAccess ? this.state.discountsAndNews : false} disabled={!this.state.notificationAccess} onValueChange={() => this.changeNotificationPermissions(this.state.discountsAndNews, "discountsAndNews")}/>
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