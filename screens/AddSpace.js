import React, { Component } from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, SafeAreaView, Dimensions, KeyboardAvoidingView, FlatList, Switch, Modal, Picker, LogBox, Alert, Linking} from 'react-native';
import Text from '../components/Txt'
import MapView, {Marker} from 'react-native-maps';
import DayMap from '../constants/DayMap'
import NightMap from '../constants/NightMap'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import LinearGradient from 'react-native-linear-gradient'


// import ImageBrowser from '../features/camera-roll/ImageBrowser'
import ImagePicker from 'react-native-image-crop-picker';
import config from 'react-native-config'


import AddressInput from '../components/AddressInput';
import Input from '../components/Input'
import Icon from '../components/Icon'
import Button from '../components/Button'
import Colors from '../constants/Colors'
import Image from '../components/Image'
import DayAvailabilityPicker from '../components/DayAvailabilityPicker'

import Timezones from '../constants/Timezones'
import isDSTObserved from '../functions/in-app/daylightSavings';

import * as firebase from 'firebase/app';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth'
import storage from '@react-native-firebase/storage'
import * as geofirestore from 'geofirestore'


//MobX Imports
import {inject, observer} from 'mobx-react'





const regexFullname = /[^0-9]([a-zA-Z]{1,})+[ ]+([a-zA-Z-']{2,})*$/i;
var d = new Date();
const year = d.getFullYear().toString();
const lastTwoYearString = year.slice(-2);
const lastTwoYear = Number(lastTwoYearString);
const month = d.getMonth() + 1;



@inject("UserStore", "ComponentStore")
@observer
class addSpace extends Component {
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
            postID: null,
            region: {
              latitude: null,
              longitude: null,
              latitudeDelta: null,
              longitudeDelta: null,
            },
            address: {
              full: null,
              number: null,
              street: null,
              box: null,
              city: null,
              county: null,
              state: null,
              state_abbr: null,
              country: null,
              country_abbr: null,
              zip: null,
              spaceNumber: null,
            },
            timezone: null,
            
            searchedAddress: false,
            addressValid: false,
            nameValid: false,
            bioValid: true,
            priceValid: false,

            addressError: '',
            nameError: '',
            bioError: '',
            priceError: '',

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

    
            


            imageBrowserOpen: false,
            uploadingImage: false,
            photo: null,

            savingSpace: false,
            

            spaceName: '',
            spaceBio: '',
            spacePrice: null,
            numSpaces: 1,

            daily: [
              {dayName: "Sunday",  abbrName:"Sun",dayValue: 0, data: [{available: true, id: 100, start: '0000', end: '2359'}]},
              {dayName: "Monday", abbrName:"Mon", dayValue: 1, data: [{available: true, id: 200, start: '0000', end: '2359'}]},
              {dayName: "Tuesday", abbrName:"Tue", dayValue: 2, data: [{available: true, id: 300, start: '0000', end: '2359'}]},
              {dayName: "Wednesday", abbrName:"Wed", dayValue: 3, data: [{available: true, id: 400, start: '0000', end: '2359'}]},
              {dayName: "Thursday", abbrName:"Thu", dayValue: 4, data: [{available: true, id: 500, start: '0000', end: '2359'}]},
              {dayName: "Friday", abbrName:"Fri", dayValue: 5, data: [{available: true, id: 600, start: '0000', end: '2359'}]},
              {dayName: "Saturday", abbrName:"Sat", dayValue: 6, data: [{available: true, id: 700, start: '0000', end: '2359'}]},
            ],

             // Integrated version 1.0.0
             hidden: false,
             toBeDeleted: false,
             deleteDate: null,
             visits: 0,
            
             verificationSent: false,
             directDepositProvided: false,
        }
    }

    async componentDidMount(){
      // Set Status Bar page info here!
      const db = firestore();
      const ref = db.collection("spaces").doc();

      LogBox.ignoreLogs(['VirtualizedLists should never be nested'])

      
     

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

     



      // this.props.navigation.navigate("BankLinkNavigator")
    }

 



    pickImage = async () => {
      
      ImagePicker.openPicker({
        mediaType: "photo",
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").width / 1.78,
        compressImageQuality: 0.8,
        cropping: true
      }).then(image => {
        this.setState({imageUploading: true, photo: image.path})
      }).then(() => {
        this.setState({imageUploading: false, changesMade: true})
      }).catch(e => {
        Alert.alert('Photo Permission Required',
        "Allow access to photos in settings to upload a new photo",
            [
                { text: 'Manage Photo Permissions', onPress: () =>{
                    Linking.openSettings();
                }},
                { text: 'Cancel' },
            ])
        this.setState({imageUploading: false})
      })
    };


    launchCamera = async () => {
      ImagePicker.openCamera({
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").width / 1.78,
        compressImageQuality: 0.8,
        cropping: true
      }).then(image => {
        this.setState({imageUploading: true, photo: image.path})
      }).then(() => {
        this.setState({imageUploading: false, changesMade: true})
      }).catch(e => {
        Alert.alert('Camera Permission Required',
            "Allow access to camera in settings to upload a new photo",
            [
                { text: 'Manage Camera Permissions', onPress: () =>{
                    Linking.openSettings();
                }},
                { text: 'Cancel' }
            ])
        this.setState({imageUploading: false})
      })
  }



  uploadImage = async (uri) => {
    const db = firestore();
    const doc = db.collection('users').doc(this.props.UserStore.userID);



      const response = await fetch(uri)
      const blob = await response.blob()

      const storageRef = await storage().ref().child("listings/" + this.state.postID + '/main')

     await storageRef.put(blob)

     const url = await storageRef.getDownloadURL();

      this.setState({photo: url})
     
      // const url = uploadTask.getDownloadURL();
        
      // this.setState({photo: url})
      // return url
          
    



     
    
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

                this.props.UserStore.directDepositInfo = {
                  type: result.card.BankInfo.object,
                  id: result.card.BankInfo.id,
                  fingerprint: result.card.BankInfo.fingerprint,
                  payoutMethods: result.card.BankInfo.available_payout_methods,
                  number: result.card.BankInfo.last4,
                  CardType: result.card.BankInfo.brand,
                }
              
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

  verifyInputs = () => {

    const nameValidation = /^[A-Za-z0-9]+[A-Za-z0-9 %&\-,()]+[A-Za-z0-9]{1}$/
    const bioValidation =  /^[A-Za-z0-9]{1}[A-Za-z0-9 .?!;,\-()$@%&]{1,299}$/;

    let nameValid = nameValidation.test(this.state.spaceName)
    let bioValid = this.state.spaceBio.split("").length > 0 ? bioValidation.test(this.state.spaceBio) : true;

    if(this.state.searchedAddress && this.state.addressError.split("").length){
      this.setState({addressError: ""})
    }else{
      this.setState({addressError: "Provide a valid street address"})
    }

    if(this.state.spacePrice){
      let spaceCentsArray = this.state.spacePrice.split(".")
      let spaceCents = parseInt(spaceCentsArray[0].slice(1) + spaceCentsArray[1])
        if(spaceCents > 0){
          this.setState({spacePriceValid: true, priceError: ''})
          // console.log("Price is valid")
        }else{
          this.setState({spacePriceValid: false, priceError: 'Price must be greater than $0.00'})
          // console.log("Price must be greater than $0.00")
        }
    }else{
      this.setState({spacePriceValid: false, priceError: 'Add an hourly price'})
      // console.log("Add a price per hour")
    }

    if(nameValid && this.state.spaceName.length > 0){
      this.setState({nameValid: true, nameError: ''})
    }else{
      this.setState({nameValid: false})
      if(this.state.spaceName.length == 0){
        this.setState({nameError: 'Add a name to your space'})
      }else if(!nameValid){
        this.setState({nameError: 'Avoid using special characters outside of %&-,()'})
      }
      
    }

    if(bioValid){
      this.setState({bioValid: true, bioError: ''})
    }else{
      this.setState({bioValid: false, bioError: 'Avoid use of special characters outside of .?!;-,()$@%&'})
    }
  }

  submitSpace = async() => {
    
    await this.verifyInputs();

    

    const db = firestore();

    // Create a GeoFirestore reference
    const GeoFirestore = geofirestore.initializeApp(db);   

    // Create a GeoCollection reference
    const geocollection = GeoFirestore.collection('listings');
 



      if(this.state.searchedAddress && this.state.spacePrice && this.state.nameValid && this.state.bioValid && this.state.photo){

       

        // console.log(`${this.state.address.number} ${this.state.address.street}${this.state.address.box && this.state.address.box.split('').length > 0 ? " APT #" + this.state.address.box :""}, ${this.state.address.city}, ${this.state.address.state_abbr} ${this.state.address.zip}...${this.state.address.country}`)
        // console.log(`${this.state.address.spaceNumber}`)
                await this.uploadImage(this.state.photo)
                this.setState({savingSpace: true})
                try{  

                let spaceCentsArray = this.state.spacePrice.split(".")
                let spaceCents = parseInt(spaceCentsArray[0].slice(1) + spaceCentsArray[1])

                let createdTime = new Date().getTime();
                 
                 
                 await this.setState({savingSpace: true})

                 await db.collection("users").doc(this.props.UserStore.userID).update({
                    listings: firestore.FieldValue.arrayUnion(
                      this.state.postID
                    )
                 })
                 
                 await geocollection.doc(this.state.postID).set({
                      coordinates: new firestore.GeoPoint(this.state.region.latitude, this.state.region.longitude),
                      listingID: this.state.postID,
                      hostID: this.props.UserStore.userID,
                      address: this.state.address,
                      timezone: this.state.timezone,
                      region: this.state.region,
                      photo: this.state.photo,
                      spaceName: this.state.spaceName,
                      spaceBio: this.state.spaceBio,
                      spacePrice: this.state.spacePrice,
                      spacePriceCents: spaceCents,
                      numSpaces: this.state.numSpaces,
                      availability: this.state.daily,
                      created: createdTime,
                      hidden: false,
                      toBeDeleted: false,
                      deleteDate: null,
                      visits: []
               })

               // add space to mobx UserStore
               await this.props.UserStore.listings.push({
                  listingID: this.state.postID,
                  hostID: this.props.UserStore.userID,
                  address: this.state.address,
                  timezone: this.state.timezone,
                  region: this.state.region,
                  photo: this.state.photo,
                  spaceName: this.state.spaceName,
                  spaceBio: this.state.spaceBio,
                  spacePrice: this.state.spacePrice,
                  spacePriceCents: spaceCents,
                  numSpaces: this.state.numSpaces,
                  availability: this.state.daily,
                  created: createdTime,
                  hidden: false,
                  toBeDeleted: false,
                  deleteDate: null,
                  visits: [],
               })

                  // navigate back to profile
                  this.props.navigation.navigate("Profile")
                  this.setState({savingSpace: false})
                }catch{
                  this.setState({savingSpace: false})
                }
                
            
               
               
              
           
                

      }else{
        this.setState({savingSpace: false})
      }
  
     
      // console.log(`The price is ${this.state.spacePrice}`)
    }
    
  


  availabilityCallbackFunction = (data) => {
    this.setState({daily: data})
  }

  timezonePicker = (offset) => {
    let gmtValue = null;

    let dstActive = isDSTObserved();

  
  // If it is not UTC 0
  if(offset !== 0){
    let gmtOffset = dstActive ? (offset-60)/60 : offset/60;
    let gmtAbs = Math.abs(gmtOffset)
    // If the GMT offset is one whole number
    if(gmtAbs.toString().length == 1){
      // If ahead of GMT
      if(gmtOffset > 0){
        gmtValue = `GMT+0${gmtAbs}:00`
        // If behind GMT
      }else{
        gmtValue = `GMT-0${gmtAbs}:00`
      }
    // If GMT offset is longer than one whole number
    }else{
      // Check if whole number
      if(gmtOffset % 1 == 0){
        // If ahead of GMT
        if(gmtOffset > 0){
          gmtValue = `GMT+${gmtAbs}:00`
          // If behind GMT
        }else{
          gmtValue = `GMT-${gmtAbs}:00`
        }
      // Offset it not a whole number
      }else{
          let gmtSplit = gmtOffset.toString().split(".")
          let hours = parseInt(gmtSplit[0])
          let minutes = parseFloat(gmtOffset - hours) * 60
          
          if(hours.toString().length == 1){
            // If ahead of GMT
            if(gmtOffset > 0){
              gmtValue = `GMT+0${hours}:${minutes}`
              // If behind GMT
            }else{
              gmtValue = `GMT-0${hours}:${minutes}`
            }
          }else{
             // If ahead of GMT
             if(gmtOffset > 0){
              gmtValue = `GMT+${hours}:${minutes}`
              // If behind GMT
            }else{
              gmtValue = `GMT-${hours}:${minutes}`
            }
          }
       }   
    }
  }else{
    gmtValue = `GMT`
  }

  let deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  let tzdbArray = Timezones.filter(x => x.offset === gmtValue)
  let tzDB = tzdbArray.filter(x => x.name === deviceTimeZone)
  let timeZoneDB;
  
    if(tzDB.length > 0){
      timeZoneDB = tzDB[0]
    }else{
      timeZoneDB = tzdbArray[0]
    }

    return timeZoneDB
  }

  addressCallbackFunction  = (childData) => {

    if(childData){
        this.setState({
            searchedAddress: true,
            timezone: this.timezonePicker(childData.utc_offset),
            address:{
                ...this.state.address,
                full: childData.address.full,
                number: childData.address.line1.split(" ")[0],
                street: childData.address.line1.split(",")[0].split(" ").slice(1).join(" "),
                city: childData.address.city,
                county: childData.address.county,
                state: childData.address.state,
                state_abbr: childData.address.state_abbr,
                country: childData.address.country_abbr,
                zip: childData.address.zip,
            },
            region:{
              latitude: childData.region.latitude,
              longitude: childData.region.longitude,
              latitudeDelta: childData.region.latitudeDelta,
              longitudeDelta: childData.region.longitudeDelta
            },
        })
     }else{
       this.setState({
         searchedAddress: false
       })
     }
}

  resendVerification = () => {
    const user = auth().currentUser;
    user.sendEmailVerification().then(() => {
        this.setState({verificationSent: true})
    }).catch((e) => {
        alert(e)
    })
}
   


       
   

     componentWillUnmount() {
      this._isMounted = false;

       }

      getCoordsFromName(loc) {
        this.setState({
          latitude: loc.lat,
          longitude: loc.lng,
        })
      }

      imageBrowserCallback = (callback) => {
        callback.then((photos) => {
  
          this.setState({
            imageBrowserOpen: false,
            photos: photos,
          })
        }).catch((e) => console.log(e))
      }



  render() {

    // var numSpacesArray = Array.from(Array(10), (_, i) => i + 1)
    if(auth().currentUser.emailVerified && this.state.directDepositProvided && this.props.UserStore.ssnProvided && this.props.UserStore.address !== {}){
    return (
      <KeyboardAwareScrollView
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustContentInsets={false}
      nestedScrollEnabled={true}
      contentContainerStyle={{ flexGrow: 1, backgroundColor: 'white' }} scrollEnabled
      enableOnAndroid={true}
      extraScrollHeight={150} //iOS
      extraHeight={135} //Android
      >        
       
          <View style={styles.numHoriz}>
            <View style={styles.numContainer}>
              <Text style={styles.number} type="bold">1</Text>
            </View>
            <Text style={styles.numTitle}>Add Your Address</Text>
          </View>
          
          <View style={{flex: 1, paddingHorizontal: 16}}>
            <Text style={styles.label}>Address</Text>
            {/* Needed to prevent error with scrollview and flatlist */}
            
            <View style={{zIndex: 999999999}}>
                <AddressInput 
                  returnValue={this.addressCallbackFunction}

                />
              </View>
            <View style={{flex: 1, flexDirection: "row"}}>
            <Input
            flex={0.35}
            placeholder='107'        
            label= "Apt # (optional)"
            name="Apartment number" 
            style={{marginRight: 16}}                
            onChangeText= {(number) => this.setState(prevState => ({
              address:{
                ...prevState.address,
                box: number,
              }
            }))}
            value={this.state.address.box}
            maxLength = {6}
            keyboardType='number-pad'/>
            <Input
            flex={0.45}
            placeholder='32'        
            label= "Space # (optional)"
            name="Space number"                 
            onChangeText= {(number) => this.setState(prevState => ({
              address:{
                ...prevState.address,
                spaceNumber: number,
              }
            }))}
            value={this.state.address.spaceNumber}
            maxLength = {6}
            keyboardType='number-pad'/>
            </View>
          </View>
          <MapView
            provider={MapView.PROVIDER_GOOGLE}
            mapStyle={NightMap}
            style={styles.mapStyle}
            region={{
              latitude: this.state.region.latitude ? this.state.region.latitude : 37.8020,
              longitude: this.state.region.longitude ? this.state.region.longitude : -122.4486,
              latitudeDelta: this.state.region.latitudeDelta ? this.state.region.latitudeDelta : 0.025,
              longitudeDelta: this.state.region.longitudeDelta ? this.state.region.longitudeDelta : 0.025,
            }}
            pitchEnabled={false} 
            rotateEnabled={false} 
            zoomEnabled={false} 
            scrollEnabled={false}
            >
              {this.state.searchedAddress ?
              <Marker 
                coordinate={{
                  latitude: this.state.region.latitude,
                  longitude: this.state.region.longitude
                }}   
              />
              : null }
            </MapView>

            <View style={styles.numHoriz}>
            <View style={styles.numContainer}>
              <Text style={styles.number} type="bold">2</Text>
            </View>
            <Text style={styles.numTitle}>Stand Out!</Text>
          </View>
          <View style={{paddingHorizontal: 16}}>
            <Input 
              placeholder='Name your space...'         
              label="Space Name"
              name="space name"                 
              onChangeText= {(spaceName) => this.setState({spaceName})}
              value={this.state.spaceName}
              maxLength = {40}
              keyboardType='default'
              error={this.state.nameError}
            />
             <Input 
              placeholder='Add a bio...'         
              label="Space Bio (optional)"
              name="space bio"                 
              onChangeText= {(spaceBio) => this.setState({spaceBio})}
              value={this.state.spaceBio}
              mask="multiline"
              numLines={4}
              maxLength = {300}
              keyboardType='default'
              error={this.state.bioError}
            />
            
          </View>
          <View style={styles.numHoriz}>
            <View style={styles.numContainer}>
              <Text style={styles.number} type="bold">3</Text>
            </View>
            <Text style={styles.numTitle}>Upload Photo</Text>
          </View>
          <View style={{paddingHorizontal: 16}}>
            <View style={{display: "flex", flexDirection: 'row', marginBottom: 16}}>
              <Button style={this.state.photo ? {flex: 1, marginLeft: 8, backgroundColor: Colors.mist900} :{flex: 1, marginLeft: 8, backgroundColor: "#FF8708"}} textStyle={ this.state.photo ? {color: Colors.cosmos300} : {color:"#FFFFFF"}} disabled={this.state.photo ? true : false} onPress={() => this.pickImage()}>Add Photo</Button>
              <Button style={this.state.photo ? {flex: 1, marginLeft: 8, backgroundColor: Colors.mist900} :{flex: 1, marginLeft: 8, backgroundColor: "#FF8708"}} textStyle={ this.state.photo ? {color: Colors.cosmos300} : {color:"#FFFFFF"}} disabled={this.state.photo  ? true : false} onPress={() => this.launchCamera()}>Take Photo</Button>
            </View>
          {/* <Text>Upload Pictures</Text> */}
          {/* <View style={{display: 'flex', flexDirection: 'row', marginBottom: 16}}> */}
              {/* <Button style={{flex: 1, marginRight:4, backgroundColor: "#FF8708"}} textStyle={{color:"#FFFFFF"}} onPress={() => alert("Something...")}>Upload Image</Button>
              <Button style={{flex: 1, marginLeft:4, borderColor: "#FF8708", borderWidth: 3}} textStyle={{color:"#FF8708"}} onPress={() => alert("Something...")}>Take Photo</Button> */}
            {/* </View> */}
            {this.state.photo ? 
            <View>
              <View style={{position: "absolute", top: 8, right: 8, zIndex: 999, padding: 4, backgroundColor: 'rgba(54, 55, 59, 0.7)', borderRadius: Dimensions.get('window').width/2}}>
                <Icon 
                  iconName="x"
                  iconColor={Colors.mist300}
                  iconSize={24}
                  onPress={() => this.setState({photo: null})}
                />
              </View>
              <Image 
                style={{width: Dimensions.get("window").width - 32}}
                aspectRatio={16/9}
                source={{uri: this.state.photo}}
                backupSource={require('../assets/img/Logo_001.png')}
                resizeMode={'cover'}
              /> 
              </View>
              : null}
          
            
            </View>


            {/* <Input 
              placeholder='Please park to the far right of the driveway...'         
              label="Message for Guests (optional)"
              name="guest message"                 onChangeText= {(spaceName) => this.setState({spaceName})}
              value={this.state.spaceName}
              mask="multiline"
              numLines={4}
              maxLength = {300}
              keyboardType='default'
              // error={}
            /> */}
            <View style={styles.numHoriz}>
              <View style={styles.numContainer}>
                <Text style={styles.number} type="bold">4</Text>
              </View>
              <Text style={styles.numTitle}>Choose your price</Text>
            </View>
          <View style={{paddingHorizontal: 16}}>
            <Input 
                placeholder='$1.25'         
                label="Cost Per Hour"
                name="cost"             
                onChangeText= {(spacePrice) => this.setState({spacePrice})}
                value={this.state.spacePrice}
                mask="USD"
                maxLength = {6}
                keyboardType='default'
                suffix="/hr"
                rightText={`Deposited to ${this.props.UserStore.directDepositInfo.type.toUpperCase() == "BANK ACCOUNT" ? "Bank" : "Card"} ${this.props.UserStore.directDepositInfo.number}`}
                error={this.state.priceError}
              />
            </View>

            <View style={styles.numHoriz}>
              <View style={styles.numContainer}>
                <Text style={styles.number} type="bold">5</Text>
              </View>
              <Text style={styles.numTitle}>Space Availability</Text>
            </View>
            <View style={{paddingHorizontal: 16}}>
              <DayAvailabilityPicker 
                listing={null}
                availability={this.state.daily}
                availabilityCallback={this.availabilityCallbackFunction}
                >
              </DayAvailabilityPicker>
              {/* <SectionList 
              sections={this.state.daily}
              keyExtractor={(item, index) => index}  
              horizontal={false}
              renderSectionHeader={({section}) => (
                  <View style={{padding: 12, backgroundColor: '#efefef'}}>
                   <Text style={styles.dayHead}>{section.dayName}</Text>
                  </View>
              )}  
              renderItem={({item}) => (
                <View style={{display: 'flex', flexDirection: 'row', marginTop: 24}}> 
                  <Text>{item.start}</Text>
                  <Text>{item.end}</Text>
                  <Text>{item.start}</Text>
                  <Text>{item.end}</Text>
                </View>
              )}  
                
              /> */}
              {/* <FlatList
                style={{paddingVertical: 8}}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.dayName} 
                data={this.state.daily}
                snapToAlignment={"start"}
                snapToInterval={Dimensions.get("window").width * 0.7 + 32}
                decelerationRate={"fast"}
                pagingEnabled
                renderItem={({ item }) => { return (
                  <Card elevation={5} style={{width: Dimensions.get("window").width * 0.7, marginHorizontal: 16}}>
                      <Card.Title style={styles.dayHead} title={item.dayName} />
                      <Card.Content>
                      <View style={{display: 'flex', flexDirection: 'row'}}>
                        <View style={{display: 'flex', flex: 1, flexDirection: 'column'}}>
                          <Text>Start</Text>
                          {item.data.map((x, i) => (
                          <Text key={item.data[i].id}>{parseInt(item.data[i].start)}</Text>
                          ))}
                        </View>
                        <View style={{display: 'flex', flex: 1, flexDirection: 'column'}}>
                          <Text>End</Text>
                          {item.data.map((x, i) => (
                          <Text key={item.data[i].id}>{parseInt(item.data[i].end)}</Text>
                          ))}
                        </View>
                        <View style={{display: 'flex', flex: 1, flexDirection: 'column'}}>
                          <Text>Availability</Text>
                          {item.data.map((x, i) => (
                            <Switch key={item.data[i].id} value={item.data[i].available}/>
                          ))}
                        </View>
                      </View>
                      </Card.Content>
                  </Card>
                )}}
              /> */}
              <Button disabled={this.state.savingSpace} onPress={() => this.submitSpace()}>Add Photo</Button>

            </View>
            
      </KeyboardAwareScrollView>
    );
    }else if(!this.props.UserStore.ssnProvided || this.props.UserStore.address === {}){
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
          <Text style={{textAlign: "center"}}>You must add an address, SSN and payment method before creating your first parking space.</Text>
          <Button disabled={this.state.verificationSent} style={this.state.verificationSent ? {backgroundColor: Colors.fortune500} : {backgroundColor: Colors.tango900}} textStyle={{color: Colors.mist300}}  onPress={() => this.props.navigation.navigate("AddressAndSSN")}>Complete Profile</Button>
        </ScrollView>
      )
    }else if(!this.state.directDepositProvided){
      return(
        <ScrollView 
         style={{backgroundColor: "white", paddingHorizontal: 16}} 
         contentContainerStyle={{flex: 1}}
        > 
   
          <View style={styles.container}>
          {/* <LinearGradient colors={[Colors.apollo500, Colors.apollo700]} style={styles.creditCard}>
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
            
            <Button style={{backgroundColor: Colors.apollo700}} disabled={this.state.authenticating} textStyle={{color: 'white'}} onPress={() => this.submitPayment()}>{this.state.authenticating ? null : "Save Bank Account"}</Button> */}


          <Icon 
            iconName="alternate-email"
            iconLib="MaterialIcons"
            iconColor={Colors.cosmos500}
            iconSize={120}
            style={{marginBottom: 16}}
          />
          <Text style={{textAlign: "center"}}>Let's link a bank account.</Text>
          <Button style={this.state.verificationSent ? {backgroundColor: Colors.fortune500} : {backgroundColor: Colors.tango900}} textStyle={{color: Colors.mist300}}  onPress={() => this.props.navigation.navigate("BankLinkNavigator")}>Link Bank Account</Button>    
            
          </View>
          
         
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
          <Text style={{textAlign: "center"}}>To list a space, you must verify your email at {this.props.UserStore.email}.</Text>
          <Button disabled={this.state.verificationSent} style={this.state.verificationSent ? {backgroundColor: Colors.fortune500} : {backgroundColor: Colors.tango900}} textStyle={{color: Colors.mist300}}  onPress={() => this.resendVerification()}>{this.state.verificationSent ? "Email Sent" : "Resend Verification Email"}</Button>
        </ScrollView>
      )
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
  mapStyle: {
    width: Dimensions.get('window').width,
    zIndex: -999,
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
  

export default addSpace