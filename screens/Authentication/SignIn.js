
import React from 'react';
import { ActivityIndicator, StyleSheet, StatusBar, Platform, View, ScrollView, SafeAreaView, Dimensions, Image, LogBox} from 'react-native';
import {requestLocationAccuracy, check ,PERMISSIONS, openSettings, checkMultiple, checkNotifications} from 'react-native-permissions';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

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
    // this.props.UserStore.email = 'chris@riive.net'
    // this.props.UserStore.password = "Fallon430"



      // Set Status Bar page info here!
   this._navListener = this.props.navigation.addListener('didFocus', async() => {
    StatusBar.setBarStyle('dark-content', true);
    Platform.OS === 'android' && StatusBar.setBackgroundColor('white');



   
  });

  if (auth().currentUser !== null) {
    await this.getCurrentUserInfo();
    await this.setPermissions()
    await this.forceUpdate();
    
  } else{
    this._isMounted = true;
    this.forceUpdate();
  }

  




 

  }

  componentWillUnmount() {
    // Unmount status bar info
  //  this._navListener.remove();
  }
  


  setPermissions = () => {
    checkPermissionsStatus().then(res => {
      this.props.UserStore.permissions = res;
    })
  }


  getCurrentUserInfo = async() => {
    const db = firestore();

    const doc = db.collection('users').doc(auth().currentUser.uid);

    const searchHistoryRef = db.collection('users').doc(auth().currentUser.uid).collection('searchHistory');
    let searchHistory = new Array();
    // const reportsRef = db.collection('users').doc(auth().currentUser.uid).collection('searchHistory');
    // let reports = new Array();

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
              this.props.UserStore.loggedIn = true;
              this.props.UserStore.fullname = doc.data().fullname;
              this.props.UserStore.phone = doc.data().phone;
              this.props.UserStore.dob = doc.data().dob || null,
              this.props.UserStore.userID = doc.data().id;
              this.props.UserStore.stripeID = doc.data().stripeID;
              this.props.UserStore.stripeConnectID = doc.data().stripeConnectID;
              this.props.UserStore.mailchimpID = doc.data().mailchimpID;
              this.props.UserStore.directDepositInfo = doc.data().directDeposit; 
              this.props.UserStore.photo = doc.data().photo;
              this.props.UserStore.joinedDate = auth().currentUser.metadata.creationTime;
              this.props.UserStore.lastUpdate = doc.data().last_update;
              this.props.UserStore.vehicles = doc.data().vehicles;
              this.props.UserStore.listings = [];
              this.props.UserStore.reports = [];
              this.props.UserStore.trips = doc.data().trips;
              this.props.UserStore.payments = doc.data().payments;
              this.props.UserStore.searchHistory = searchHistory;
              this.props.UserStore.disabled = doc.data().disabled.isDisabled;
              this.props.UserStore.toBeDeleted = doc.data().deleted.toBeDeleted
              this.props.UserStore.deleteDate = doc.data().deleted.deleted
              this.props.UserStore.pushTokens = doc.data().pushTokens || [];
              this.props.UserStore.ssnProvided = doc.data().ssnProvided || false;
              this.props.UserStore.address = doc.data().primaryAddress || {};
              this.props.UserStore.versions = doc.data().versions || [];
              // this.props.UserStore.permissions = doc.data().permissions || {
              //   notifications: {
              //     discountsAndNews: false,
              //     tripsAndHosting: false,
              //   }
              // }

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
    if ( length > 0 ){
      db.collection('listings').where(firestore.FieldPath.documentId(), "in", doc.data().listings).get().then((qs) => {
        let listingsData = [];
        for(let i = 0; i < qs.docs.length; i++){
          listingsData.push(qs.docs[i].data())
        }
        this.props.UserStore.listings = listingsData;
        return listingsData
    }).then((listingsData) => {

      // gets every listing
      for (let i = 0; i < listingsData.length; i++){
          db.collection('listings').doc(listingsData[i].listingID).collection('trips').get().then((data) => {
              this.props.UserStore.listings[i].visits = [];
              if(data.docs.length > 0){
                  // gets every trip
                  data.forEach(snap => {
                      this.props.UserStore.listings[i].visits.push(snap.data().id)
                  })
              }else{
                  this.props.UserStore.listings[i].visits = [];
              }
          })
      }
  })


    // }else if(length > 0 && length > 10){
    // let listings = doc.data().listings;
    // let allArrs = [];
    // var listingsData = [];
    // while(listings.length > 0){
    //   allArrs.push(listings.splice(0, 10))
    // }

    // for(let i = 0; i < allArrs.length; i++){
    //   db.collection('listings').where(firestore.FieldPath.documentId(), "in", allArrs[i]).get().then((qs) => {
    //     for(let i = 0; i < qs.docs.length; i++){
    //       listingsData.push(qs.docs[i].data())
    //     }
    //   }).then(() => {
    //       listingsData.forEach(async(data, i) => {
    //         let visitsArray = [];
    //         let snapshot = await firestore().collection('listings')
    //             .doc(data.listingID)
    //             .collection('trips')
    //             .get()
        
    //         await snapshot.forEach(doc =>{
    //             visitsArray.push(doc.data().id)
    //         })

    //         listingsData[i].visits = visitsArray

    //         this.props.UserStore.listings = listingsData;
            
    //     })
    //   })
    // }

  }else{
    this.props.UserStore.listings = []
  } 

  return doc
  
  }).then(doc => {
    db.collection('users').doc(auth().currentUser.uid).collection("reports").get().then(qs => {

      let length = qs.size
      let reportIds = qs.docs.map(x => x.data().reportID)


      if( length > 0 && length <= 10){
        db.collection('reports').where(firestore.FieldPath.documentId(), "in", reportIds).get().then((data) => {
          let reportsData = [];
          for(let i = 0; i < data.docs.length; i++){
            reportsData.push(data.docs[i].data())
          }
          this.props.UserStore.reports = reportsData;
        })
      }else if(length > 0 && length > 10){
        
        let allArrs = [];
        var reportsData = [];
        while(reportIds.length > 0){
          allArrs.push(reportIds.splice(0, 10))
        }

        for(let i = 0; i < allArrs.length; i++){
          db.collection('reports').where(firestore.FieldPath.documentId(), "in", allArrs[i]).get().then((d) => {
            for(let i = 0; i < d.docs.length; i++){
              reportsData.push(d.docs[i].data())
            }
          }).then(() => {
            this.props.UserStore.reports = reportsData;
          })
        }
      }else{
        this.props.UserStore.reports = [];
      }

    })

    return doc
    
  }).then(() => {
    this.props.navigation.navigate('Home')
    this._isMounted = true;
  }).catch((e) => {
    alert("Failed to grab user data. " + e)
  })

  }


  onPressSignIn = async() => {

  this.setState ({ authenticating: true})

  


  auth().signInWithEmailAndPassword(this.props.UserStore.email || " ", this.props.UserStore.password || " ").then(async() => {
    // define user id before calling the db from it
    this.props.UserStore.userID = auth().currentUser.uid;
    this.setPermissions();
    this.setState({
      emailError: '',
      passwordError: '',
    })

  


    const db = firestore();

    const doc = db.collection('users').doc(this.props.UserStore.userID);

    const searchHistoryRef = db.collection('users').doc(this.props.UserStore.userID).collection('searchHistory');
    let searchHistory = new Array();
    let reports = new Array();


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
                this.props.UserStore.loggedIn = true;
                this.props.UserStore.fullname = doc.data().fullname;
                this.props.UserStore.phone = doc.data().phone;
                this.props.UserStore.userID = doc.data().id;
                this.props.UserStore.dob = doc.data().dob || null,
                this.props.UserStore.stripeID = doc.data().stripeID;
                this.props.UserStore.stripeConnectID = doc.data().stripeConnectID;
                this.props.UserStore.mailchimpID = doc.data().mailchimpID;
                this.props.UserStore.directDepositInfo = doc.data().directDeposit; 
                this.props.UserStore.photo = doc.data().photo;
                this.props.UserStore.joinedDate = auth().currentUser.metadata.creationTime;
                this.props.UserStore.lastUpdate = doc.data().last_update;
                this.props.UserStore.vehicles = doc.data().vehicles;
                this.props.UserStore.listings = [];
                this.props.UserStore.reports = [];
                this.props.UserStore.trips = doc.data().trips;
                this.props.UserStore.payments = doc.data().payments;
                this.props.UserStore.searchHistory = searchHistory;
                this.props.UserStore.disabled = doc.data().disabled.isDisabled;
                this.props.UserStore.deleted = doc.data().deleted.toBeDeleted
                this.props.UserStore.pushTokens = doc.data().pushTokens || [];
                this.props.UserStore.ssnProvided = doc.data().ssnProvided || false;
                this.props.UserStore.address = doc.data().primaryAddress || {};
                this.props.UserStore.versions = doc.data().versions || [];
                // Don't pull from data. we want all permissions, not just account level perms
                // this.props.UserStore.permissions = this.props.UserStore.permissions;

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
    if ( length > 0 ){
      db.collection('listings').where(firestore.FieldPath.documentId(), "in", doc.data().listings).get().then((qs) => {
        let listingsData = [];
        for(let i = 0; i < qs.docs.length; i++){
          listingsData.push(qs.docs[i].data())
        }
        this.props.UserStore.listings = listingsData;
        return listingsData
    }).then((listingsData) => {
      // gets every listing
      for (let i = 0; i < listingsData.length; i++){
          db.collection('listings').doc(listingsData[i].listingID).collection('trips').get().then((data) => {
              this.props.UserStore.listings[i].visits = [];
              if(data.docs.length > 0){
                  // gets every trip
                  data.forEach(snap => {
                      this.props.UserStore.listings[i].visits.push(snap.data().id)
                  })
              }else{
                  this.props.UserStore.listings[i].visits = [];
              }
          })
      }
  })
    // }else if(length > 0 && length > 10){
    //   let listings = doc.data().listings;
    //   let allArrs = [];
    //   var listingsData = [];
    //   while(listings.length > 0){
    //     allArrs.push(listings.splice(0, 10))
    //   }

    //   for(let i = 0; i < allArrs.length; i++){
    //     db.collection('listings').where(firestore.FieldPath.documentId(), "in", allArrs[i]).get().then((qs) => {
    //       for(let i = 0; i < qs.docs.length; i++){
    //         listingsData.push(qs.docs[i].data())
    //       }
    //     })
        
    //   }
    
    }else{
      this.props.UserStore.listings = [];
    }
    return doc
  }).then(doc => {
    db.collection('users').doc(auth().currentUser.uid).collection("reports").get().then(qs => {

      let length = qs.size
      let reportIds = qs.docs.map(x => x.data().reportID)


      if( length > 0 && length <= 10){
        db.collection('reports').where(firestore.FieldPath.documentId(), "in", reportIds).get().then((data) => {
          let reportsData = [];
          for(let i = 0; i < data.docs.length; i++){
            reportsData.push(data.docs[i].data())
          }
          this.props.UserStore.reports = reportsData;
        })
      }else if(length > 0 && length > 10){
        
        let allArrs = [];
        var reportsData = [];
        while(reportIds.length > 0){
          allArrs.push(reportIds.splice(0, 10))
        }

        for(let i = 0; i < allArrs.length; i++){
          db.collection('reports').where(firestore.FieldPath.documentId(), "in", allArrs[i]).get().then((d) => {
            for(let i = 0; i < d.docs.length; i++){
              reportsData.push(d.docs[i].data())
            }
          }).then(() => {
            this.props.UserStore.reports = reportsData;
          })
        }
      }else{
        this.props.UserStore.reports = [];
      }

    })
    return doc
  }).then(() => this.props.navigation.navigate("Home")).catch((e) => {
    alert("Failed to grab user data. Please try again. " + e)
    auth().signOut();
  })



  }).catch( async (error) => {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    this.setState ({ authenticating: false})

    console.log(error.code)

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
  
        
        await fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/getUserDataFromEmail`, settings).then((res) => {
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
                emailError: `This account has been suspended until ${daysOfWeek[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`,
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
      <View style={[styles.form, {alignItems: 'center'}]}>
        {/* <ActivityIndicator size="large" color={Colors.cosmos300} /> */}
        <FloatingCircles height={30} color={Colors.tango500}/>
      </View>
    )
  }else{
    return(
        <View style={styles.form}>
          <Input 
          placeholder='Enter email...'
          label="Email"
          name="email"
          rightText={<Text onPress={() => this.props.navigation.navigate("PWReset")} style={styles.hyperlink}>Forgot Password</Text>}
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
          <Button style={{backgroundColor: "#FF8708"}} textStyle={{color:"#FFFFFF"}} onPress = {() => this.onPressSignIn()}>Sign In</Button>
        </View>
    )
  }
  
}

  render() {

      return (
          <View 
            style={{flex: 1, justifyContent: 'center', backgroundColor: 'white'}}
          >
            <KeyboardAwareScrollView  
                style={styles.primaryView} 
                contentContainerStyle={{justifyContent: 'center'}}
                behavior={"padding"} 
                keyboardVerticalOffset={120}
                enabled 
            >
              <Image source={logo} style={styles.img}/>
              {this.renderCurrentState()}
             </KeyboardAwareScrollView >
          </View>      
    
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
  },
  hyperlink: {
    color: Colors.apollo500,
    textDecorationLine: 'underline',
    fontSize: 12,
  }
});