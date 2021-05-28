import React, { Component } from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, SafeAreaView, Dimensions, KeyboardAvoidingView, FlatList, Switch, Modal, Picker, LogBox, Alert, Linking} from 'react-native';
import Text from '../../components/Txt'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapView, {Marker} from 'react-native-maps';
import DayMap from '../../constants/DayMap'
import NightMap from '../../constants/NightMap'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import LinearGradient from 'react-native-linear-gradient'
import {Card, ThemeProvider} from 'react-native-paper';

// import ImageBrowser from '../features/camera-roll/ImageBrowser'
import ImagePicker from 'react-native-image-crop-picker';


import CheckImage from '../../assets/img/CheckAnatomy.png'

import Input from '../../components/Input'
import Icon from '../../components/Icon'
import Button from '../../components/Button'
import Colors from '../../constants/Colors'
import Image from '../../components/Image'
import DayAvailabilityPicker from '../../components/DayAvailabilityPicker'
import FloatingCircles from '../../components/FloatingCircles'

import Timezones from '../../constants/Timezones'

import * as firebase from 'firebase/app';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth'
import storage from '@react-native-firebase/storage'
import * as geofirestore from 'geofirestore'


//MobX Imports
import {inject, observer} from 'mobx-react/native'





const regexFullname = /[^0-9]([a-zA-Z]{1,})+[ ]+([a-zA-Z-']{2,})*$/i;
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
            // creditCardNum: null,
            // creditCardType: '',
            // creditCardFormat: 'visa-or-mastercard',
            name: this.props.UserStore.fullname,
            allValid: false,
            authenticating: false,
            addCardToPayments: false,


            routingNumber: null,
            accountNumber: null,
            routingError: "",
            accountError: "",
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
    }




  addBankRoutingDD = async () => {

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
        
        routingNumber: this.state.routingNumber,
        accountNumber: this.state.accountNumber,
      })
    }
    try{
      
      const fetchResponse = await fetch('https://us-central1-riive-parking.cloudfunctions.net/addBankForDirectDeposit', settings)
      const data = await fetchResponse.json();
      return data;
    }catch(e){
      alert(e);
    }    
  }

  submitBankInfo = async() => {
    await this.setState({authenticating: true})
    var nameValid = regexFullname.test(this.state.name)
    if(nameValid){
      this.setState({nameError: ""})
      await this.addBankRoutingDD().then(result => {
        if(result.statusCode === 200){
          this.setState({authenticating: false, routingError: "", accountError: ""})
          this.props.UserStore.directDepositInfo = {
            type: result.bank.type,
            id: result.bank.id,
            fingerprint: result.bank.fingerprint,
            bankToken: result.bank.BankToken,
            number: result.bank.number,
            bankProvider: result.bank.bankProvider,
          }
        
          // navigate back
          this.props.navigation.navigate("BankInfo")
        }else{
          if(result.statusCode === 400){
            let isRoutingFailing = this.state.routingNumber === null || this.state.routingNumber === "";
            let isAccountNumFailing = this.state.accountNumber === null || this.state.accountNumber === "";
            if(isRoutingFailing){
              this.setState({routingError: "Add a routing number to your Riive account"})
            }else{
              this.setState({routingError: ""})
            }
  
            if(isAccountNumFailing){
              this.setState({accountError: "Add an account number to your Riive account"})
            }else{
              this.setState({accountError: ""})
            }
  
            if(!isRoutingFailing && !isAccountNumFailing){
              alert(result.message)
            }
  
          this.setState({authenticating: false})
        }else{
          alert(result.message)
        }
    }
  })
  }else{
              
    this.setState({nameError: "Use a valid first and last name", authenticating: false})

  }
  }
    
      
    
  


    
  
   


       
   

     componentWillUnmount() {
      this._isMounted = false;
          // Unmount status bar info
         this._navListener.remove();
       }


  render() {

    
      return(
        <KeyboardAwareScrollView 
         style={{backgroundColor: "white", paddingHorizontal: 16}} 
         contentContainerStyle={{flex: 1}}
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
          <Image 
            // aspectRatio={21/9}
            localImage={true}
            height={200}
            width={"100%"}
            source={CheckImage}
            resizeMode={'contain'}
            style={styles.check}
          /> 
          <View style={{flexDirection: "row"}}>
            <View style={{marginRight: 16, flex: 5}}>
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
            </View>
          <View style={{flexDirection: 'row'}}>
             <View style={{marginRight: 16, flex: 5}}>
              <Input 
                placeholder='XXXXXXXXXXXX'
                mask='number'
                label="Routing Number"
                name="Routing Number"
                maxLength={9}
                onChangeText = {val => {this.setState({routingNumber: val});}}
                value={this.state.routingNumber}
                error={this.state.routingError}
              />
              </View>
            </View>
            <View style={{flexDirection: "row"}}>
            <View style={{marginRight: 16, flex: 5}}>
              <Input 
                placeholder='XXXXXXXXXXXX'
                mask='number'
                label="Account Number"
                name="Account Number"
                maxLength={12}
                onChangeText = {val => {this.setState({accountNumber: val});}}
                value={this.state.accountNumber}
                error={this.state.accountError}
              />
            </View>
            </View>
            
            <View style={{flexDirection: "row"}}>
            <View style={{marginRight: 16, flex: 5}}>
              <Input 
                placeholder="United States"
                label="Country"
                name="country"
                editable={false}
                // onChangeText={(n) => this.setState({name: n})}
                value="United States"
                maxLength={40}
                // style={{}}
                // error={this.state.nameError}
              />
            </View>
            <View style={{marginRight: 16, flex: 5}}>
              <Input 
                placeholder="USD"
                label="Currency"
                name="currency"
                editable={false}
                // onChangeText={(n) => this.setState({name: n})}
                value="USD"
                maxLength={3}
                // error={this.state.nameError}
              />
            </View>
            </View>
            <Button style={{backgroundColor: Colors.apollo700}} disabled={this.state.authenticating} textStyle={{color: 'white'}} onPress={() => this.submitBankInfo()}>{this.state.authenticating ? <FloatingCircles color="white"/> : "Save Bank Account"}</Button>
          </View>
          
         
        </KeyboardAwareScrollView >
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
  check: {
    width: "100%",
    height: 200,
    marginBottom: 20,
    marginTop: 0,
    // backgroundColor: Colors.apollo500,
    borderRadius: 0,
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