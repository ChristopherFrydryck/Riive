import React, {Component} from 'react'
import {View, Share, ActivityIndicator, Dimensions, StatusBar, StyleSheet, ScrollView, Modal, Platform, SafeAreaView, RefreshControl, TouchableOpacity} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {NavigationActions} from 'react-navigation'
import Input from '../components/Input'
import Button from '../components/Button'





import ImagePicker from 'react-native-image-crop-picker';

import ProfilePic from '../components/ProfilePic'
import TopBar from '../components/TopBar'
import Icon from '../components/Icon'
import Circle from '../components/Circle'
import Text from '../components/Txt'
import VehicleList from '../components/VehicleList'
import PaymentList from '../components/PaymentList'
import SpacesList from '../components/SpacesList'
import ClickableChip from '../components/ClickableChip'
import DialogInput from 'react-native-dialog-input'
// import Dialog from 'react-native-dialog'
// import * as ImagePicker from 'expo-image-picker'
// import * as Permissions from 'expo-permissions'
import {requestLocationAccuracy, check ,PERMISSIONS, openSettings} from 'react-native-permissions';
// import SnackBar from 'react-native-snackbar-component'
import {Provider, Snackbar, Menu, Divider} from 'react-native-paper'



//Firebase imports
import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage'
import firestore from '@react-native-firebase/firestore';
import 'firebase/firestore';
import 'firebase/auth';


//MobX Imports
import {inject, observer} from 'mobx-react/native'
import UserStore from '../stores/userStore'
import ComponentStore from '../stores/componentStore'
import Colors from '../constants/Colors';




