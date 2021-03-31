
import React from 'react';
import { ActivityIndicator, StyleSheet, StatusBar, Platform, View, ScrollView, SafeAreaView, Dimensions, KeyboardAvoidingView, Image, LogBox} from 'react-native';

import Text from '../components/Txt'
import Icon from '../components/Icon'
import Colors from '../constants/Colors'
import Input from '../components/Input'
import Button from '../components/Button'

import logo from '../assets/img/Logo_001.png'

//MobX Imports
import { inject, observer } from 'mobx-react/native'
import UserStore from '../stores/userStore'
import ComponentStore from '../stores/componentStore'


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
      fullname: '',
      phone: '',
      stripeID: 'invalid',
      authenticating: false,
      toggleLogIn: true,

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


    if (auth().currentUser !== null) {
      await this.getCurrentUserInfo();
      await this.forceUpdate();
    } else{
      this._isMounted = true;
      this.forceUpdate();
    }
  });

 

  }

  componentWillUnmount() {
    // Unmount status bar info
   this._navListener.remove();
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
    
    await fetch('https://us-central1-riive-parking.cloudfunctions.net/addCustomer', settings).then((res) => {
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

  // Resets the password of the state with email
  resetPassword = () =>{
    auth().sendPasswordResetEmail(this.props.UserStore.email).then(function() {
        alert('Check your email for a password reset link.')
      }).catch(function(error) {
        alert('Failed to send password reset. ' + error.message)
    });
  }
  
   // Toggles between sign in and sign up on same page.
   toggleSignInOrUp() {
    // resets the errors and password for security reasons
    this.setState({ 
      toggleLogIn: !this.state.toggleLogIn,
      password: '',
      emailError: '',
      passwordError: '',
      fullnameError: '',
      phoneError: '',
    
    })
  }


  getCurrentUserInfo = async() => {
    const db = firestore();

    const doc = db.collection('users').doc(auth().currentUser.uid);

    const searchHistoryRef = db.collection('users').doc(auth().currentUser.uid).collection('searchHistory');
    let searchHistory = new Array();

      this.props.UserStore.userID = auth().currentUser.uid;
      this.props.UserStore.email = auth().currentUser.email;
      this.props.UserStore.password = null;


   await searchHistoryRef.get().then((doc) => {
     if(!doc.empty){
        doc.forEach(doc =>{
          searchHistory.push(doc.data())
        })
      }
   })


    doc.get().then((doc) => {
      if (doc.exists){
              // alert(`${doc.id} => ${doc.data().fullname}`);
              this.props.UserStore.fullname = doc.data().fullname;
              this.props.UserStore.phone = doc.data().phone;
              this.props.UserStore.dob = doc.data().dob || null,
              this.props.UserStore.userID = doc.data().id;
              this.props.UserStore.stripeID = doc.data().stripeID;
              this.props.UserStore.stripeConnectID = doc.data().stripeConnectID;
              this.props.UserStore.photo = doc.data().photo;
              this.props.UserStore.joinedDate = auth().currentUser.metadata.creationTime;
              this.props.UserStore.last_update = doc.data().last_update;
              this.props.UserStore.vehicles = doc.data().vehicles;
              this.props.UserStore.listings = [];
              this.props.UserStore.trips = doc.data().trips;
              this.props.UserStore.payments = doc.data().payments;
              this.props.UserStore.searchHistory = searchHistory;
              this.props.UserStore.disabled = doc.data().disabled.isDisabled;
              this.props.UserStore.deleted = doc.data().deleted.toBeDeleted
              this.props.UserStore.pushTokens = doc.data().pushTokens || [];

              // ID if user signed in via email or google
              this.props.UserStore.signInProvider = auth().currentUser.providerData[0].providerId;
              
            
              var currentTime = firestore.Timestamp.now();

              // in case a user reverts their email change via profile update
              db.collection("users").doc(auth().currentUser.uid).update({
                last_update: currentTime,
                email: this.props.UserStore.email,
              })
              // Upon setting the MobX State Observer, navigate to home
              this.props.navigation.navigate('Home')
          
              return doc;


    }else{
      throw("No user found")
    }
  }).then((doc) => {
  const length = doc.data().listings.length;
    if( length > 0 && length <= 10){
      db.collection('listings').where(firestore.FieldPath.documentId(), "in", doc.data().listings).get().then((qs) => {
        let listingsData = [];
        for(let i = 0; i < qs.docs.length; i++){
          listingsData.push(qs.docs[i].data())
        }
        this.props.UserStore.listings = listingsData;
    }).then(() => this.props.navigation.navigate("Home"))


    }else if(length > 0 && length > 10){
    let listings = doc.data().listings;
    let allArrs = [];
    var listingsData = [];
    while(listings.length > 0){
      allArrs.push(listings.splice(0, 10))
    }

    for(let i = 0; i < allArrs.length; i++){
      db.collection('listings').where(firestore.FieldPath.documentId(), "in", allArrs[i]).get().then((qs) => {
        for(let i = 0; i < qs.docs.length; i++){
          listingsData.push(qs.docs[i].data())
        }
      }).then(() => {
        this.props.UserStore.listings = listingsData;
        this.props.navigation.navigate('Home')
      })
    }

  }else{
    this.props.navigation.navigate('Home')
  }
  
  }).then(() => {
    this._isMounted = true;
  }).catch((e) => {
    alert("Failed to grab user data. " + e)
  })


  }

  getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  }


  // Sign up authorization with email and password
  // also sends an email verification to the user
  onPressSignUp = () => {

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
      

    // If vars are true and valid beguin creating user
    if(nameValid && phoneValid && dobValid){
    
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
                    })
                return docData
              }).then((doc) => {
                    // console.log(doc.data())
                    this.props.UserStore.fullname = this.props.UserStore.fullname;
                    this.props.UserStore.phone = this.props.UserStore.phone;
                    this.props.UserStore.dob = this.props.UserStore.dob,
                    this.props.UserStore.stripeID = "";
                    this.props.UserStore.stripeConnectID = "";
                    this.props.UserStore.photo = "";
                    this.props.UserStore.joinedDate = auth().currentUser.metadata.creationTime;
                    this.props.UserStore.last_update = auth().currentUser.metadata.creationTime;
                    this.props.UserStore.vehicles = [];
                    this.props.UserStore.listings = [];
                    this.props.UserStore.payments = [];
                    this.props.UserStore.trips = [];
                    this.props.UserStore.searchHistory = [];
                    this.props.UserStore.disabled = false;
                    this.props.UserStore.deleted = false;
                    this.props.UserStore.pushTokens = [];
                  }).then(() => {
                    // alert('Welcome to Riive ' + this.props.UserStore.firstname + '!')
     
                  
     
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

onPressSignIn = async() => {

  this.setState ({ authenticating: true})


  auth().signInWithEmailAndPassword(this.props.UserStore.email, this.props.UserStore.password).then(async() => {
    // define user id before calling the db from it
    this.props.UserStore.userID = auth().currentUser.uid;
    this.setState({
      emailError: '',
      passwordError: '',
    })


    const db = firestore();

    const doc = db.collection('users').doc(this.props.UserStore.userID);

    const searchHistoryRef = db.collection('users').doc(this.props.UserStore.userID).collection('searchHistory');
    let searchHistory = new Array();


   await searchHistoryRef.get().then((doc) => {
     if(!doc.empty){
        doc.forEach(doc =>{
          searchHistory.push(doc.data())
        })
      }
   })
    
    

    

    // MOBX is not cached upon force close. Reinitalize data to mobx here!
      doc.get().then((doc) => {
        if (doc.exists){
                // alert(`${doc.id} => ${doc.data().fullname}`);
                this.props.UserStore.fullname = doc.data().fullname;
                this.props.UserStore.phone = doc.data().phone;
                this.props.UserStore.userID = doc.data().id;
                this.props.UserStore.dob = doc.data().dob || null,
                this.props.UserStore.stripeID = doc.data().stripeID;
                this.props.UserStore.stripeConnectID = doc.data().stripeConnectID;
                this.props.UserStore.photo = doc.data().photo;
                this.props.UserStore.joinedDate = auth().currentUser.metadata.creationTime;
                this.props.UserStore.last_update = doc.data().last_update;
                this.props.UserStore.vehicles = doc.data().vehicles;
                this.props.UserStore.listings = [];
                this.props.UserStore.trips = doc.data().trips;
                this.props.UserStore.payments = doc.data().payments;
                this.props.UserStore.searchHistory = searchHistory;
                this.props.UserStore.disabled = doc.data().disabled.isDisabled;
                this.props.UserStore.deleted = doc.data().deleted.toBeDeleted
                this.props.UserStore.pushTokens = doc.data().pushTokens || [];

                // ID if user signed in via email or google
                this.props.UserStore.signInProvider = auth().currentUser.providerData[0].providerId;
                
              
                var currentTime = firestore.Timestamp.now();

                // in case a user reverts their email change via profile update
                db.collection("users").doc(this.props.UserStore.userID).update({
                  last_update: currentTime,
                  email: this.props.UserStore.email,
                })
                // Upon setting the MobX State Observer, navigate to home
                this.props.navigation.navigate('Home')
            
                return doc;


      }else{
        throw("No user found")
      }
  }).then((doc) => {
    const length = doc.data().listings.length;
    if( length > 0 && length <= 10){
      db.collection('listings').where(firestore.FieldPath.documentId(), "in", doc.data().listings).get().then((qs) => {
        let listingsData = [];
        for(let i = 0; i < qs.docs.length; i++){
          listingsData.push(qs.docs[i].data())
        }
        this.props.UserStore.listings = listingsData;
    }).then(() => this.props.navigation.navigate("Home"))


  }else if(length > 0 && length > 10){
    let listings = doc.data().listings;
    let allArrs = [];
    var listingsData = [];
    while(listings.length > 0){
      allArrs.push(listings.splice(0, 10))
    }

    for(let i = 0; i < allArrs.length; i++){
      db.collection('listings').where(firestore.FieldPath.documentId(), "in", allArrs[i]).get().then((qs) => {
        for(let i = 0; i < qs.docs.length; i++){
          listingsData.push(qs.docs[i].data())
        }
      }).then(() => {
        this.props.UserStore.listings = listingsData;
        this.props.navigation.navigate('Home')
      })
    }
  
  }else{
     this.props.navigation.navigate('Home')
  }
     
  }).catch((e) => {
    alert("Failed to grab user data. Please try again. " + e)
    auth().signOut();
  })



  }).catch( async (error) => {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    this.setState ({ authenticating: false})
    // alert(errorCode + ': ' + errorMessage)
    if(errorCode == 'auth/invalid-email'){
      this.setState({
        emailError: 'Email format must be name@domain.com',
        passwordError: '',

      })
    }else if(errorCode == 'auth/user-not-found'){
      this.setState({
        emailError: 'There is no account under this email',
        passwordError: '',

      })
    }else if(errorCode == 'auth/too-many-requests'){
      this.setState({
        emailError: 'Too many recent requests. Try again soon',
        passwordError: '',

      })
    }else if(errorCode == 'auth/wrong-password'){
      this.setState({
        passwordError: 'Password is incorrect or empty',
        emailError: '',
      })
    }else if(errorCode == 'auth/user-disabled'){
      const settings = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Access-Control-Request-Method": "POST"
        },
        body: JSON.stringify({
          email: this.props.UserStore.email,
        })
      }
  
        
        await fetch('https://us-central1-riive-parking.cloudfunctions.net/getUserDataFromEmail', settings).then((res) => {
          return res.json()
        }).then((body) => {
          const db = firestore();
          const doc = db.collection('users').doc(body.uid)
          return doc.get()
        }).then((user) => {
          if(user.exists){
            if(user.data().disabled.numTimesDisabled < 3){
              var date = new Date(user.data().disabled.disabledEnds * 1000 + (24*60*60*1000));
              var daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
              var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
              this.setState({
                passwordError: '',
                emailError: `This account has been suspended until ${daysOfWeek[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`,
              })
            }else{
              this.setState({
                passwordError: 'Reach out to support@riive.net for assistance',
                emailError: `This account has been banned`,
              })
            }
        }else{
          this.setState({
            passwordError: '',
            emailError: `This account has been suspended`,
          })
        }
        }).catch(e => {
          alert(e)
        })
       
    }else{
      alert(errorCode + ': ' + errorMessage);
    }
  });

}

