import React, { Component } from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, SafeAreaView, LogBox, Dimensions } from 'react-native';
import Text from '../../components/Txt'
import Input from '../../components/Input'
import Icon from '../../components/Icon'
import Dropdown from '../../components/Dropdown'
import DropdownItem from '../../components/DropdownItem'
import Button from '../../components/Button'
import Colors from '../../constants/Colors'
import FloatingCircles from '../../components/FloatingCircles'
import AddressTypes from '../../constants/AddressTypes'
import LinearGradient from 'react-native-linear-gradient'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';


//MobX Imports
import {inject, observer} from 'mobx-react/native'
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
              zipCode: this.props.UserStore.address.postal_code,
              city: this.props.UserStore.address.city,
              state: this.props.UserStore.address.state,
              country: this.props.UserStore.address.country
            },
            addressError: "",

            ssn:""
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

       if(this.state.address.line1){
         this.setLocation(`${this.state.address.line1}, ${this.state.address.city} ${this.state.address.state} ${this.state.address.zipCode}, ${this.state.address.country}`)
       }else{
        this.setLocation("")
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
      zipCode: this.state.address.zipCode,
      city: this.state.address.city,
      state: this.state.address.state,
    })
  }

  if(this.state.address.line1 != ""){
    try{  
      const fetchResponse = await fetch('https://us-central1-riive-parking.cloudfunctions.net/addCustomerAddress', settings)
      const data = await fetchResponse;
      if(data.status !== 200){
        throw "Failure to link address."
      }
      this.props.UserStore.address = {
        line1: this.state.address.line1,
        line2: this.state.address.line2 == "" ? null : `${this.state.address.line2Prefix} ${this.state.address.line2}`,
        postal_code: this.state.address.zipCode,
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
      const fetchResponse = await fetch('https://us-central1-riive-parking.cloudfunctions.net/addCustomerSSN', settings)
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
    await this.setState({savingAddrAndSSN: false})
    this.props.navigation.goBack(null)
  }catch(e){
    this.setState({savingAddrAndSSN: false})
    alert(e)
  }
  
}




onSelectAddress = async(det) => {
  // console.log(det.formatted_address)
  // console.log(det.geometry.location.lat);
  // console.log(det.address_c omponents)

  
  var number = det.address_components.filter(x => x.types.includes('street_number'))[0]
  var street = det.address_components.filter(x => x.types.includes('route'))[0]
  var city = det.address_components.filter(x => x.types.includes('locality'))[0]
  var county = det.address_components.filter(x => x.types.includes('administrative_area_level_2'))[0]
  var state = det.address_components.filter(x => x.types.includes('administrative_area_level_1'))[0]
  var country = det.address_components.filter(x => x.types.includes('country'))[0]
  var zip = det.address_components.filter(x => x.types.includes('postal_code'))[0]

  if(number && street && city && county && state){
    // console.log(number)
    // console.log(street)
    // console.log(city)
    // console.log(county)
    // console.log(state)
    // console.log(country)
    // console.log(zip)
    this.setState({
      searchedAddress: true,
      addressError: "",
      address:{
        ...this.state.address,
        line1: `${number.long_name} ${street.short_name}`,
        zipCode: zip.short_name,
        city: city.long_name,
        state: state.short_name,
        country: country.short_name
      }
    })

    this.GooglePlacesRef.setAddressText("HELLOOOOO")
   
  }else{
    this.setState({addressError: "Select a valid street address"})
    this.clearAddress();
  }



  
}

clearAddress = () => {
  this.GooglePlacesRef.setAddressText("")
  this.setState({
    searchedAddress: false,
    address: {
      ...this.state.address,
      line1: "",
      zipCode: "",
      city: "",
      state: "",
      country: ""
    }
  })
}

setLocation(text) {
  this.GooglePlacesRef && this.GooglePlacesRef.setAddressText(text)
  // console.log("Set location")
  // console.log(this.state.address)
}

  render() {
    
      return(
        <ScrollView 
          style={{backgroundColor: 'white', paddingHorizontal: 16}}
          keyboardShouldPersistTaps='always'
        >
          <Text style={{color: Colors.cosmos900, fontSize: 18}}>Before we add a card, we need a few more things...</Text>
          {/* <View style={{flex: 1, paddingBottom: 0, zIndex: 99999, backgroundColor: 'orange',}}> */}
            
              <Text style={styles.label}>Address</Text>
              <GooglePlacesAutocomplete
                placeholder='Your Address...'
                returnKeyType={'search'}
                ref={(instance) => { this.GooglePlacesRef = instance }}
                currentLocation={false}
                minLength={2}
                autoFocus={true}
                listViewDisplayed={false}
                fetchDetails={true}
                onChangeText= {(text) => this.setLocation(text)}
                onPress={(data, details = null) => {
                  this.onSelectAddress(details)
                }}
                textInputProps={{
                  clearButtonMode: 'never'
                }}
                renderRightButton={() => 
                <Icon 
                  iconName="x"
                  iconColor={Colors.cosmos500}
                  iconSize={24}
                  onPress={() => this.clearAddress()}
                  style={{marginTop: 8, display: this.state.searchedAddress || this.state.address.line1 !== "" ? "flex" : "none",}}
                />}
                query={{
                  key: 'AIzaSyBa1s5i_DzraNU6Gw_iO-wwvG2jJGdnq8c',
                  language: 'en'
                }}
                GooglePlacesSearchQuery={{
                  rankby: 'distance',
                  types: 'address',
                  components: "country:us"
                }}
                // GooglePlacesDetailsQuery={{ fields: 'geometry', }}
                nearbyPlacesAPI={'GoogleReverseGeocoding'}
                debounce={200}
                predefinedPlacesAlwaysVisible={true}
                enablePoweredByContainer={false}
                
                
                styles={{
                  container: {
                    border: 'none',
                  },
                  textInputContainer: {
                    width: '100%',
                    display: 'flex',
                    alignSelf: 'center',
                    backgroundColor: "white",
                    marginTop: -6,
                    borderColor: '#eee',
                    borderBottomWidth: 2,
                    borderTopWidth: 0,
                    backgroundColor: "none",
                  },
                  textInput: {
                    paddingRight: 0,
                    paddingLeft: 0,
                    paddingBottom: 0,
                    color: '#333',
                    fontSize: 18,
                    width: '100%',
                  },
                  description: {
                    fontWeight: 'bold'
                  },
                  predefinedPlacesDescription: {
                    color: '#1faadb'
                  },
                  listView:{
                    backgroundColor: 'white',
                    position: 'absolute',
                    top: 40,
                    width: Dimensions.get("window").width - 32,
                    zIndex: 999999,
                  },
                  // row: {
                  //   backgroundColor: 'white'
                  // },
                  
                }}
              />
                <Text style={styles.error}>{this.state.addressError}</Text>
              {/* </View> */}
              
              {/* <Input
                flex={1}
                placeholder='107'        
                label= "Apt # (optional)"
                name="Apartment number" 
                style={{marginRight: 16}}                
                onChangeText= {(number) => this.setState(prevState => ({
                  address:{
                    ...prevState.address,
                    line2: number,
                  }
                }))}
                value={this.state.address.line2}
                maxLength = {6}
                keyboardType='number-pad'
              /> */}
            <View style={{flex: 1, zIndex: -9, flexDirection: 'row'}}>
              <Dropdown
                flex={2}
                selectedValue = {this.state.address.line2Prefix}
                label="Line 2 (optional)"
                // error={this.state.error.make}
                style={{height: 32}}
                onValueChange = {(res) => Platform.OS == 'ios' ? this.setState(prevState => ({address: {...this.state.address, line2Prefix: res.baseValue || prevState.address.line2Prefix}})) : this.setState({address: {...this.state.address, line2Prefix: res || "Hello"}})}
              >
                {
                  AddressTypes.map((x, i) => {
                  if(Platform.OS === 'ios'){
                    return(
                      {key: i, label: x, baseValue: x}
                    )
                  }
                  else{
                      return(
                        <DropdownItem key={i} label={x} value={x}/>
                      )
                  }
                })
                }
              </Dropdown>
            <Input
              flex={2}
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
              flex={2}
              placeholder='XXXXXXXXX'   
              mask={"number"}     
              label= {"SSN"}
              secureTextEntry
              name="Apartment number"   
              style={{marginTop: 1.5, zIndex: -9}}
              onChangeText= {(number) => this.setState({
                ssn: number
              })}
              value={this.state.ssn}
              maxLength = {9}
              keyboardType='number-pad'/>
            <Button textStyle={{color: "white"}} style={{zIndex: -99, backgroundColor: Colors.apollo500, height: 48}} onPress={() => this.addPreData()}>{this.state.savingAddrAndSSN ? <FloatingCircles color="white"/> : "Update Profile"}</Button>
        </ScrollView>
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