// Regex to check name and phone are valid at sign in
const regexFullname = /[^0-9]([a-zA-Z]{1,})+[ ]+([a-zA-Z-']{2,})*$/gi;
const regexPhone = /^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*$/;
const regexEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// Vars that prevent continuing since this is not built into firebase natively
let nameValid = true;
let phoneValid = true;








@inject("UserStore", "ComponentStore")
@observer
class Profile extends Component{


    static navigationOptions = {
        headerShown: false
    }
    
    constructor(props){
        super(props);
        
        this.state = {
            icons: [
                {id: 1, iconName: 'arrow-left'},
                {id: 2, iconName: 'more-vertical'}
            ],
            editAccountModalVisible: false,
            passwordAlert: false,
            fullNameUpdate: this.props.UserStore.fullname,
            emailUpdate: this.props.UserStore.email,
            phoneUpdate: this.props.UserStore.phone,
            dobUpdate: this.props.UserStore.dob,
            inputTextModal: "",
            editableTextInput: false,
            fullnameError: "",
            phoneError: "",
            emailError: "",
            dobError: "",
            submitted: false,
            failed: false,
            savingChanges: false,
            resetPW: false,
            imageUploading: false,
            selectedImageURI: "",
            verificationSnackbarVisible: false,
            menuVisible: false,
            
            isRefreshing: false,
        }

        
        

        this.signOut = this.signOut.bind(this);
        this.updateAccountInfo =  this.updateAccountInfo.bind(this);
        this.resetPassword = this.resetPassword.bind(this);
        this.pickImage = this.pickImage.bind(this);
        // this.sendToFirebaseStorage = this.sendToFirebaseStorage.bind(this);
    }

    componentDidMount(){
        // Set Status Bar page info here!
       
        this._navListener = this.props.navigation.addListener('didFocus', () => {
            this.updateProfile()
            StatusBar.setBarStyle('light-content', true);
            Platform.OS === 'android' && StatusBar.setBackgroundColor(Colors.tango900);
          });

      


    //    console.log(auth().currentUser.photoURL);
    // alert(this.props.UserStore.memberTime)
    const db = firestore();
    const doc = db.collection('users').doc(this.props.UserStore.userID);


    this.updateProfile();

    const user = auth().currentUser;
    
    if(!user.emailVerified){
        this.setState({verificationSnackbarVisible: true})
    }else{
        this.setState({verificationSnackbarVisible: false})
    }

    
    
    }

   

    componentWillUnmount() {
        // Unmount status bar info
        this._navListener.remove();
    }

    updateProfile = () => {
        const db = firestore();
        const doc = db.collection('users').doc(this.props.UserStore.userID);

        this.setState({isRefreshing: true})

        auth().currentUser.reload();
       


        doc.get().then(doc => {
            const listingsSorted = doc.data().listings.sort()
            const listingsIDMobXSorted = this.props.UserStore.listings.map(x => x.listingID).sort()
            const length = doc.data().listings.length;

            const vehiclesIDSorted = doc.data().vehicles.map(x => x.VehicleID).sort((a, b) => a.VehicleID > b.VehicleID)
            const vehiclesIDMobXSorted = this.props.UserStore.vehicles.map(x => x.VehicleID).sort((a, b) => a.VehicleID > b.VehicleID)
            const vehicleData = doc.data().vehicles.sort((a, b) => a.VehicleID > b.VehicleID)
            const vehicleDataMobx = this.props.UserStore.vehicles.map(x => x).sort((a, b) => a.VehicleID > b.VehicleID)

            const paymentsIDSorted = doc.data().payments.map(x => x.PaymentID).sort((a, b) => a.PaymentID > b.PaymentID)
            const paymentsIDMobXSorted = this.props.UserStore.payments.map(x => x.PaymentID).sort((a, b) => a.PaymentID > b.PaymentID)
            const paymentData = doc.data().payments.sort((a, b) => a.PaymentID > b.PaymentID)
            const paymentDataMobx = this.props.UserStore.payments.map(x => x).sort((a, b) => a.PaymentID > b.PaymentID)
   
            // Check if vehicles are updated
            if(vehiclesIDSorted.length === vehiclesIDMobXSorted.length && vehiclesIDSorted.every((value, index) => value === vehiclesIDMobXSorted[index]) && JSON.stringify(vehicleData) === JSON.stringify(vehicleDataMobx)){
                // do nothing
            }else{
                this.props.UserStore.vehicles = doc.data().vehicles
            }


            // Check if payments are updated
            if(paymentsIDSorted.length === paymentsIDMobXSorted.length && paymentsIDSorted.every((value, index) => value === paymentsIDMobXSorted[index]) && JSON.stringify(paymentData) === JSON.stringify(paymentDataMobx)){
                // do nothing
            }else{
                this.props.UserStore.payments = doc.data().payments
            }
            
            // Check if spaces are updated
                if( length > 0 && length <= 10){
                    db.collection('listings').where(firestore.FieldPath.documentId(), "in", doc.data().listings).get().then((qs) => {
                    let listingsData = [];
                    
                    for(let i = 0; i < qs.docs.length; i++){
                        listingsData.push(qs.docs[i].data())
                    }
                    
                    this.props.UserStore.listings = listingsData;
             })

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
                    })
                }
            }else{
                this.props.UserStore.listings = [];
            }
        })
        this.setState({isRefreshing: false})
    }


  

      onShare = async () => {
        try{
         Share.share({
            message: 'Come join Riive with me and learn how you can lease your driveway or park smarter at www.riive.net.',
            url: 'https://www.riive.net',
            title: 'Riive | The Shareparking App'
          }, {
            // Android only:
            dialogTitle: 'Share Riive',
            // iOS only:
            subject: 'Join Riive with me',
            excludedActivityTypes: [
                'com.apple.UIKit.activity.SaveToCameraRoll', 
                'com.apple.UIKit.activity.AssignToContact'
            ]
          })
        }catch(e){
            alert(e)
        }
        }
      


    pickImage = () => {

        ImagePicker.openPicker({
            mediaType: "photo",
            width: 320,
            height: 320,
            compressImageQuality: 0.1,
            cropping: true
          }).then(image => {
            this.setState({imageUploading: true})
            this.uploadImg(image.path)
            this.setState({imageUploading: false})
          });

          
      
      
        //   if (!result.cancelled) {
        //         this.uploadImg(result.uri)
        //             .then(() => {
        //                 // alert("Success!")
        //                 this.setState({imageUploading: false})
        //             }).catch(() => {
        //                 // alert("Failed to upload image. Please try again.")
        //                 this.setState({imageUploading: false})
        //             })
            
        //   }else{
        //       this.setState({imageUploading: false})
        //   }
        };


        
    uploadImg = async (uri) => {
        const db = firestore();
        const doc = db.collection('users').doc(this.props.UserStore.userID);

        const response = await fetch(uri)
        const blob = await response.blob()

        const storageRef = storage().ref();
        const profilePicRef = storageRef.child("users/" + this.props.UserStore.userID + '/profile-pic')
        return profilePicRef.put(blob)
        .then(() => {
           profilePicRef.getDownloadURL().then((uri) => {
                db.collection("users").doc(this.props.UserStore.userID).update({
                    photo: uri
                 })
                 this.props.UserStore.photo = uri;

                })
        }).catch(e => {
            Alert.alert(e)
        })

        
    }

      



    // Resets the password of the state with email
        resetPassword = () => { 
            auth().sendPasswordResetEmail(this.props.UserStore.email).then(() => {
                // this.setState({editAccountModalVisible: false})
                //     alert("Check your email for a password reset link.")
                this.setState({resetPW: true})
                setTimeout(() => this.setState({resetPW: false}), 3000)
                             
            }).catch((error) => {
                alert('Failed to send password reset. ' + error.message)
            });
        }



        
    requirePasswordAuthentication = (pw) => {
        // Prompt the user to re-provide their sign-in credentials

        const db = firestore();
        const doc = db.collection('users').doc(this.props.UserStore.userID);

        var user = auth().currentUser;
        this.setState({passwordAlert : false})

        // ensure that user is valid and authenticated. pw comes from <DialogInput> below
        var credentials = auth.EmailAuthProvider.credential(
        this.props.UserStore.email,
        pw
        );
        // take authenticated credentials and verify that the user exists
        user.reauthenticateWithCredential(credentials).then(() => {
            doc.get().then((u) => {
                if (u.exists){
                    
                    
                    // update account info
                    db.collection("users").doc(this.props.UserStore.userID).update({
                         
                         email: this.state.emailUpdate,
                         
                      }).then(() => {
                        // hide modal and dialog input and save new userstore email
                        
                        
                        this.props.UserStore.email = this.state.emailUpdate;
                        // checks for errors
                        auth().currentUser.updateEmail(this.state.emailUpdate)
                        .then(() => {
                            this.setState({ submitted: true})
                            setTimeout(() => this.setState({submitted: false}), 3000)
                        })
                        .catch((error) => {
                            if(error.code == 'auth/email-already-in-use'){
                                this.setState({ emailError: "There is already an account with this email.", submitted: false})
                            }else if(error.code == 'auth/invalid-email'){
                                this.setState({ emailError: "Email is invalid. Please try again.", submitted: false})
                            }else if(error.code == 'auth/requires-recent-login'){
                                alert("Please sign out and sign in again to verify your information")
                                this.setState({editAccountModalVisible: false, submitted: false})
                            }else{
                                alert(error.code + ": " + error.message + ".")
                                this.setState({editAccountModalVisible: false, submitted: false})
                            }
                        })
                       
                      })


                    }else{
                        alert("Error!")
                    }
            })

           
        }).catch((error) => {
           var errorCode = error.code;
            var errorMessage = error.message;
            this.setState ({ passwordAlert: false})
            if(errorCode == 'auth/wrong-password'){
                alert("Password incorrect. Please try again.")
            }else if(errorCode == 'auth/invalid-credential'){
                alert("Whoops, our authentication failed... Please try again.")
            }else{
                alert(errorCode + ": " + errorMessage + ".")
            }
        });
    }

    getDaysInMonth = (year, month) => {
        return new Date(year, month, 0).getDate();
      }

    updateAccountInfo = async() => {
        const db = firestore();
        const doc = db.collection('users').doc(this.props.UserStore.userID);
        const user = auth().currentUser;

        this.setState({savingChanges: true})

        user.reload();
        
        try{
            if (this.state.phoneUpdate !== this.props.UserStore.phone){
                if (this.state.phoneUpdate.match(regexPhone) || this.state.phoneUpdate == ""){
                    const settings = {
                        method: 'POST',
                        headers: {
                        'Content-Type': 'application/json',
                        "Access-Control-Request-Method": "POST"
                        },
                        body: JSON.stringify({
                            stripeID: this.props.UserStore.stripeID,
                            stripeConnectID: this.props.UserStore.stripeConnectID,
                            phone: this.state.phoneUpdate,
                        })
                    }
                    let error = null;

                    await fetch('https://us-central1-riive-parking.cloudfunctions.net/editPhoneNumber', settings).then((res) => {
                        if(res.status === 200){
                            this.props.UserStore.phone = this.state.phoneUpdate;
                            doc.update({ phone: this.props.UserStore.phone})
                            this.setState({phoneError: '', submitted: true})
                            setTimeout(() => this.setState({submitted: false}), 3000)
                        }else{
                            // If response is not 200
                            error = new Error(`Please ensure your phone number is valid.`)
                            error.code = res.status
                            error.name = "Phone/StripeInvalid"
                            throw error
                        }
                        
                    }).catch(e => {
                        // If fetch is not 200 or function fails
                        throw e
                    })
                    
                }else{
                    // If phone number is not long enough
                    error = new Error(`Please ensure your phone number is valid.`)
                            error.code = 410
                            error.name = "Phone/NumberTooShort"
                            throw error
                }
            }
            if (this.state.fullNameUpdate != this.props.UserStore.fullname){
                let error = null;
                if (this.state.fullNameUpdate.match(regexFullname)){
                    const settings = {
                        method: 'POST',
                        headers: {
                        'Content-Type': 'application/json',
                        "Access-Control-Request-Method": "POST"
                        },
                        body: JSON.stringify({
                            stripeID: this.props.UserStore.stripeID,
                            stripeConnectID: this.props.UserStore.stripeConnectID,
                            name: this.state.fullNameUpdate
                        })
                    }

                    await fetch('https://us-central1-riive-parking.cloudfunctions.net/editFullName', settings).then((res) => {
                        if(res.status === 200){
                            this.props.UserStore.fullname = this.state.fullNameUpdate
                            doc.update({ 
                                fullname: this.props.UserStore.fullname,
                                firstname: this.props.UserStore.firstname,
                                lastname: this.props.UserStore.lastname
                            })
                            this.setState({fullnameError: "", submitted: true}) 
                            setTimeout(() => this.setState({submitted: false}), 3000)
                        }else{
                            // If response is not 200
                            error = new Error(`Please ensure your name includes a first and last name.`)
                            error.code = res.status
                            error.name = "Name/StripeFailure"
                            throw error
                        }
                    }).catch(e => {
                        throw e
                    })

                   
                }else{
                    error = new Error("Please provide first and last name with a space.")
                    error.code = 410
                    error.name = "Name/Invalid"
                    throw error
                }           
            }
            if (this.state.dobUpdate != this.props.UserStore.dob){
                // Checks DOB for valid format
                let month = parseInt(this.state.dobUpdate.split("/")[0]) || 0
                let day = parseInt(this.state.dobUpdate.split("/")[1]) || 0
                let year = parseInt(this.state.dobUpdate.split("/")[2]) || 0

                let error = null;

                if(month <= 12 && month.toString() !== "0" && day <= this.getDaysInMonth(year, month) && day.toString() !== "0" && year > 1900 && year < new Date().getFullYear() - 15){

                    const settings = {
                        method: 'POST',
                        headers: {
                        'Content-Type': 'application/json',
                        "Access-Control-Request-Method": "POST"
                        },
                        body: JSON.stringify({
                            stripeID: this.props.UserStore.stripeID,
                            dob: this.state.dobUpdate
                        })
                    }
             

                    await fetch('https://us-central1-riive-parking.cloudfunctions.net/editDOB', settings).then((res) => {
                        if(res.status === 200){
                            this.props.UserStore.dob = this.state.dobUpdate;
                            doc.update({
                                dob: this.state.dobUpdate
                            })
                            this.setState({dobError: "", submitted: true}) 
                            setTimeout(() => this.setState({submitted: false}), 3000)
                        }else{
                            // If response is not 200
                            error = new Error(`Please ensure your date of birth is valid.`)
                            error.code = res.status
                            error.name = "DOB/StripeInvalid"
                            throw error
                        }
                    }).catch(e => {
                        throw e
                    })
              
                    
                }else{
                    if(year !== 0 && year < 1900 || year > new Date().getFullYear() - 15){
                        error = new Error('Please ensure your year is valid and you are 16 or older')
                        error.code = 410
                        error.name = "DOB/UserTooYoung"
                        throw error
                    }else if(day !== 0 && day > this.getDaysInMonth(year, month) || day.toString() == "0"){
                        error = new Error('Please ensure your day is valid.')
                        error.code = 411
                        error.name = "DOB/DayInvalid"
                        throw error
                    }else if(month !== 0 && month > 12 || month.toString() == "0"){
                        error = new Error('Please ensure your month is valid.')
                        error.code = 412
                        error.name = "DOB/MonthInvalid"
                        throw error
                    }else{
                        error = new Error('Please ensure your date is in the proper format (MM/DD/YYYY).')
                        error.code = 413
                        error.name = "DOB/FormatInvalid"
                        throw error
                    }
                }      
            }
            if (this.state.emailUpdate !== this.props.UserStore.email){
                if (this.state.emailUpdate.match(regexEmail)){
                // See requirePasswordAuthentication function for more detail!
                this.setState({passwordAlert: true, emailError: ""})
                }else{
                    this.setState({emailError: 'Email format must be name@domain.com'})
                }
            }
        }catch(e){
           
                if(e.name.split("/")[0] === "Phone"){
                    this.setState({phoneError: e.message, failed: true})
                    setTimeout(() => this.setState({failed: false}), 3000)
                }else if(e.name.split("/")[0] === "DOB"){
                    this.setState({dobError: e.message, failed: true})
                    setTimeout(() => this.setState({failed: false}), 3000)
                }else if(e.name.split("/")[0] === "Name"){
                    this.setState({fullnameError: e.message, failed: true})
                    setTimeout(() => this.setState({failed: false}), 3000)
                }else{
                    alert(e.message)
                    this.setState({failed: true})
                    setTimeout(() => this.setState({failed: false}), 3000)
                }
            
        }

        this.setState({savingChanges: false})
        
    }

    passwordInputDialogue(visible){
        this.setState({passwordAlert: visible})
    }

    resendVerification = () => {
        const user = auth().currentUser;
        user.sendEmailVerification().then(() => {
            setTimeout(() => this.setState({verificationSnackbarVisible: false}), 500)
        }).catch((e) => {
            alert(e)
        })
    }
        

    editAccountModal(visible){
        this.setState({
            editAccountModalVisible: visible,
            fullnameError: "",
            phoneError: "",
            emailError: "",
        })
        this.state.emailUpdate =  this.props.UserStore.email;
        this.state.fullNameUpdate = this.props.UserStore.fullname;
        this.state.phoneUpdate = this.props.UserStore.phone;
    }



    


 

    signOut = () => {
        auth().signOut().then(() => {
            // alert(this.props.UserStore.firstname + " has signed out.");
            this.props.navigation.navigate('Auth')

            this.props.UserStore.email = ""
            this.props.UserStore.fullname = ""
            this.props.UserStore.password = ""
            this.props.UserStore.phone = ""
            this.props.UserStore.userID = ""
            this.props.UserStore.dob = ""
        })
    }   

    render(){
        const initals = this.props.UserStore.firstname.charAt(0).toUpperCase() + "" + this.props.UserStore.lastname.charAt(0).toUpperCase()
        const {firstname, lastname, vehicles, payments, listings} = this.props.UserStore 
        var {height, width} = Dimensions.get('window');
   

        return(
            <Provider>
                <View style={{flex: 1, backgroundColor: 'white'}}>

                {/* Edit Account Modal!!! */}
                <Modal
                    animationType="slide"
                    transparent={false}
                    visible={this.state.editAccountModalVisible}
                    onRequestClose={() => this.setState({editAccountModalVisible: false})}
                    
                >

                <DialogInput 
                    isDialogVisible={this.state.passwordAlert}
                    title={"Enter your password"}
                    message={"We need to verify your changes before we can update your information."}
                    hintInput={"Password..."}
                    closeDialog={() => {this.setState({passwordAlert: false})}}
                    submitInput={(inputText) => this.requirePasswordAuthentication(inputText)}
                    submitText={"Verify"}
                />
                    
                    <SafeAreaView style={{paddingTop: 10, marginHorizontal: 16, flex: 1}}>
                                           
                    <ScrollView>
                        <TopBar>
                        <Text style={{fontSize: 20, marginRight: 'auto', marginTop: 8, marginLeft: 16}}>Edit Profile</Text>
                            <Icon 
                                iconName="x"
                                iconColor={Colors.cosmos500}
                                iconSize={28}
                                onPress={() => this.editAccountModal(!this.state.editAccountModalVisible)}
                                style={{marginTop: 10, marginLeft: "auto", marginRight: 5}}
                            />
                        </TopBar>
                        
                        <View style={{flexDirection:"row", alignItems:"center", justifyContent:"space-between"}} >
                        {this.props.UserStore.photo && !this.state.imageUploading ?
                                           
                        <ProfilePic 
                            source={{ uri: this.props.UserStore.photo }}
                            imgWidth = {60}
                            imgHeight = {60}
                            initals={initals}
                            style={{backgroundColor:"#FFFFFF", marginVertical: 20, marginLeft: 8}}
                            fontSize={18}
                            fontColor="#1D2951"
                            onPress={this.pickImage}
                            alt="Your profile picture"
                        />
                        
                        : auth().currentUser.photoURL && !this.state.imageUploading ?
                     
                        <ProfilePic 
                            source={{ uri: auth().currentUser.photoURL }}
                            imgWidth = {60}
                            imgHeight = {60}
                            initals={initals}
                            style={{backgroundColor:"#FFFFFF", marginVertical: 20, marginLeft: 8}}
                            fontSize={18}
                            fontColor="#1D2951"
                            onPress={this.pickImage}
                            alt="Your profile picture"
                        />
                        

                        : this.state.imageUploading ?

                        <Circle
                            width={60}
                            style={{marginVertical: 20, marginLeft: 8}}
                            color="#ffffff"
                        >
                            <ActivityIndicator size="small" color={Colors.cosmos300}/>  
                        </Circle>


                        :

                     
                        <ProfilePic 
                            initals={initals}
                            style={{backgroundColor:"#FFFFFF", marginVertical: 20, marginLeft: 8, width: 60, height: 60}}
                            fontSize={18}
                            imgWidth = {60}
                            imgHeight = {60}
                            fontColor={Colors.apollo900}
                            onPress={this.pickImage}

                        />
                        
                            
                        
                        }
                        {this.props.UserStore.signInProvider == "password" ? 
                        <ClickableChip
                                bgColor='rgba(rgba(232, 86, 86, 0.3))' // Colors.Tango300 with opacity of 30%
                                textColor={Colors.hal700}
                                onPress={() => this.resetPassword()}
                                
                        >{this.state.resetPW ? "Sent!" : "Reset Password"}</ClickableChip> : null }
                        </View>

                        <Input 
                             placeholder='Your name...'
                             label="Full Name"
                             name="full name"
                             onChangeText= {(fullNameUpdate) => this.setState({fullNameUpdate})}
                             value={this.state.fullNameUpdate}
                             maxLength = {40}
                             keyboardType='default'
                             error={this.state.fullnameError}
                        />
                        <Input 
                             placeholder='Enter email...'
                             label="Email"
                             name="email"
                             editable= {this.state.editableTextInput}
                             onChangeText= {(emailUpdate) => this.setState({emailUpdate})}
                             value={this.state.emailUpdate}
                             maxLength = {55}
                             keyboardType='email-address'
                             error={this.state.emailError}
                        />
                        <Input 
                             placeholder='000-000-0000'
                             mask='phone'
                             label="Phone"
                             name="phone"
                             onChangeText= {(phoneUpdate) => this.setState({phoneUpdate})}
                             value={this.state.phoneUpdate}
                             maxLength = {17}
                             keyboardType='phone-pad'
                             error={this.state.phoneError}
                        />
                        <Input 
                            placeholder='05/31/1996'
                            mask="mm/dd/yyyy"
                            label="Date of Birth"
                            name="DOB"
                            onChangeText = {(dobUpdate) => this.setState({dobUpdate})}
                            value={this.state.dobUpdate}
                            maxLength = {9}
                            keyboardType='phone-pad'
                            error={this.state.dobError}
                        />
                         <ClickableChip
                                style={{marginTop: 20, paddingTop: 10, paddingBottom: 10,}}
                                onPress={() => this.updateAccountInfo()}
                                disabled={this.state.savingChanges || this.state.failed || this.state.submitted}
                                bgColor={this.state.submitted ? 'rgba(53, 154, 106, 0.3)' : this.state.failed ? 'rgba(190, 55, 55, 0.3)' : 'rgba(255, 193, 76, 0.3)' }// Colors.Tango300 with opacity of 30%
                                textColor={this.state.submitted ? Colors.fortune700 : this.state.failed ? Colors.hal700 : Colors.tango700}
                        >{this.state.submitted ? "Submitted" : this.state.failed ? "Failed to save changes" : this.state.savingChanges ? "Saving Changes..." : "Save Changes"}</ClickableChip>

                        
                    
                    </ScrollView>
                    </SafeAreaView>
                </Modal>

                    





            <SafeAreaView style={{ flexDirection: "column", backgroundColor: Colors.tango900}} />

            <View style={{flex: 1}}>

                <LinearGradient
                    colors={['#FF8708', '#FFB33D']}
                    style={styles.headerBox}
                >
                    <TopBar style={{zIndex: 9}}>
                        <Icon 
                            iconName="arrow-left"
                            iconColor="#FFFFFF"
                            iconSize={28}
                            onPress={() => this.props.navigation.goBack(null)}
                        />
                        <View style={{marginLeft: 'auto'}}>
                            <Menu
                                visible={this.state.menuVisible}
                                onDismiss={() => this.setState({menuVisible: false})}
                                style={{marginLeft: 'auto'}}
                                anchor={
                                    <Icon 
                                        iconName="more-vertical"
                                        iconColor="#FFFFFF"
                                        iconSize={24}
                                        onPress={() => this.setState({menuVisible: true})}
                                        style={{paddingLeft: 30, marginLeft: "auto"}}
                                    /> 
                                }
                            >
                                <Menu.Item onPress={() => {this.props.navigation.navigate('Settings')}} title="Settings" />
                                <Menu.Item onPress={() => {this.onShare()}} title="Invite friends" />
                                <Menu.Item onPress={() => {}} title="Promo code" />
                                <Divider />
                                <Menu.Item onPress={() => {this.props.navigation.navigate('TOS')}} title="ToS and Privacy Policy" />
                                <Menu.Item onPress={this.signOut} title="Sign out" />
                            </Menu>
                        </View>
                        
                        {/* <Icon 
                            iconName="more-vertical"
                            iconColor="#FFFFFF"
                            iconSize={24}
                            onPress={() => alert("pressed 2!")}
                            style={{marginLeft: "auto"}}
                        /> */}
                    </TopBar>
                </LinearGradient>
                 


                {/* returns if we know the user has a profile photo via Firebase Auth or uploaded to UserStore  */}
                 {this.props.UserStore.photo || auth().currentUser.photoURL ? 
                 <View>
                    {/* if we are hosting user image ourselves */}
                    {this.props.UserStore.photo ?

                    <View>
                        <ProfilePic 
                            initals={initals}
                            imgWidth = {80}
                            imgHeight = {80}
                            style={{backgroundColor: "#ffffff", top: -45 , alignSelf: "center", position: "absolute"}}
                            fontSize={24}
                            fontColor="#1D2951"
                            source={{ uri: this.props.UserStore.photo }}

                        />
                    </View>
                   
                    // if google is hosting the photo
                    :
                    <View>
                        <ProfilePic 
                            initals={initals}
                            imgWidth = {80}
                            imgHeight = {80}
                            style={{backgroundColor: "#ffffff", top: -45, alignSelf: "center", position: "absolute"}}
                            fontSize={24}
                            fontColor="#1D2951"
                            source={{ uri: auth().currentUser.photoURL }}

                        />
                    </View>
                }
                    
                
                    </View>
                    : 
                    <View> 
                        <ProfilePic 
                            initals={initals}
                            imgWidth={80}
                            imgHeight={80}
                            style={{backgroundColor: "#ffffff", top: -45, alignSelf: "center", position: "absolute"}}
                            fontSize={24}
                            fontColor={Colors.apollo900}

                        />
                    </View>
                    }

                        <Circle 
                            onPress={() => {this.editAccountModal(true)}}
                            left={width/2 + 15}
                            top={-60}
                            width={50}
                            height={30}
                            style={{zIndex: 9999, shadowColor: '#000', margin: 5, overflow: 'visible', backgroundColor:"#FFFFFF", width: 40, height: 40, shadowOpacity: 0.6, shadowOffset:{width: 0, height: 0}, shadowRadius: 3, elevation: 12}}
                            >   
                                <Icon
                                    iconName="edit-2"
                                    iconColor="#fbb144"
                                    iconSize={18}
                                    
                                />
                            </Circle>

                   
                    <ScrollView style={{marginTop: 12}} refreshControl={<RefreshControl refreshing={this.state.isRefreshing} onRefresh={this.updateProfile}/>}>
                        
                        <View style={styles.contentBox}>
                            <View style={{flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: 16}}>
                                {listings == undefined || listings.length <= 1 ? <Text style={styles.categoryTitle}>My Space</Text> : <Text style={{fontSize: 20, marginRight: 'auto'}}>My Spaces</Text>}
                                <ClickableChip
                                    bgColor='rgba(255, 193, 76, 0.3)' // Colors.Tango300 with opacity of 30%
                                    onPress={() => this.props.navigation.navigate("AddSpace")}
                                    textColor={Colors.tango700}
                                >+ Space</ClickableChip>
                            </View>                            
                        </View>
                        <View>
                            {listings == undefined ? null : <SpacesList listings={this.props.UserStore.listings}/>}
                        </View>
                        <View style={styles.contentBox}>
                            <View style={{flexDirection: 'row', justifyContent: 'flex-start', paddingLeft: 16, paddingRight: 16}}>
                                {vehicles == undefined || vehicles.length <= 1 ? <Text style={styles.categoryTitle}>My Vehicle</Text> : <Text style={{fontSize: 20, marginRight: 'auto'}}>My Vehicles</Text>}
                                <ClickableChip
                                    onPress={() => this.props.navigation.navigate("AddVehicle")}
                                    bgColor='rgba(255, 193, 76, 0.3)' // Colors.Tango300 with opacity of 30%
                                    textColor={Colors.tango700}
                                >+ Vehicle</ClickableChip>
                            </View>
                            <View>
                                {vehicles == undefined ? null : <VehicleList/>}
                            </View>
                            
                        </View>
                        <View style={styles.contentBox}>
                            <View style={{flexDirection: 'row', justifyContent: 'flex-start', paddingLeft: 16, paddingRight: 16}}>
                                {payments == undefined || payments.length <= 1 ? <Text style={styles.categoryTitle}>My Payment</Text> : <Text style={{fontSize: 20, marginRight: 'auto'}}>My Payments</Text>}
                                <ClickableChip
                                    onPress={() => this.props.navigation.navigate("AddPayment")}
                                    bgColor='rgba(255, 193, 76, 0.3)' // Colors.Tango300 with opacity of 30%
                                    textColor={Colors.tango700}
                                >+ Card</ClickableChip>
                            </View>
                            <View>
                                {payments == undefined ? null : <PaymentList/>}
                            </View>
                        </View>
                    </ScrollView>

                    <Snackbar
                        visible={this.state.verificationSnackbarVisible}
                        onDismiss={() => this.setState({ verificationSnackbarVisible: false })}
                        action={{
                            label: 'Verify',
                            onPress: () => this.resendVerification(),
                        }}
                        >
                        Looks like your account needs verified at {this.props.UserStore.email}.
                        </Snackbar>
                </View>
            </View>
            </Provider>
            
        )
    }
    
}

const styles = StyleSheet.create({
    container:{
        flexDirection: "row",
        justifyContent: 'center',
        position: 'absolute',
     
    },

    categoryTitle: {
        fontSize: 20, 
        marginRight: 'auto'
    },

    contentBox:{
        paddingVertical: 16,   

    },
    headerBox: {
        // position: 'absolute',
        height: Dimensions.get("window").height /9,
        paddingBottom: 20,
        width: Dimensions.get('window').width,
        // borderWidth: 1,
        // borderBottomRightRadius: 20,
        // borderBottomLeftRadius: 20,
        position: "relative",
        
    },
    name: {
        alignSelf: 'center',
        color: '#ffffff',
        fontSize: 18,
        marginTop: 5,
        fontWeight: '700'
    },
    passwordReset: {
        color: 'red',
        textDecorationLine: 'underline',
        fontSize: 16,
        alignSelf: 'center',
        marginTop: 24
      }
})

export default Profile;