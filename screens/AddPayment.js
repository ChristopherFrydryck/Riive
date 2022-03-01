import React, { Component } from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, SafeAreaView, LogBox, Dimensions } from 'react-native';
import Text from '../components/Txt'
import Input from '../components/Input'
import Icon from '../components/Icon'
import Button from '../components/Button'
import Colors from '../constants/Colors'
import AddressTypes from '../constants/AddressTypes'
import LinearGradient from 'react-native-linear-gradient'

import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import config from 'react-native-config'


//MobX Imports
import {inject, observer} from 'mobx-react'
import { requireNativeViewManager } from '@unimodules/core';



const regexFullname = /[^0-9]([a-zA-Z]{1,})+[ ]+([a-zA-Z-']{2,})$/i;
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
         this.forceUpdate();
       });

       LogBox.ignoreLogs(['VirtualizedLists should never be nested'])

       if(this.state.address.line1){
         this.setLocation(`${this.state.address.line1}, ${this.state.address.city} ${this.state.address.state} ${this.state.address.zipCode}, ${this.state.address.country}`)
       }else{
        this.setLocation("")
       }
       
    }

   


       
   

     componentWillUnmount() {
      this._isMounted = false;
          // Unmount status bar info
        //  this._navListener.remove();
       }

getCardType = (cardNum) => {
  if(cardNum !== null){
    if(cardNum.length >= 2){
        if(cardNum.charAt(0) == 4){
            // console.log('visa  -  length: 16')
            this.setState({creditCardType: 'visa', creditCardFormat:'visa-or-mastercard'})
        }else if(cardNum.charAt(0) == 5){
            // console.log('mastercard  -  length: 16')
            this.setState({creditCardType: 'mastercard', creditCardFormat:'visa-or-mastercard'})
        }else if(cardNum.charAt(0) == 6){
          // console.log('discover  -  length: 16')
          this.setState({creditCardType: 'discover', creditCardFormat:'visa-or-mastercard'})
        }else if(cardNum.charAt(0) == 3 && cardNum.charAt(1) == 4 || cardNum.charAt(1) == 7){
            // console.log('amex  -  length: 15')
            this.setState({creditCardType: 'amex', creditCardFormat:'amex'})
        }else if(cardNum.charAt(0) == 3 && cardNum.charAt(1) == 0 || cardNum.charAt(1) == 6 || cardNum.charAt(1) == 8){
            // console.log('diners international  -  length: 14')
            this.setState({creditCardType: 'diners-club', creditCardFormat:'diners'})
        }else if(cardNum.charAt(0) == 3 && cardNum.charAt(1) == 5 ){
          // console.log('jcb  -  length: 16')
          this.setState({creditCardType: 'jcb', creditCardFormat:'visa-or-mastercard'})
        }else{
            // console.log('card not supported by Riive yet.')
            this.setState({creditCardType: '', creditCardFormat: 'visa-or-mastercard'})
        }
    }else{}
  }else{
    console.log('Credit card null')
  }


}

cardExpirationDate = async(mmyy) => {
  await this.setState({
    exp: mmyy,
    expMonth: Number(mmyy.split('/')[0]),
    expYear: Number(mmyy.split('/')[1]),
  })

  // console.log(this.state.expMonth + 1)
}

setCardParams = async() => {
  const params = {
    // mandatory
    number: this.state.creditCardNum,
    expMonth: this.state.expMonth,
    expYear: this.state.expYear,
    cvc: this.state.CCV,
    // optional
    name: this.state.name,
    currency: 'usd',
    // addressLine1: '123 Test Street',
    // addressLine2: 'Apt. 5',
    // addressCity: 'Test City',
    // addressState: 'Test State',
    // addressCountry: 'Test Country',
    // addressZip: '55555',
  }
 
  
  // var token = await stripe.createTokenWithCard(params)
  // this.setState({StripecardId: token.card.cardId, StripecardTok: token.tokenId})

  
  
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
      mailchimpID: this.props.UserStore.mailchimpID || null,

      lineOne: this.state.address.line1,
      lineTwo: this.state.address.line2 == "" ? null : `${this.state.address.line2Prefix} ${this.state.address.line2}`,
      zipCode: this.state.address.zipCode,
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
    await this.setState({savingAddrAndSSN: false})
  }catch(e){
    this.setState({savingAddrAndSSN: false})
    alert(e)
  }
  
}




