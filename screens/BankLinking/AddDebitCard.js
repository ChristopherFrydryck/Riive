import React, { Component } from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, SafeAreaView, Dimensions, KeyboardAvoidingView, FlatList, Switch, Modal, Picker, LogBox, Alert, Linking} from 'react-native';
import Text from '../../components/Txt'
import MapView, {Marker} from 'react-native-maps';
import DayMap from '../../constants/DayMap'
import NightMap from '../../constants/NightMap'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import LinearGradient from 'react-native-linear-gradient'
import {Card, ThemeProvider} from 'react-native-paper';

import config from 'react-native-config'




import Input from '../../components/Input'
import Icon from '../../components/Icon'
import Button from '../../components/Button'
import Colors from '../../constants/Colors'
import Image from '../../components/Image'

import Timezones from '../../constants/Timezones'

import * as firebase from 'firebase/app';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth'
import storage from '@react-native-firebase/storage'
import * as geofirestore from 'geofirestore'


//MobX Imports
import {inject, observer} from 'mobx-react'





const regexFullname = /[^0-9]([a-zA-Z]{1,})+[ ]+([a-zA-Z-']{2,})$/i;
var d = new Date();
const year = d.getFullYear().toString();
const lastTwoYearString = year.slice(-2);
const lastTwoYear = Number(lastTwoYearString);
const month = d.getMonth() + 1;



@inject("UserStore", "ComponentStore")
@observer
class addDebitCard extends Component {
  _isMounted = false;

  static navigationOptions = {
    title: "Add Your Driveway",
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
            addCardToPayments: false,

    
        
             directDepositProvided: false,
        }
    }

    async componentDidMount(){
      // Set Status Bar page info here!
      const db = firestore();
      const ref = db.collection("spaces").doc();

      LogBox.ignoreLogs(['VirtualizedLists should never be nested'])

      LogBox.ignoreLogs([]);

      this.setState({postID: ref.id})
      this._isMounted = true;
      this._navListener = this.props.navigation.addListener('didFocus', () => {
         StatusBar.setBarStyle('dark-content', true);
         Platform.OS === 'android' && StatusBar.setBackgroundColor('white');
       });


       if(Object.keys(this.props.UserStore.directDepositInfo).length === 0){
        this.setState({directDepositProvided: false})
      }else{
       this.setState({directDepositProvided: true})
      }
    }



     // Debit Card Functions

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
        console.log('Debit card null')
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

    verifyCardInput = () => {
      //set a variable to check if name is valid (returns true or false...)
      var nameValid = regexFullname.test(this.state.name)
    
      // itialize length values for card type
      var ccLength = -1;
      var CCVLength = -1;
      var expLength = 5;
    
      // Set variable values for length requirements for debit card.
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
    
      // debit card number and ccv are entered...
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
    
          // Debit card value check
          if(this.state.creditCardNum.length !== ccLength ){
            // console.log('debit card number fail...')
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
            // console.log("provide the full name on your debit card")
            this.setState({nameError: "First and last name required"})
          }else{this.setState({nameError: ""})}
        }
    
      }else{
        if(this.state.creditCardNum == null){
          this.setState({creditCardNumError: 'Debit card required'})
        }else{this.setState({creditCardNumError: ''})}
        
        if(this.state.CCV == null){
          this.setState({CCVError: "CCV required"})
        }else{this.setState({CCVError:""})}
        
      }
    }

    submitPayment = async() => {
      const db = firestore();
      const ref = db.collection("users").doc(); // creates unique ID
    
      if(this._isMounted){
        
    
    
        
        
          await this.verifyCardInput();
     
        
        
        if(this.state.allValid){
          
            await this.setState({authenticating: true})
      
            this.addDebitCardDD().then(async(result) => {
         
              
    
              
              if(result.statusCode !== 200){
                throw result
              }else{
                if(this.state.addCardToPayments){
                   // add card to mobx UserStore
                  this.props.UserStore.payments.push({
                    PaymentID: result.card.PaymentID,
                    StripeID: result.card.StripeID,
                    StripePMID: result.card.StripePMID,
                    Type: "Card",
                    CardType: this.state.creditCardType !== "" ? this.state.creditCardType : "Debit",
                    Name: this.state.name,
                    Month: this.state.expMonth,
                    Year: this.state.expYear,
                    Number: this.state.creditCardNum.slice(-4),
                    CCV: this.state.CCV,
                })
              }

                this.props.UserStore.directDepositInfo = {
                  type: result.card.BankInfo.object,
                  id: result.card.BankInfo.id,
                  fingerprint: result.card.BankInfo.fingerprint,
                  payoutMethods: result.card.BankInfo.available_payout_methods,
                  number: result.card.BankInfo.last4,
                  cardType: result.card.BankInfo.brand,
                }
              
                // navigate back
                this.props.navigation.navigate("BankInfo")
              }
            }).catch(async(err) => {
                  await this.setState({authenticating: false})
                  // console.log(`Error: ${JSON.stringify(err)}`)
                  // console.log(err)
                  alert(err.message)
                
            })
     
        
          }else{
            this.setState({creditCardNumError: 'Debit card type is not supported'})
          }
      }
    }

  addDebitCardDD = async () => {

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
        addCardToPayments: this.state.addCardToPayments,
  
  
        number: this.state.creditCardNum,
        expMonth: this.state.expMonth,
        expYear: this.state.expYear,
        cvc: this.state.CCV,
        name: this.state.name,
        creditCardType: this.state.creditCardType
      })
    }
    try{
      
      const fetchResponse = await fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/addDebitCardForDirectDeposit`, settings)
      const data = await fetchResponse.json();
      return data;
    }catch(e){
      alert(e);
    }    
  }


    
  
   


       
   

     componentWillUnmount() {
      this._isMounted = false;
          // Unmount status bar info
        //  this._navListener.remove();
       }


  render() {

    
      return(
        <View style={{flex: 1, backgroundColor: 'white'}}>
        <KeyboardAwareScrollView 
         style={{paddingHorizontal: 16}} 
         keyboardShouldPersistTaps="handled"
          automaticallyAdjustContentInsets={false}
          scrollEnabled
          enableOnAndroid={true}
          extraScrollHeight={150} //iOS
          extraHeight={135} //Android
        > 
          {/* // <Icon 
          //   iconName="bank-transfer"
          //   iconLib="MaterialCommunityIcons"
          //   iconColor={Colors.cosmos500}
          //   iconSize={120}
          //   style={{marginBottom: 16}}
          // /> */}
          {/* // <Text style={{textAlign: "center"}}>Let's add a bank account.</Text> */}
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
                label="Debit Card Number"
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
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8}}>
              <Text style={{flex: 1, color: !this.props.UserStore.ssnProvided || this.props.UserStore.address === {} ? Colors.mist900 : Colors.cosmos900}}>Add card to profile</Text>
              <Switch
                disabled={!this.props.UserStore.ssnProvided || this.props.UserStore.address === {}}
                onValueChange={() => this.setState(prevState => ({addCardToPayments: !this.state.addCardToPayments}))}
                value={this.state.addCardToPayments}
              />
            </View>
            
            <Button style={{backgroundColor: Colors.apollo700}} disabled={this.state.authenticating} textStyle={{color: 'white'}} onPress={() => this.submitPayment()}>{this.state.authenticating ? null : "Save Bank Account"}</Button>
            
          </View>
          
         
        </KeyboardAwareScrollView>
        </View>
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
  mapStyle: {
    width: Dimensions.get('window').width,
    height: 175,
  },
  numHoriz:{
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  numContainer:{
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 3, 
    borderColor: Colors.apollo500, 
    borderRadius: Math.round(Dimensions.get('window').width + Dimensions.get('window').height) / 2, 
    width: 44, 
    height: 44,
  },
  number:{
    color: Colors.apollo500,
    fontSize: 18,
  },
  numTitle: {
    color: Colors.apollo500,
    fontSize: 18,
    textAlign: 'center',
    marginLeft: 8,
  },
  imageListGrid:{
    flexGrow: 1,
    marginVertical: 20,
    
  },
  dayHead:{
    fontSize: 24,
    fontFamily: 'WorkSans-Regular'
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
  width: 'auto'
}
})
  

export default addDebitCard