renderCurrentState() {
  if(this.state.authenticating || this._isMounted === false){
    return(
      <View style={styles.form}>
        <ActivityIndicator size="large" color={Colors.cosmos300} />
        {this._isMounted ? 
        <Button style={{backgroundColor: "#FF8708"}} textStyle={{color:"#FFFFFF"}} onPress={() => this.setState({ authenticating: false})}>Cancel</Button>
        : null}
      </View>
    )
  }else if(this.state.toggleLogIn){
    return(
        <View style={styles.form}>
          <Input 
          placeholder='Enter email...'
          label="Email"
          name="email"
          onChangeText = {(email) => this.props.UserStore.email = email}
          value={this.props.UserStore.email}
          keyboardType='email-address'
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
          <Button style={{backgroundColor: "#FF8708"}} textStyle={{color:"#FFFFFF"}} onPress = {() => this.onPressSignIn()}>Log In</Button>
          <Text onPress={() => this.toggleSignInOrUp()} style={styles.hyperlink}>Or Sign Up</Text>
          <Text onPress={() => this.resetPassword()} style={styles.hyperlink}>Forgot Password?</Text>
        </View>
    )
  }else{
    return(
     <View style={styles.form}>
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
        <Button style={{backgroundColor: "#FF8708"}} textStyle={{color:"#FFFFFF"}} onPress = {() => this.onPressSignUp("HomeScreen")}>Sign Up</Button>
        <Text onPress={() => this.toggleSignInOrUp()} style={styles.hyperlink}>Or Log In</Text>
      </View>
    )
  }
  
}

  render() {

      return (
        <ScrollView contentContainerStyle={{flexGrow : 1, justifyContent : 'center'}}>
          <KeyboardAvoidingView 
            // style={{backgroundColor: 'purple'}}
            behavior={"padding"} 
            keyboardVerticalOffset={120}
            enabled 
          >
            <View style={styles.primaryView}>
             {!this.state.authenticating ?<Image source={logo} style={styles.img}/> : null}
             {this.renderCurrentState()}
             {/* <View style={{height: 60}}/> */}
             </View>
          </KeyboardAvoidingView>
        </ScrollView>
        
    
      )
    }
}

const styles = StyleSheet.create({
  primaryView:{
    paddingHorizontal: 24,
  },
  img:{
    width: 150,
    resizeMode: 'contain',
    alignSelf: 'center'
  },
  form: {
    flex: 1,
  },
  hyperlink: {
    color: 'blue',
    textDecorationLine: 'underline',
    fontSize: 18,
    alignSelf: 'center',
    marginTop: 24
  }
});