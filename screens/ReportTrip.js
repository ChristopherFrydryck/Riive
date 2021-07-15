import React, { Component } from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, SafeAreaView, Dimensions, KeyboardAvoidingView, FlatList, Switch, Modal, Picker, LogBox, Alert, Linking} from 'react-native';

import Text from '../components/Txt'
import Icon from '../components/Icon'
import Input from '../components/Input'
import Button from '../components/Button'
import Colors from '../constants/Colors'
import Dropdown from '../components/Dropdown'
import DropdownItem from '../components/DropdownItem'
import { version } from '../package.json'

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DeviceInfo from 'react-native-device-info'

import firestore from '@react-native-firebase/firestore';

//MobX Imports
import {inject, observer} from 'mobx-react/native'


@inject("UserStore", "ComponentStore")
@observer
export default class ReportTrip extends Component{
   array = [
        {
            index: 0,
            label: "I am being scammed",
            baseValue: "SPACE_ISSUE"
        },
        {
            index: 1,
            label: "The host was offensive",
            baseValue: "HOST_ISSUE"
        },
        {
            index: 2,
            label: "Something else",
            baseValue: "OTHER_ISSUE"
        },
    ]

   constructor(props){
        super(props);
        this.state = {
           reportReason: this.array[0],
           reportText: "",
           reportTextError: "",

           listing: this.props.navigation.state.params.listing,
           visit: this.props.navigation.state.params.visit,
            
        }
   }

   componentDidMount(){
        // Set Status Bar page info here!
    this._navListener = this.props.navigation.addListener('didFocus', () => {
            StatusBar.setBarStyle('dark-content', true);
            Platform.OS === 'android' && StatusBar.setBackgroundColor('white');   

        });



        this.props.navigation.setParams({
            title: "Report Trip",
          });
        

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
                this.setState({reportTextError: "Please add more details before reporting an issue."})
                
            }else{
            this.setState({reportTextError: ""})
             let db = firestore()
             let reportRef = db.collection("reports").doc().id
             let userRef = db.collection("users").doc(this.props.UserStore.userID).id
    
             let createdTime = new Date().getTime();
             
             let reportData = {
                    userReport: this.props.UserStore.userID,
                    reportType: this.state.reportReason.baseValue,
                    reportID: reportRef,
                    reportText: reportText,
                    reportDate: createdTime,
                    status: "UNRESOLVED",
                    resolved: false,
                    resolvedTime: null,
                    resolvedBy: null,
                    visit: {
                        visitID: this.state.visit.tripID,
                        hostID: this.state.listing.hostID,
                        listingID: this.state.listing.listingID
                    },
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
             }
    
    
             try{
                db.collection("reports").doc(reportRef).set(reportData).then(() => {
                    this.props.UserStore.reports.push(reportData)
                    db.collection("users").doc(userRef).collection('reports').doc(reportRef).set({
                        reportType: this.state.reportReason.baseValue,
                        reportID: reportRef,
                        reportDate: createdTime,
                    })
                }).then(() => {
                    Alert.alert(
                        'Report Issue',
                        'Thank you for reporting an issue with us. It will be handled by an individual on our team and investigated as soon as possible.',
                        [
                        { text: 'Close' },
                        // If they said no initially and want to change their mind,
                        // we can automatically open our app in their settings
                        // so there's less friction in turning notifications on
                        // { text: 'Enable Notifications', onPress: () =>{
                        //     Platform.OS === 'ios' ? Linking.openURL('app-settings:') : Linking.openSettings();
                        // }}
                        ]
                    )
                }).then(() => {
                    this.props.navigation.goBack(null)
                })
             }catch(e){
                 alert(e)
             }
            }
             
        }


        pickerChange = (index) => {
      
            this.setState({reportReason: this.array[index]})
            // console.log(this.array[index])
        }


    render(){
        
        // let {type, number, bankProvider, bankToken, cardType, fingerprint, id} = this.props.UserStore.directDepositInfo
        return(
            <View 
                style={{backgroundColor: "white", paddingTop: 16, flex: 1}} 
                // contentContainerStyle={{display: 'flex'}}

            > 
                <KeyboardAwareScrollView 
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustContentInsets={false}
                scrollEnabled
                enableOnAndroid={true}
                extraScrollHeight={40} //iOS
                extraHeight={40} //Android
                style={{paddingTop: 16}} 
                // contentContainerStyle={{flex: 1}}
            >
                <View style={[styles.container, {flexDirection: 'row', alignItems: 'center'}]}>
                  <Icon 
                      iconName="report"
                      iconLib="MaterialIcons"
                      iconSize={32}
                      style={{marginRight: 4}}
                  />
                  <Text style={{fontSize: 20, }} type="SemiBold">Report Trip</Text>
                 
                        
                  
                </View>
                <View style={[styles.container, {marginTop: 8,}]}>
                    <Text style={{fontSize: 16, }}>If you have encountered issues with your trip at {this.state.listing.spaceName}, you can report it here. Once processed, we will get back to you via {this.props.UserStore.email} or at {this.props.UserStore.phone} to resolve any problems and ensure Riive is a safe place for all of our users.</Text>
                    <Dropdown
                        flex={0}
                        selectedValue = {this.state.reportReason.label}
                        label="Report Reason"
                        // error={this.state.error.make}
                        style={{height: 32}}
                        onValueChange = {(res) => this.pickerChange(res.key)}
                     >
                        {
                            this.array.map((x, i) => {
                                
                                     return(
                                        {key: x.index, label: x.label, baseValue: x.baseValue}
                                     )
                                 
                             })
                        }
                    </Dropdown>
                    <Input 
                        placeholder='Additional details...'         
                        label="Report Details"
                        name="ReportDetails"                 
                        onChangeText= {reportText => this.setState({reportText})}
                        value={this.state.reportText}
                        mask="multiline"
                        numLines={4}
                        rightText={`${this.state.reportText.length}/300`}
                        maxLength = {300}
                        keyboardType='default'
                        error={this.state.reportTextError}
                        />
                </View>
            </KeyboardAwareScrollView>
                <View style={[styles.container, {marginBottom: 8}]}>
                    <Button style={{backgroundColor: Colors.apollo500}} textStyle={{color: "white"}} onPress={() => this.reportIssue(this.state.reportText)}>Report Issue</Button>
                </View>
            </View>
        )
    }
    
}
const styles = StyleSheet.create({
  container: {
      paddingHorizontal: 16
  }, 
  icon:{
      paddingRight: 8
  }
})