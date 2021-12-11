
import React from 'react';
import { ActivityIndicator, StyleSheet, StatusBar, Platform, View, ScrollView, SafeAreaView, Dimensions, Image, Pressable} from 'react-native';
import {requestLocationAccuracy, check ,PERMISSIONS, openSettings, checkMultiple, checkNotifications} from 'react-native-permissions';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Checkbox } from 'react-native-paper';

import Text from '../../components/Txt'
import Icon from '../../components/Icon'
import Colors from '../../constants/Colors'
import Input from '../../components/Input'
import Button from '../../components/Button'
import FloatingCircles from '../../components/FloatingCircles'
import { checkPermissionsStatus } from '../../functions/in-app/permissions'

import config from 'react-native-config'
import { version } from '../../package.json'

import logo from '../../assets/img/Logo_001.png'

//MobX Imports
import { inject, observer } from 'mobx-react'
import UserStore from '../../stores/userStore'
import ComponentStore from '../../stores/componentStore'


// Firebase imports
// import * as firebase from 'firebase'
import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import 'firebase/firestore';
import 'firebase/auth';



const providers = {
  googleProvider: new firebase.auth.GoogleAuthProvider(),
};



// Regex to check name and phone are valid at sign in
const regexFullname = /[^0-9]([a-zA-Z]{1,})+[ ]+([a-zA-Z-']{2,})*$/gi;
const regexPhone = /^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*$/;

// Vars that prevent continuing since this is not built into firebase natively
let nameValid = false;
let phoneValid = false;
let dobValid = false;

@inject("UserStore")
@observer
export default class Authentication extends React.Component {
  constructor(){
    super();
    this._isMounted = false;
    
    

    this.state = {
      email: '',
      password: '',
      password2: '',
      fullname: '',
      phone: '',
      stripeID: 'invalid',
      authenticating: false,
      toggleLogIn: false,
      agreedToTOS: "unchecked",

      // Errors that may show if firebase catches them.
      emailError: '',
      passwordError: '',
      fullnameError: '',
      dobError: '',
      phoneError: '',
    }
  }


  async componentDidMount(){
    // Remove after testing!!
    // this.setState({email: 'admin@riive.net', password: 'Fallon430'})
    // this.props.UserStore.email = 'admin@riive.net'
    // this.props.UserStore.password = "Fallon430"



      // Set Status Bar page info here!
   this._navListener = this.props.navigation.addListener('didFocus', async() => {
    StatusBar.setBarStyle('dark-content', true);
    Platform.OS === 'android' && StatusBar.setBackgroundColor('white');



   
  });

    this._isMounted = true;
    this.forceUpdate();



  




 

  }

  componentWillUnmount() {
    // Unmount status bar info
  //  this._navListener.remove();
  }

  createStripeCustomer = async() => {
    let res = null;
    let error = null;
    const settings = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: this.props.UserStore.fullname,
        email: this.props.UserStore.email,
        phone: this.props.UserStore.phone,
        FBID: auth().currentUser.uid,
        dob: this.props.UserStore.dob,
      })
    }
    
    await fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/addCustomer`, settings).then((res) => {
        let data = res.json()
        // console.log(`fnRes: ${JSON.stringify(res)}`)
        // console.log(`fnResStatus: ${res.status}`)
        if(res.status === 200){
          return data
        }else{
          switch(res.status) {
            case 400: 
              error = new Error(`One or more of your account details is wrong. Please ensure your phone number, date of birth and email are correct. Contact us at support@riive.net for more information.`)
              error.code = res.status;
              throw error
            case 401:
              error = new Error(`Stripe API error. Contact support@riive.net for more help.`);
              error.code = res.status;
              throw error
            case 402:
              error = new Error(`Request failed to contact Stripe servers.`)
              error.code = res.status;
              throw error
            case 403:
              error = new Error(`Permissions forbidden for API key. Please contact support@riive.net for more help.`);
              error.code = res.status;
              throw error
            case 404:
              error = new Error(`Requested resource does not exist`)
              error.code = res.status;
              throw error
            case 409:
              error = new Error(`There was a conflict with another request from the same user`);
              error.code = res.status;
              throw error
            case 429:
              error = new Error(`Too many requests made. Please try again soon.`);
              error.code = res.status;
              throw error
            default:
              error = new Error(`Something went wrong on Stripe's end. Please contact us at support@riive.net for more help.`);
              error.code = res.status;
              throw error
          }
        }
      }).then(body => {
        // console.log(body.stripeConnectID)
        this.props.UserStore.stripeID = body.stripeID;
        this.props.UserStore.stripeConnectID = body.stripeConnectID;
        res = body;
        return body
      }).catch(e => {
        res = error;
        throw error
      })

      return res
      
  }


  setPermissions = () => {
    checkPermissionsStatus().then(res => {
      this.props.UserStore.permissions = res;
    })
  }

  getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  }


  // Sign up authorization with email and password
  // also sends an email verification to the user
  onPressSignUp = () => {

    let namevalid = null;
    let phoneValid = null;
    let passwordValid = null;

     // Begin ActivityIndicator since auth == true
    this.setState ({ authenticating: true})

      // Checks if full name is in format of Firstname Lastname
      if(this.props.UserStore.fullname.match(regexFullname)){
        // alert('name valid')
        this.setState({fullnameError: ''})
        nameValid = true;
      }else{
        // alert('name invalid')
        this.setState({
          fullnameError: 'Please provide first and last name with a space.',
          authenticating: false
        });
        namevalid = false;
      }  

      // Checks phone for valid format (accepts many formats)
      if(this.props.UserStore.phone.match(regexPhone)){
        // alert('name valid')
        this.setState({phoneError: ''})
        phoneValid = true;
      }else{
        // alert('name invalid')
        this.setState({
          phoneError: 'Please provide a proper 10 digit phone number.',
          authenticating: false
        });
        phoneValid = false;
      }  

      

      // Checks DOB for valid format
      let month = parseInt(this.props.UserStore.dob.split("/")[0]) || 0
      let day = parseInt(this.props.UserStore.dob.split("/")[1]) || 0
      let year = parseInt(this.props.UserStore.dob.split("/")[2]) || 0



      if(month <= 12 && month.toString() !== "0" && day <= this.getDaysInMonth(year, month) && day.toString() !== "0" && year > 1900 && year < new Date().getFullYear() - 15){
        this.setState({dobError: ''})
        dobValid = true;
      }else{
        if(year !== 0 && year < 1900 || year > new Date().getFullYear() - 15){
          this.setState({
            dobError: 'Please ensure your year is valid and you are 16 or older',
          })
        }else if(day !== 0 && day > this.getDaysInMonth(year, month) || day.toString() == "0"){
          this.setState({
            dobError: 'Please ensure your day is valid.',
          })
        }else if(month !== 0 && month > 12 || month.toString() == "0"){
          this.setState({
            dobError: 'Please ensure your month is valid.',
          })
        }else{
          this.setState({
            dobError: 'Please ensure your date is in the proper format (MM/DD/YYYY).',
          })
        }
        this.setState({authenticating: false})
        dobValid = false;
      }

      if(this.props.UserStore.password === this.props.UserStore.password2){
        passwordValid = true;
      }else{
        this.setState({
          passwordError: 'Please ensure your passwords match.',
        })
        this.setState({authenticating: false})
        passwordValid = false;
      }


      

    // If vars are true and valid beguin creating user
    if(nameValid && phoneValid && dobValid && passwordValid){

     
    
     auth().createUserWithEmailAndPassword(this.props.UserStore.email, this.props.UserStore.password).then(async(userCredentials) => {
        // RETURN ALL THIS IF EMAIL AND PASSWORD ARE TRUE

       
        this.setState({
          emailError: '',
          passwordError: '',
          fullnameError: '',
          phoneError: '',
        })  

        

        
        // Updates user's displayName in firebase auth
        if(userCredentials.user){
          this.props.UserStore.userID = auth().currentUser.uid;
           userCredentials.user.updateProfile({
            displayName: this.props.UserStore.fullname
           })
           userCredentials.user.updateEmail(this.props.UserStore.email).then(() => {
                this.props.UserStore.joinedDate = auth().currentUser.metadata.creationTime
                // IMPORTANT!!! Defines user location in database
                this.props.UserStore.userID = auth().currentUser.uid;
              }).then(() => {
                //start firestore
                const db = firestore();
                const doc = db.collection('users').doc(this.props.UserStore.userID);

                doc.get().then((docData) => {
                    db.collection("users").doc(this.props.UserStore.userID).set({
                      id: auth().currentUser.uid,
                      fullname: this.props.UserStore.fullname,
                      firstname: this.props.UserStore.firstname,
                      lastname: this.props.UserStore.lastname,
                      email: this.props.UserStore.email,
                      phone: this.props.UserStore.phone,
                      dob: this.props.UserStore.dob,
                      primaryAddress: null,
                      totalNumTimesParked: 0,
                      numTimesOpenedApp: 1,
                      listings: [],
                      vehicles: [],
                      payments: [],
                      trips: [],
                      photo: '',
                      joined_date: auth().currentUser.metadata.creationTime,
                      last_update: auth().currentUser.metadata.creationTime,
                      disabled: {
                        isDisabled: false,
                        disabledEnds: new Date().getTime() / 1000,
                        numTimesDisabled: 0,
                      },
                      deleted: {
                        isDeleted: false,
                        toBeDeleted: false,
                        deletedStarts: new Date().getTime() / 1000,
                      },
                      pushTokens: [],
                      ssnProvided: false,
                      primaryAddress: {},
                      directDeposit: {},
                      permissions: {
                        notifications: {
                          discountsAndNews: true,
                          tripsAndHosting: true,
                        }
                      },
                      versions: [{
                        code: version,
                        dateAdded: new Date(),
                        major: parseInt(version.split(".")[0]),
                        minor: parseInt(version.split(".")[1]),
                        patch: parseInt(version.split(".")[2])
                      }]
                    })
                return docData
              }).then((doc) => {
                    // console.log(doc.data())
                    this.props.UserStore.loggedIn = true;
                    this.props.UserStore.fullname = this.props.UserStore.fullname;
                    this.props.UserStore.phone = this.props.UserStore.phone;
                    this.props.UserStore.dob = this.props.UserStore.dob,
                    this.props.UserStore.stripeID = "";
                    this.props.UserStore.stripeConnectID = "";
                    this.props.UserStore.directDepositInfo = {};
                    this.props.UserStore.photo = "";
                    this.props.UserStore.joinedDate = auth().currentUser.metadata.creationTime;
                    this.props.UserStore.lastUpdate = auth().currentUser.metadata.creationTime;
                    this.props.UserStore.vehicles = [];
                    this.props.UserStore.listings = [];
                    this.props.UserStore.reports = [];
                    this.props.UserStore.payments = [];
                    this.props.UserStore.trips = [];
                    this.props.UserStore.searchHistory = [];
                    this.props.UserStore.disabled = false;
                    this.props.UserStore.deleted = false;
                    this.props.UserStore.pushTokens = [];
                    this.props.UserStore.ssnProvided = false;
                    this.props.UserStore.address = {};
                    this.props.UserStore.versions = [{
                      versions: [{
                        code: version,
                        dateAdded: new Date(),
                        major: parseInt(version.split(".")[0]),
                        minor: parseInt(version.split(".")[1]),
                        patch: parseInt(version.split(".")[2])
                      }]
                    }]
                    // this.props.UserStore.permissions = {
                    //   notifications: {
                    //     discountsAndNews: true,
                    //     tripsAndHosting: true,
                    //   }
                    // }
                    
                  }).then(() => {
                    // alert('Welcome to Riive ' + this.props.UserStore.firstname + '!')
                    this.setPermissions();
                  
     
                  // ID if user signed in via email or google
                  this.props.UserStore.signInProvider = auth().currentUser.providerData[0].providerId;
     
     
              }).then(async() => {
                return await this.createStripeCustomer()

              }).then((res) =>  {
                // console.log(`res is: ${res}`)
                // Sends email to valid user
                auth().currentUser.sendEmailVerification()
                this.setState({ authenticating: false});
                this.props.navigation.navigate('Home')
              })
              .catch((e) => {
                alert('Whoops! We ran into an issue creating your account. ' + e.message)
                firestore().collection("users").doc(auth().currentUser.uid).delete()
                auth().currentUser.delete();
              })
        
                  
          
        })
      }
    }).catch(e => {
      // Handle Errors here.
      var errorCode = e.code;
      var errorMessage = e.message;
      this.setState ({ authenticating: false})
      // alert(errorCode + ': ' + errorMessage)
      if(errorCode == 'auth/invalid-email'){
        this.setState({
          emailError: 'Email format must be name@domain.com',
          passwordError: '',

        })
      }else if (errorCode == 'auth/email-already-in-use'){
        this.setState({
          emailError: 'Email is already in use with another account.',
          passwordError: '',

        })
      }else if (errorCode == 'auth/weak-password'){
        this.setState({
          emailError: '',
          passwordError: 'Password must be longer than 5 characters.',

        })
      }else{
        console.log(e)
        // alert(e);
      }
    })
  }
}


