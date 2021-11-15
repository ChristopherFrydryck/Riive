import React, { Component } from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, SafeAreaView, LogBox, Dimensions, KeyboardAvoidingView} from 'react-native';
import Text from '../../components/Txt'
import Input from '../../components/Input'
import Icon from '../../components/Icon'
import Dropdown from '../../components/Dropdown'
import StripeTOSModal from '../../components/StripeTOSModal';
import AddressInput from '../../components/AddressInput';
import DropdownItem from '../../components/DropdownItem'
import Button from '../../components/Button'
import Colors from '../../constants/Colors'
import AddressTypes from '../../constants/AddressTypes'
import LinearGradient from 'react-native-linear-gradient'

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import config from 'react-native-config'

import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';


//MobX Imports
import {inject, observer} from 'mobx-react'
import { requireNativeViewManager } from '@unimodules/core';





const regexFullname = /[^0-9]([a-zA-Z]{1,})+[ ]+([a-zA-Z-']{2,})*$/i;
const regexAddress = /^[#.0-9a-zA-Z\s,-]+$/
var d = new Date();
const year = d.getFullYear().toString();
const lastTwoYearString = year.slice(-2);
const lastTwoYear = Number(lastTwoYearString);
const month = d.getMonth() + 1;




@inject("UserStore", "ComponentStore")
@observer
class addPayment extends Component {
  _isMounted = false;

  static navigationOptions = {
    title: "Add A Card",
    headerTitleStyle:{
        fontWeight: "300",
        fontSize: 18,
    }

};


    constructor(props){
        super(props)

        this.state = {
            creditCardNum: null,
            creditCardType: '',
            creditCardFormat: 'visa-or-mastercard',
            name: this.props.UserStore.fullname,
            CCV: null,
            type: "",
            exp: "",
            expMonth: "",
            expYear: "",
            StripecardId: null,
            StripecardTok: null,
            CCVError: "",
            creditCardNumError: "",
            nameError: "",
            expError: "",
            allValid: false,
            authenticating: false,

            savingAddrAndSSN: false,
            searchedAddress: false,
            address: {
              line1: this.props.UserStore.address.line1,
              line2: this.props.UserStore.address.line2 ? this.props.UserStore.address.line2.split(" ")[1] : "",
              line2Prefix: this.props.UserStore.address.line2 ? this.props.UserStore.address.line2.split(" ")[0] : "Apartment",
              zip: this.props.UserStore.address.postal_code,
              city: this.props.UserStore.address.city,
              state: this.props.UserStore.address.state,
              country: this.props.UserStore.address.country
            },
            addressError: "",

            ssn:"",

            stripeModalVisible: true,
        }
    }

    async componentDidMount(){
      // Set Status Bar page info here!
      this._isMounted = true;
      this._navListener = this.props.navigation.addListener('didFocus', () => {
         StatusBar.setBarStyle('dark-content', true);
         Platform.OS === 'android' && StatusBar.setBackgroundColor('white');
       });

       LogBox.ignoreLogs(['VirtualizedLists should never be nested'])

       
    }

    updateStripeTOS = async() => {

      const settings = {
      method: 'POST',
      headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          stripeConnectID: this.props.UserStore.stripeConnectID,
      })
      }

      try{  
          const fetchResponse = await fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/agreeToStripeTOS`, settings)
          const data = await fetchResponse;

          if(data.status !== 200){
              throw "Failure to agree to TOS."
          }
          this.setState({stripeModalVisible: false})
          return data;
      }catch(e){
          throw e
      }  
      
  }

addAddress = async () => {

  const settings = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      FBID: auth().currentUser.uid,
      stripeID: this.props.UserStore.stripeID,
      stripeConnectID: this.props.UserStore.stripeConnectID,

      lineOne: this.state.address.line1,
      lineTwo: this.state.address.line2 == "" ? null : `${this.state.address.line2Prefix} ${this.state.address.line2}`,
      zipCode: this.state.address.zip,
      city: this.state.address.city,
      state: this.state.address.state,
    })
  }

  if(this.state.address.line1 != ""){
    try{  
      const fetchResponse = await fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/addCustomerAddress`, settings)
      const data = await fetchResponse;
      if(data.status !== 200){
        throw "Failure to link address."
      }
      this.props.UserStore.address = {
        line1: this.state.address.line1,
        line2: this.state.address.line2 == "" ? null : `${this.state.address.line2Prefix} ${this.state.address.line2}`,
        postal_code: this.state.address.zip,
        city: this.state.address.city,
        state: this.state.address.state,
        country: this.state.address.country
      }
      return data;
    }catch(e){
      throw e
    }  
  }else{
    throw "Failure to save address."
  }
    
}

addressCallbackFunction  = (childData) => {

       
  if(childData){
      this.setState({
          searchedAddress: true,
          address:{
              ...this.state.address,
              line1: childData.address.line1,
              city: childData.address.city,
              state: childData.address.state_abbr,
              zip: childData.address.zip,
              country: childData.address.country_abbr
          }
      })
   }else{
     this.setState({searchedAddress: false})
   }
}