addSource = async () => {

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


      number: this.state.creditCardNum,
      expMonth: this.state.expMonth,
      expYear: this.state.expYear,
      cvc: this.state.CCV,
      name: this.state.name,
      creditCardType: this.state.creditCardType
    })
  }
  try{
    
    const fetchResponse = await fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/addSource`, settings)
    const data = await fetchResponse.json();
    return data;
  }catch(e){
    alert(e);
  }    
}




submitPayment = async() => {
  const db = firestore();
  const ref = db.collection("users").doc(); // creates unique ID

  if(this._isMounted){
    


    
    
      await this.verifyInput();
      // await this.setCardParams();
    
    
    
    if(this.state.allValid){
      
        await this.setState({authenticating: true})
  
        this.addSource().then(async(result) => {
          // console.log(`result is: ${JSON.stringify(result)}`)
          

          
          if(result.statusCode !== 200){
            throw result
          }else{
               // add card to mobx UserStore
              this.props.UserStore.payments.push({
                PaymentID: result.card.PaymentID,
                StripeID: result.card.StripeID,
                StripePMID: result.card.StripePMID,
                Type: "Card",
                CardType: this.state.creditCardType !== "" ? this.state.creditCardType : "Credit",
                Name: this.state.name,
                Month: this.state.expMonth,
                Year: this.state.expYear,
                Number: this.state.creditCardNum.slice(-4),
                CCV: this.state.CCV,
            })
          
            // navigate back to profile
            this.props.navigation.goBack(null)
          }
        }).catch(async(err) => {
              await this.setState({authenticating: false})
              // console.log(`Error: ${JSON.stringify(err)}`)
              // console.log(err)
              alert(err.message)
            
        })
 
    
      }else{
        this.setState({creditCardNumError: 'Credit card type is not supported'})
      }

      
  
  
  
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

    
   
  }else{
    this.setState({addressError: "Select a valid street address"})
    this.clearAddress();
  }



  
}




verifyInput = () => {
  //set a variable to check if name is valid (returns true or false...)
  var nameValid = regexFullname.test(this.state.name)

  // itialize length values for card type
  var ccLength = -1;
  var CCVLength = -1;
  var expLength = 5;

  // Set variable values for length requirements for credit card.
  if(this.state.creditCardFormat == 'visa-or-mastercard'){
    ccLength = 19;
    CCVLength = 3;
  }else if(this.state.creditCardFormat == 'amex'){
    ccLength = 17;
    CCVLength = 4;
  }else if(this.state.creditCardFormat == 'diners'){
    ccLength = 16;
    CCVLength = 3;
  }else{
    ccLength = 19;
    CCVLength = 3;
  }

  // credit card number and ccv are entered...
  if(this.state.creditCardNum && this.state.CCV){
     
    //Checking if everything is valid for a year that is not the current year
    if(this.state.creditCardNum.length == ccLength
      && this.state.CCV.length == CCVLength
      && !isNaN(this.state.CCV)
      && this.state.exp.length == expLength
      && this.state.expYear > lastTwoYear
      && this.state.expMonth < 13 
      && nameValid){
      this.setState({
        creditCardNumError: "",
        expError: "",
        CCVError: "",
        nameError: "",
      })
      this.state.allValid = true;
      // alert("Success future year!!!")
      

      // Checking if valid for a year that is the current year
    }else if(this.state.creditCardNum.length == ccLength
      && this.state.CCV.length == CCVLength
      && this.state.exp.length == expLength 
      && this.state.expYear == lastTwoYear
      && this.state.expMonth >= month 
      && nameValid){
        this.setState({
          creditCardNumError: "",
          expError: "",
          CCVError: "",
          nameError: "",
        })
        this.state.allValid = true;
        // alert("Success current year!!!")
        

    // Begin error checking....
    }else{
      this.state.allValid = false;

      // Credit card value check
      if(this.state.creditCardNum.length !== ccLength ){
        // console.log('credit card number fail...')
        this.setState({creditCardNumError: "Number too short"})
      }else{this.setState({creditCardNumError: ""})}

      // CCV value check
      if(this.state.CCV.length !== CCVLength){
        // console.log('CCV fail...')
        this.setState({CCVError: "CCV too short"})
      }else if(isNaN(this.state.CCV)){
        this.setState({CCVError: "CCV should be numbers"})
      }else{this.setState({CCVError: ""})}

      // expiration date value check
      if(this.state.exp.length !== expLength || this.state.expMonth >= 13 || this.state.expYear <= lastTwoYear || this.state.expMonth < month){
        if(this.state.exp.length !== expLength){this.setState({expError: "MM/YY"})}
        else if(this.state.expMonth >= 13){this.setState({expError: "Choose a month 1-12"})}
        else if(this.state.expYear <= lastTwoYear && this.state.expMonth < month || this.state.expYear < lastTwoYear){this.setState({expError: "Date in past"})}
        else{this.setState({expError: ""})}
      }else{this.setState({expError: ""})}

      // Name value check
      if (!nameValid){
        // console.log("provide the full name on your credit card")
        this.setState({nameError: "First and last name required"})
      }else{this.setState({nameError: ""})}
    }

  }else{
    if(this.state.creditCardNum == null){
      this.setState({creditCardNumError: 'Credit card required'})
    }else{this.setState({creditCardNumError: ''})}
    
    if(this.state.CCV == null){
      this.setState({CCVError: "CCV required"})
    }else{this.setState({CCVError:""})}
    
  }
}





  render() {
    if(this.props.UserStore.address !== {} && this.props.UserStore.ssnProvided && auth().currentUser.emailVerified){
      return (
        
        <ScrollView style={{backgroundColor: 'white'}}>
        <SafeAreaView style={{flex: 0, backgroundColor: "white", }} />
        <View style={styles.container}>
          <LinearGradient colors={[Colors.apollo500, Colors.apollo700]} style={styles.creditCard}>
              <Icon 
                iconName={this.state.creditCardType !== '' ? 'cc-' + this.state.creditCardType : 'credit-card'}
                iconLib="FontAwesome"
                iconColor={Colors.mist300}
                iconSize={28}
                style={{ marginLeft: "auto"}}
              />
              <View style={{justifyContent: 'flex-end'}}>
              <Text style={{color: Colors.mist300, fontSize: 18}}>{this.state.creditCardNum ? this.state.creditCardNum : 'XXXX XXXX XXXX XXXX'}</Text>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={{color: Colors.mist300, fontSize: 10, marginBottom: 20, marginLeft: 5}}>{this.state.CCV ? this.state.CCV : 'CCV'}</Text>
                <Text style={{color: Colors.mist300, fontSize: 10}}>GOOD {"\n"} THRU {"\n"}</Text>
              </View>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={styles.creditCardText}>{this.state.name == "" ? 'Firstname Lastname' : this.state.name}</Text>               
                <Text style={styles.creditCardText}>{this.state.exp == "" ? "MM/YY" : this.state.exp}</Text>
              </View>
              </View>
          </LinearGradient>
          <View style={{flexDirection: 'row'}}>
            <View style={{marginRight: 16, flex: 5}}>
              <Input 
                placeholder='XXXXXXXXXXXXXXXX'
                mask='credit-card'
                ccType = {this.state.creditCardFormat}
                label="Credit Card Number"
                name="CCNum"
                onChangeText = {cc => {this.setState({creditCardNum: cc}); this.getCardType(cc)}}
                value={this.state.creditCardNum}
                error={this.state.creditCardNumError}
              />
            </View>
            <View style={{flex: 2}}>
                  <Input 
                      placeholder='MM/YY'
                      mask='mm/yy'
                      label="Expiration"
                      name="expiration"
                      onChangeText = {i => this.cardExpirationDate(i)}
                      value={this.state.exp}
                      keyboardType='numeric' 
                      error={this.state.expError}
                    />
              </View>
            
          </View>
            <View style={{flexDirection: 'row'}}>
              
            <View style={{marginRight: 16, flex: 3}}>
              <Input 
                placeholder="Your name..."
                label="Name"
                name="name"
                onChangeText={(n) => this.setState({name: n})}
                value={this.state.name}
                maxLength={40}
                error={this.state.nameError}
              />
            </View> 
            <View  style={{flex: 1}}>
              <Input 
                placeholder={this.state.creditCardType == 'amex' ? '0000' : '000'}
                label="CCV"
                name="ccv"
                onChangeText={(ccv) => this.setState({CCV: ccv})}
                value={this.state.CCV}
                maxLength={this.state.creditCardType == 'amex' ? 4 : 3}
                keyboardType='numeric' 
                error={this.state.CCVError}
                />
            </View>  
            </View>
          <Button style={{backgroundColor: Colors.apollo700}} disabled={this.state.authenticating} textStyle={{color: 'white'}} onPress={() => this.submitPayment()}>{this.state.authenticating ? null : "Save Card"}</Button>
        </View>
        </ScrollView>
      );
    }else if(auth().currentUser.emailVerified == false){

        return(
          <ScrollView 
            style={{backgroundColor: "white", paddingHorizontal: 16}} 
            contentContainerStyle={{flex: 1, alignItems: 'center', justifyContent: 'center'}}
          > 
            <Icon 
              iconName="alternate-email"
              iconLib="MaterialIcons"
              iconColor={Colors.cosmos500}
              iconSize={120}
              style={{marginBottom: 16}}
            />
            <Text style={{textAlign: "center"}}>To add a payment method, you must verify your email at {this.props.UserStore.email}.</Text>
            <Button disabled={this.state.verificationSent} style={this.state.verificationSent ? {backgroundColor: Colors.fortune500} : {backgroundColor: Colors.tango900}} textStyle={{color: Colors.mist300}}  onPress={() => this.resendVerification()}>{this.state.verificationSent ? "Email Sent" : "Resend Verification Email"}</Button>
          </ScrollView>
        )

    }else{
      return( 
        <ScrollView 
          style={{backgroundColor: "white", paddingHorizontal: 16}} 
          contentContainerStyle={{flex: 1, alignItems: 'center', justifyContent: 'center'}}
        > 
          <Icon 
            iconName="alternate-email"
            iconLib="MaterialIcons"
            iconColor={Colors.cosmos500}
            iconSize={120}
            style={{marginBottom: 16}}
          />
          <Text style={{textAlign: "center"}}>You must add an address, SSN and payment method before adding your first card.</Text>
          <Button disabled={this.state.verificationSent} style={this.state.verificationSent ? {backgroundColor: Colors.fortune500} : {backgroundColor: Colors.tango900}} textStyle={{color: Colors.mist300}}  onPress={() => this.props.navigation.navigate("AddressAndSSN")}>Add Details</Button>
        </ScrollView>)
    }
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