renderCurrentState() {
  if(this.state.authenticating || this._isMounted === false){
    return(
      <View style={[styles.form, {alignItems: 'center'}]}>
        {/* <ActivityIndicator size="large" color={Colors.cosmos300} /> */}
        <FloatingCircles color={Colors.tango500}/>
      </View>
    )
  }else{
    return(
     <ScrollView style={styles.form}>
        <Input 
        placeholder='Your name...'
        label="Full Name"
        name="full name"
        onChangeText= {(fullname) => this.props.UserStore.fullname = fullname}
        value={this.props.UserStore.fullname}
        maxLength = {40}
        keyboardType='default'
        error={this.state.fullnameError}
        />
        <Input 
        placeholder='05/31/1996'
        mask="mm/dd/yyyy"
        label="Date of Birth"
        name="DOB"
        onChangeText = {(dob) => this.props.UserStore.dob = dob}
        value={this.props.UserStore.dob}
        maxLength = {9}
        keyboardType='phone-pad'
        error={this.state.dobError}
        />
        <Input 
        placeholder='000-000-0000'
        mask='phone'
        label="Phone"
        name="phone"
        type="phone"
        onChangeText= {(phone) => this.props.UserStore.phone = phone}
        value={this.props.UserStore.phone}
        keyboardType='phone-pad'
        maxLength = {17}
        error={this.state.phoneError}
        />
        <Input 
        placeholder='Enter email...'
        label="Email"
        name="email"
        onChangeText= {(email) => this.props.UserStore.email = email}
        value={this.props.UserStore.email}
        keyboardType='default'
        maxLength = {55}
        error={this.state.emailError}
        />
        <Input 
        placeholder='Enter password...'
        label="Password"
        name="password"
        secureTextEntry
        onChangeText = {(password) => this.props.UserStore.password = password}
        value={this.props.UserStore.password}
        maxLength = {55}
        keyboardType='default'
        error={this.state.passwordError}
        />
        <Input 
        placeholder='Enter password...'
        label="Confirm Password"
        name="password2"
        secureTextEntry
        onChangeText = {(password) => this.props.UserStore.password2 = password}
        value={this.props.UserStore.password2}
        maxLength = {55}
        keyboardType='default'
        error={null}
        />
        <Pressable style={{height: 40, flexDirection: 'row', alignItems: 'center'}} onPress={() => { this.setState({agreedToTOS: this.state.agreedToTOS === "checked" ? "unchecked" : "checked"})}}>
          <Checkbox.Android
              status={this.state.agreedToTOS}
          />
          <Text style={{fontSize: 12}}>I agree to the <Text style={styles.tos} onPress={() => this.props.navigation.navigate("TOS")}>terms of service and privacy policy</Text>.</Text>
        </Pressable>
        <Button disabled={this.state.agreedToTOS !== "checked"} style={this.state.agreedToTOS !== "checked" ? {backgroundColor: Colors.cosmos300} : {backgroundColor: "#FF8708"}} textStyle={{color:"#FFFFFF"}} onPress = {() => this.onPressSignUp("HomeScreen")}>Sign Up</Button>
      </ScrollView>
    )
  }
  
}

  render() {

      return (
          <ScrollView 
            style={{backgroundColor: 'white'}}
            contentContainerStyle={{ flex: 1, justifyContent: 'center'}}
          >
            <KeyboardAwareScrollView  
                style={styles.primaryView} 
                contentContainerStyle={{justifyContent: 'center'}}
                behavior={"padding"} 
                keyboardVerticalOffset={60}
                enableOnAndroid={true}
                enableAutomaticScroll={(Platform.OS === 'ios')}
                extraHeight={220}
                enabled 
            >
              <Image source={logo} style={styles.img}/>
              {this.renderCurrentState()}
             </KeyboardAwareScrollView >
          </ScrollView>      
    
      )
    }
}

const styles = StyleSheet.create({
  primaryView:{
    flexGrow: 0,
    // backgroundColor: 'orange',
    overflow: 'visible',
    paddingHorizontal: 24,
    paddingBottom: 80
  },
  img:{
    width: 150,
    resizeMode: 'contain',
    alignSelf: 'center'
  },
  form: {
    // flexGrow: 1,
    // backgroundColor: 'green'
    // backgroundColor: 'orange',
  },
  tos:{
    fontSize: 12,
    textDecorationLine: 'underline',
    color: Colors.cosmos500
  },
  hyperlink: {
    color: 'blue',
    textDecorationLine: 'underline',
    fontSize: 18,
    alignSelf: 'center',
    marginTop: 24
  }
});