addSSN = async () => {

  const settings = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      FBID: auth().currentUser.uid,
      stripeConnectID: this.props.UserStore.stripeConnectID,

      ssn: this.state.ssn
    })
  }

  if(this.state.ssn != ""){
    try{  
      const fetchResponse = await fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/addCustomerSSN`, settings)
      const data = await fetchResponse;
      if(data.status !== 200){
        throw "Failure to link ssn."
      }
      this.props.UserStore.ssnProvided = true;
      return data;
    }catch(e){
      throw e
    }  
  }else{
   throw "Failure to save ssn.";
  }
    
}


addPreData = async() => {
  try{
    this.setState({savingAddrAndSSN: true})
    await this.addAddress();
    await this.addSSN();
    this.setState({savingAddrAndSSN: false})
    this.props.navigation.goBack(null)
  }catch(e){
    this.setState({savingAddrAndSSN: false})
    alert(e)
  }
  
}


  render() {
      let {width, height} =  Dimensions.get("window")
      return(
        <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        // contentContainerStyle={{ backgroundColor: 'white'}} 
        scrollEnabled
        horizontal={false}
        enableOnAndroid={true}
        extraScrollHeight={-150} //iOS
        extraHeight={2000} //Android
        style={{backgroundColor: 'white', paddingHorizontal: 16}}
          contentContainerStyle={{flex: 1, justifyContent: 'center'}}
        >
           <StripeTOSModal visible={this.state.stripeModalVisible} onClose={() => this.updateStripeTOS()}/>


        {/* Needed to prevent error with scrollview and flatlist */}
          <Icon 
                        iconName="card-account-details"
                        iconLib="MaterialCommunityIcons"
                        iconSize={28}
                        style={{marginBottom: 12}}
                    />
          <Text style={{fontSize: 20, marginBottom: 4,}} type="SemiBold">Address & SSN</Text>
          <Text style={{marginBottom: 8}}>In order for you to add a card once and charge it for future parking, we need a few more details.</Text>
          {/* <View style={{flex: 1, paddingBottom: 0, zIndex: 99999, backgroundColor: 'orange',}}> */}
            
              <Text style={styles.label}>Address</Text>
              <View style={{height: 40}}>
                <AddressInput 
                  defaultValue={`${this.state.address.line1}, ${this.state.address.city} ${this.state.address.state} ${this.state.address.zip}` || null}
                  returnValue={this.addressCallbackFunction}
                />
              </View>
              
            <View style={{flex: 0, zIndex: -9, flexDirection: 'row'}}>
              <Dropdown
                flex={3}
                selectedValue = {this.state.address.line2Prefix}
                label="Line 2 (optional)"
                // error={this.state.error.make}
                style={{height:32}}
                onValueChange = {(res) => this.setState(prevState => ({address: {...this.state.address, line2Prefix: res.baseValue }}))}
              >
                {
                  AddressTypes.map((x, i) => {
                    return(
                      {key: i, label: x, baseValue: x}
                    )
                })
                }
              </Dropdown>
            <Input
              flex={1}
              placeholder='107'        
              label= ""
              name="Apartment number"   
              style={{marginTop: 1.5, marginLeft: 8}}
              onChangeText= {(number) => this.setState(prevState => ({
                address:{
                  ...prevState.address,
                  line2: number,
                }
              }))}
              value={this.state.address.line2}
              maxLength = {6}
              />
            </View>
      
            <Input
              flex={0}
              placeholder='XXXXXXXXX'   
              mask={"number"}     
              label= {"SSN"}
              secureTextEntry
              name="Apartment number"   
              style={{marginTop: 1.5, zIndex: -9, width: '100%'}}
              onChangeText= {(number) => this.setState({
                ssn: number
              })}
              value={this.state.ssn}
              maxLength = {9}
              keyboardType='number-pad'/>
            <Button textStyle={{color: "white"}} style={{zIndex: -99, backgroundColor: Colors.apollo500, height: 48}} onPress={() => this.addPreData()}>{this.state.savingAddrAndSSN ? null : "Update Profile"}</Button>
        </KeyboardAwareScrollView>
      )
  }
}

const styles = StyleSheet.create({
  container:{
    padding: 20,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center'

  },
  creditCard: {
    width: "100%",
    height: 200,
    marginBottom: 20,
    // backgroundColor: Colors.apollo500,
    borderRadius: 10,
    padding: 15,
    justifyContent: "space-between",
  },
  creditCardText: {
    color: Colors.mist300,
    fontSize: 16,
    alignSelf: "flex-end"
  },
  label: {
    paddingTop: 5,
    marginBottom: -2,
    paddingTop: 0,
    color: '#333',
    fontSize: 14,
    fontWeight: '400',
    width: 'auto'
  },
  error: {
    paddingTop: 0,
    paddingBottom: 0,
    color: 'red',
    fontSize: 14,
    fontWeight: '400',
    width: 'auto',
    zIndex: -99
  }
})

export default addPayment