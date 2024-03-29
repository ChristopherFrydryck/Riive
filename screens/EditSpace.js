import React, { Component } from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, SafeAreaView, Dimensions, Animated, TouchableOpacity, KeyboardAvoidingView, FlatList, Switch, Modal, Picker, Alert, Linking} from 'react-native';
import Text from '../components/Txt'
import MapView, {Marker} from 'react-native-maps';
import DayMap from '../constants/DayMap'
import NightMap from '../constants/NightMap'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import {Card, ThemeProvider} from 'react-native-paper';

import ImagePicker from 'react-native-image-crop-picker';
import config from 'react-native-config'


import 'intl'



import Input from '../components/Input'
import Icon from '../components/Icon'
import Button from '../components/Button'
import Colors from '../constants/Colors'
import Image from '../components/Image'
import DayAvailabilityPicker from '../components/DayAvailabilityPicker'
import SpacesCounter from '../components/SpacesCounter'
import Dropdown from '../components/Dropdown'
import DropdownItem from '../components/DropdownItem';

// import * as firebase from 'firebase/app';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage'


//MobX Imports
import {inject, observer} from 'mobx-react'
import ClickableChip from '../components/ClickableChip';










@inject("UserStore", "ComponentStore")
@observer
class editSpace extends Component {
  _isMounted = false;


  static navigationOptions = ({navigation}) => {
    const { params = {} } = navigation.state;
    
    return{
      title: params.title ? params.title : "Loading...",
      headerTitleStyle:{
          fontWeight: "300",
          fontSize: 18,
      },
      headerRight: () => (
        
        params.deleted && params.deleteDate > new Date().getTime() ? 
          null :
          params.deleted ?
          <TouchableOpacity
          onPress={() => params.restoreSpace()}
          style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16}}
        >
          <Icon 
            iconName="backup-restore"
            iconLib="MaterialCommunityIcons"
            iconColor="rgb(14, 122, 254)"
            iconSize={18}
            style={{marginRight: 4}}
          />
          <Text style={{fontSize: 18, color: "rgb(14, 122, 254)"}}>Restore</Text>
        </TouchableOpacity>
        : 
          <TouchableOpacity
            onPress={() => params.openEditModal()}
            style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16}}
          >
            <Icon 
              iconName="edit-2"
              iconColor="rgb(14, 122, 254)"
              iconSize={18}
              style={{marginRight: 4}}
            />
            <Text style={{fontSize: 18, color: "rgb(14, 122, 254)"}}>Edit</Text>
          </TouchableOpacity>
        
      )
    }
    
};


    constructor(props){
        super(props)

        const {selectedSpot} = this.props.ComponentStore
        const space = selectedSpot[0]
        

        this.state = {

            currentActivePhoto: 0,
            changesMade: false,

            editModalOpen: false,


            postID: space.listingID,
            region: {
              latitude: space.region.latitude,
              longitude: space.region.longitude,
              latitudeDelta: space.region.latitudeDelta,
              longitudeDelta: space.region.longitudeDelta,
            },
            address: {
              full: space.address.full,
              number: space.address.number,
              street: space.address.street,
              box: space.address.box,
              city: space.address.city,
              county: space.address.county,
              state: space.address.state,
              state_abbr: space.address.state_abbr,
              country: space.address.country,
              country_abbr: space.address.country_abbr,
              zip: space.address.zip,
              spaceNumber: space.address.spaceNumber,
            },
            
            searchedAddress: true,
            nameValid: true,
            bioValid: true,
            priceValid: true,

            nameError: '',
            bioError: '',
            priceError: '',

    
            


            imageBrowserOpen: false,
            uploadingImage: false,
            photo: space.photo,

            savingSpace: false,
            

            spaceName: space.spaceName,
            spaceBio: space.spaceBio,
            spacePrice: space.spacePrice,
            spacePriceCents: space.spacePriceCents,
            numSpaces: space.numSpaces,

            daily: space.availability,

            // Integrated version 1.0.0
            hidden: space.hidden,
            toBeDeleted: space.toBeDeleted,
            deleteDate: space.deleteDate,
            visits: space.visits,

            
            
        }
    }

    async componentDidMount(){
      // Set Status Bar page info here!
      const db = firestore();
      const ref = db.collection("spaces").doc();

      


      this._isMounted = true;
     this._navListener = this.props.navigation.addListener('didFocus', () => {
         StatusBar.setBarStyle('dark-content', true);
         Platform.OS === 'android' && StatusBar.setBackgroundColor('white');
       });

       const add = this.state.address.number + " " + this.state.address.street

       this.props.navigation.setParams({
         title: add.length > 20 ? add.substring(0,20) + "..." : add,
         deleted: this.state.toBeDeleted,
         openEditModal: this.openEditModal,
         restoreSpace: this.restoreAlert,
      });

       
    }

    openEditModal = () => {
      this.setState({editModalOpen: !this.state.editModalOpen})
    }

    


    getPermissionAsync = async (...perms) => {
      if (Platform.OS == 'ios') {
        const { status } = await Permissions.askAsync(...perms);
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    };

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

    containsWhitespace = (str) => {
      return /^\s*$/.test(str);
    }



  verifyInputs = () => {
    const nameValidation = /^[A-Za-z0-9.?!;,()\-$@%&'"“”‘’#]+[A-Za-z0-9 .?!;,()\-$@%&'"“”‘’#]+[A-Za-z0-9.?!;,()\-$@%&'"“”‘’#]{1}$/;
    const bioValidation =  /^[A-Za-z0-9]{1}[A-Za-z0-9 .?!;,()\-$@%&'"“”‘’#]{1,299}$/gm;

    let nameValid = nameValidation.test(this.state.spaceName)
    let bioValid = this.state.spaceBio.split("").length > 0 ? bioValidation.test(this.state.spaceBio) : true;

    


    if(this.state.spacePrice){
      let spaceCentsArray = this.state.spacePrice.split(".")
      let spaceCents = parseInt(spaceCentsArray[0].slice(1) + spaceCentsArray[1])
        if(spaceCents > 49){
          this.setState({spacePriceValid: true, priceError: ''})
          // console.log("Price is valid")
        }else{
          this.setState({spacePriceValid: false, priceError: 'Price must be at least $0.50'})
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
        if(this.state.spaceName.split("")[this.state.spaceName.length - 1] == " "){
          this.setState({nameError: 'Avoid ending a name with a space'})
        }else if(this.state.spaceName.length <= 3){
          this.setState({nameError: 'A name must be at least 3 characters long'})
        }else{
          this.setState({nameError: 'Avoid using special characters excluding .?!;,()-$@%&\'"'})
        }
      }
      
    }

    // console.log(bioValid)

    if(bioValid){
      this.setState({bioValid: true, bioError: ''})
    }else if(this.containsWhitespace(this.state.spaceBio.split("")[this.state.spaceBio.length - 1])){
      this.setState({bioValid: false, bioError: 'Avoid using a space at the end of a bio.'})
    }else if(this.state.spaceBio.split("").length < 3){
      this.setState({bioValid: false, bioError: 'A space bio must be at least three characters long.'})
    }else{
      this.setState({bioValid: false, bioError: 'Avoid use of special characters outside of .?!;-,()$@%&'})
    }
  }


  checkForChanges = async(stateArg, val) => {
    const {selectedSpot} = this.props.ComponentStore;
    const space = selectedSpot[0]

    await this.setState({[stateArg]: val})


    let spaceAvailableMatch = JSON.stringify(space.availability) == JSON.stringify(this.state.daily)
    let spaceBioMatch = space.spaceBio == this.state.spaceBio;
    let spaceNumbersMatch = space.numSpaces == this.state.numSpaces;
    let spaceNameMatch = space.spaceName == this.state.spaceName;
    let spacePriceMatch = space.spacePrice == this.state.spacePrice;
    let spacePhotoMatch = space.photo == this.state.photo

    if(spaceAvailableMatch && spaceBioMatch && spaceNameMatch && spacePriceMatch && spacePhotoMatch && spaceNumbersMatch){
      // console.log("No changes")
      this.setState({changesMade: false})
    }else{
      // console.log("Changes made")
      this.setState({changesMade: true})
    }
  }




  submitSpace = async() => {

    await this.setState({savingSpace: true})
    await this.verifyInputs();

    const db = firestore();
    var spaceFromDB = null
    // console.log(this.state.postID)

    await db.collection("listings").doc(this.state.postID).get().then((snapshot) => {
      spaceFromDB = snapshot.data()
     })


      if(this.state.searchedAddress && this.state.spacePrice && this.state.priceValid && this.state.nameValid && this.state.spacePriceValid && this.state.bioValid && this.state.photo){


        // Split bio into sections from linebreaks
        let bioSplit = this.state.spaceBio.split(/\r?\n|\r|\n/g)
        let bioSplitRemovals = []

        //if there is a line break in the bio, check each line and then find which lines are 
        // just whitespace. Add them to another array called bioSplitRemovals
        if(bioSplit.length >= 2){
          for(let i = 0; i < bioSplit.length; i++){
            if(this.containsWhitespace(bioSplit[i])){
              bioSplitRemovals.push(i)
            }
          }
        }

        // Filter out the blank lines and add two retun carriages. This will ensure that 20 line breaks become only two.
        bioSplit = bioSplit.filter((x, i) => !bioSplitRemovals.includes(i)).join(`\n\n`)

        
        // console.log(`indexes to be removed: ${bioSplitRemovals}`)
        // console.log(`biosplit is now ${bioSplit}`)

        // Update spaceBio to be the new version of the split bio with less line breaks
        this.setState({spaceBio: bioSplit})
        
       
          await this.uploadImage(this.state.photo)
          try{  
             let spaceCentsArray = this.state.spacePrice.split(".")
             let spaceCents = parseInt(spaceCentsArray[0].slice(1) + spaceCentsArray[1])
             let createdTime = new Date().getTime();

              
              
              await db.collection("listings").doc(this.state.postID).update({
                listingID: this.state.postID,
                hostID: this.props.UserStore.userID,
                address: this.state.address,
                region: this.state.region,
                photo: this.state.photo,
                spaceName: this.state.spaceName,
                spaceBio: this.state.spaceBio,
                spacePrice: this.state.spacePrice,
                spacePriceCents: spaceCents,
                numSpaces: this.state.numSpaces,
                availability: this.state.daily,
                updated: createdTime,
                hidden: this.state.hidden,
                toBeDeleted: this.state.toBeDeleted,
                deleteDate: null,

               })

               
               const spaceIndex = this.props.UserStore.listings.map(x => x.listingID).indexOf(this.state.postID)

            

               this.props.UserStore.listings[spaceIndex] = {
                  listingID: this.state.postID,
                  hostID: this.props.UserStore.userID,
                  address: this.state.address,
                  region: this.state.region,
                  photo: this.state.photo,
                  spaceName: this.state.spaceName,
                  spaceBio: this.state.spaceBio,
                  spacePrice: this.state.spacePrice,
                  spacePriceCents: spaceCents,
                  numSpaces: this.state.numSpaces,
                  availability: this.state.daily,
                  created: spaceFromDB.created,
                  updated: createdTime,
                  hidden: this.state.hidden,
                  toBeDeleted: this.state.toBeDeleted,
                  deleteDate: null,
                  visits: this.state.visits,
               }
               // add space to mobx UserStore
              //  await this.props.UserStore.listings.push({
              //     listingID: this.state.postID,
              //     address: this.state.address,
              //     region: this.state.region,
              //     photo: this.state.photo,
              //     spaceName: this.state.spaceName,
              //     spaceBio: this.state.spaceBio,
              //     spacePrice: this.state.spacePrice,
              //     spacePriceCents: spaceCents,
              //     numSpaces: this.state.numSpaces,
              //     availability: this.state.daily,
              //     created: createdTime
              //  })

                  // navigate back to profile
                  this.props.navigation.navigate("Profile")
                  this.setState({savingSpace: false})
                }catch(e){
                  console.log(e)
                  this.setState({savingSpace: false})
                }
        
       
                this.mailchimpHostTag(true)
        // console.log(`${this.state.address.number} ${this.state.address.street}${this.state.address.box && this.state.address.box.split('').length > 0 ? " APT #" + this.state.address.box :""}, ${this.state.address.city}, ${this.state.address.state_abbr} ${this.state.address.zip}...${this.state.address.country}`)
        // console.log(`${this.state.address.spaceNumber}`)
                 

      }else{
        this.setState({savingSpace: false})
      }
    }
    
  


  availabilityCallbackFunction = (data) => {
  
    this.checkForChanges("daily", data)
  }

  deleteAlert = () => {
    Alert.alert(
        "Deleting a Space", 
        "Deleting a hosted space makes it unavailable to any future trips and will remove itself from your profile in 7 days. All current trips will still occur unless you cancel them individually.",
        [
          { text: 'Cancel' },
          { text: 'Delete Space', onPress: () => this.deleteSpace()}
      ]
    )
  }

  mailchimpHostTag = (val) => {
    const settings = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: this.props.UserStore.email,
        mailchimpID: this.props.UserStore.mailchimpID || null,
        // Tags should be the anatomy of objects which are [{ name: "name", status: "active" }]
        tags: [{name: "host", status: val == true ? "active" : "inactive"}]
      })
    }
    
    fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/mailchimpAddTag`, settings).then(response => {
      return response.json();
    }).then(response => {
      if(response.statusCode == 204){
        return response
      }else{
        throw response
      }      
    }).catch(e => {
      console.warn(e)
      throw e
    })

    return null
  }

  deleteSpace = async() => {
    const db = firestore();
    let date = new Date();
    date.setDate(date.getDate() + 7);
  
    await db.collection("listings").doc(this.state.postID).update({
      toBeDeleted: true,
      deleteDate: date.getTime()
    }).then(() => {
      let idArray = this.props.UserStore.listings.map(x => x.listingID)
      let index = idArray.indexOf(this.state.postID)

      this.props.UserStore.listings[index].toBeDeleted = true;
      this.props.UserStore.listings[index].deleteDate = date.getTime();

      if(!this.props.UserStore.listings.map(x => x.toBeDeleted).includes(false)){
        this.mailchimpHostTag(false)
      }

    }).then(() => {
      this.props.navigation.goBack(null)
    })
  }

  restoreAlert = () => {
    Alert.alert(
      "Restoring a Space", 
      "Restoring your hosted space will make it available again to anyone searching within your availability. You can update it upon restoring your space.",
      [
        { text: 'Cancel' },
        { text: 'Restore Space', onPress: () => this.restoreSpace()} 
    ]
  )
  }

  restoreSpace = async() => {
    const db = firestore();
  
    await db.collection("listings").doc(this.state.postID).update({
      toBeDeleted: false,
      deleteDate: null,
    }).then(() => {
      let idArray = this.props.UserStore.listings.map(x => x.listingID)
      let index = idArray.indexOf(this.state.postID)

      this.props.UserStore.listings[index].toBeDeleted = false;
      this.props.UserStore.listings[index].deleteDate = null;

      this.mailchimpHostTag(true)
    }).then(() => {
      this.props.navigation.goBack(null)
    })
  }



  navigationCallbackFunction = () => {
    this.props.navigation.goBack(null)
  }
   


       
   

     componentWillUnmount() {
      this._isMounted = false;
          // Unmount status bar info
        //  this._navListener.remove();
       }

   
      






carouselUpdate = (xVal) => {
    const {width} = Dimensions.get('window')

    let newIndex = Math.round(xVal/width)

    // console.log(newIndex)

    this.setState({currentActivePhoto: newIndex})
}


renderDotsView = (numItems, position) =>{
    var arr = [];
    for(let i = 0; i <= numItems - 1; i++){
        arr.push(
            <Animated.View 
                key={i}
                style={{ opacity: position == i ? 1 : 0.3, height: 8, width: 8, backgroundColor: Colors.cosmos900, margin: 2, borderRadius: 8 }}
              />
        )
    }

    return(arr)
    
    }



  render() {
    //   console.log(this.props.ComponentStore.selectedSpace)
      const {width, height} = Dimensions.get('window')
      const {ComponentStore, UserStore} = this.props

      return(
        
        <KeyboardAwareScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1, backgroundColor: 'white'}} scrollEnabled
              enableOnAndroid={true}
              extraScrollHeight={150} //iOS
              extraHeight={135} //Android
              >
          <Modal
            visible={this.state.editModalOpen} animationType="slide"
            //         transparent={true}          
          >
            <SafeAreaView style={{backgroundColor: 'white', flex: 0}} />
            <View style={{padding: 8, flexDirection: 'row', justifyContent: 'space-between'}}>
   
                  <Text style={{fontSize: 20, marginRight: 'auto', marginTop: 8, marginLeft: 8}}>Edit Space</Text>
                  <Icon 
                      iconName="x"
                      iconColor={Colors.cosmos500}
                      iconSize={28}
                      onPress={() => this.openEditModal()}
                      style={{marginTop: 10, marginLeft: "auto", marginRight: 5}}
                  />
              </View>
              <KeyboardAwareScrollView 
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ flexGrow: 1 }} scrollEnabled
                    enableOnAndroid={true}
                    extraScrollHeight={150} //iOS
                    extraHeight={135} //Android
                  >
                  
                  <View style={{ width: "100%", paddingHorizontal: 16, position: 'absolute', zIndex: 9, }}>
                    <TouchableOpacity onPress={() => this.deleteAlert()} style={{ padding: 8, backgroundColor: 'rgba(232, 66, 66, 0.7)'}}>
                      <View style={{flexDirection: 'row'}}>
                      <Icon
                                iconName="trash"
                                iconLib="feather"
                                iconColor="white"
                                iconSize={16}
                                style={{marginRight: 8, marginTop: 4}}
                            />
                        <Text style={{color: "white", fontSize: 16, marginRight: 24}}>Delete space @ {this.state.address.full.split(",")[0]}</Text>
                      </View>
                      {this.state.address.spaceNumber ? <Text style={{color: "white", marginLeft: 24}}>Space # {this.state.address.spaceNumber}</Text> : null}
                    </TouchableOpacity>
                  </View>
                  <View style={{paddingHorizontal: 16}}>
                      
                      <View style={{}}>
                        <Image 
                          style={{width: Dimensions.get("window").width - 32, flex: 1}}
                          aspectRatio={16/9}
                          source={{uri: this.state.photo}}
                          resizeMode={'cover'}
                        /> 

                        <View style={{flexDirection: 'row', position: 'absolute', bottom: 8, left: 8, width: Dimensions.get("window").width - 32, paddingBottom: 2}}>
                          <ClickableChip onPress={() => this.pickImage()} bgColor='rgba(0, 0, 0, 0.6)' style={{marginRight: 8}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS == 'ios' ? 4 : 0}}>
                              <Icon 
                                    iconName="photo"
                                    iconLib="Foundation"
                                    iconColor={Colors.mist300}
                                    iconSize={16}
                                    style={{paddingRight: 6}}
                                />
                                <Text style={{color: Colors.mist300}}>Change Photo</Text>
                            </View>
                          </ClickableChip>
                          <ClickableChip onPress={() => this.launchCamera()} bgColor='rgba(0, 0, 0, 0.6)' style={{}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS == 'ios' ? 4 : 0}}>
                              <Icon 
                                    iconName="camera"
                                    iconColor={Colors.mist300}
                                    iconSize={16}
                                    style={{paddingRight: 6}}
                                />
                                <Text style={{color: Colors.mist300}}>Take Photo</Text>
                            </View>
                          </ClickableChip>
                        </View>
                    </View>
                    
  
                        {/* <View style={{display: "flex", flexDirection: 'row', marginBottom: 16}}>
                        <Button style={{flex: 1, backgroundColor: "#FF8708"}} textStyle={{color:"#FFFFFF"}} onPress={() => this.pickImage()}>Change Photo</Button>
                        <Button style={{flex: 1, marginLeft: 8, backgroundColor: "#FF8708"}} textStyle={{color:"#FFFFFF"}} onPress={() => this.launchCamera()}>Take Photo</Button>
                      </View> */}
                    
                      
                      </View>

                  <View style={{paddingHorizontal: 16, marginTop: 8}}>
                    <Input 
                      placeholder='Name your space...'         
                      label="Space Name"
                      name="space name"                 
                      onChangeText= {val => this.checkForChanges("spaceName", val)}
                      value={this.state.spaceName}
                      maxLength = {40}
                      keyboardType='default'
                      error={this.state.nameError}
                    />
                    <Input 
                      placeholder='Add a bio...'         
                      label="Space Bio (optional)"
                      name="space bio"                 
                      onChangeText= {val => this.checkForChanges("spaceBio", val)}
                      value={this.state.spaceBio}
                      mask="multiline"
                      numLines={4}
                      maxLength = {300}
                      keyboardType='default'
                      error={this.state.bioError}
                    />
                    
                  </View>
                 
                  <View style={{paddingHorizontal: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start'}}>
                    <Input 
                        placeholder='$1.25'         
                        label="Hourly Rate"
                        name="cost"             
                        onChangeText= {val => this.checkForChanges("spacePrice", val)}
                        value={this.state.spacePrice}
                        mask="USD"
                        maxLength = {6}
                        keyboardType='default'
                        suffix="/hr"
                        flex = {1}
                        // rightText="est. $1.50/hr"
                        error={this.state.priceError}
                        style={{marginTop: 2}}
                      />
                      <View style={{paddingHorizontal: 16, marginBottom: 16, flex: 1}}>
                      {/* <Text style={styles.label}>Number of Spaces</Text> */}
                      {/* <View style={{marginLeft: 16, flex: 16}}> */}
                        <Dropdown
                            selectedValue = {this.state.numSpaces}
                            label="Number of Spaces"
                            // error={this.state.error.make}
                            // style={{marginTop: -10}}
                            onValueChange = {(spaces) => this.checkForChanges("numSpaces", spaces.value)}   
                        >
                           {[
                            { key: 1, label: "1", value: 1 },
                            { key: 2, label: "2", value: 2 },
                            { key: 3, label: "3", value: 3 },
                            { key: 4, label: "4", value: 4 },
                            { key: 5, label: "5", value: 5 },
                            { key: 6, label: "6", value: 6 },
                            { key: 7, label: "7", value: 7 },
                            { key: 8, label: "8", value: 8 },
                            { key: 9, label: "9", value: 9 },
                            { key: 10, label: "10", value: 10 },
                           ]}
                         </Dropdown>
                    </View>
                    </View>

                    

                    {/* <View style={styles.numHoriz}>
                      <View style={styles.numContainer}>
                        <Text style={styles.number} type="bold">5</Text>
                      </View>
                      <Text style={styles.numTitle}>Space Availability</Text>
                    </View> */}
                    <View style={{paddingHorizontal: 16}}>
                      <DayAvailabilityPicker 
                        listing={this.props.ComponentStore.selectedSpot[0]}
                        availability={this.state.daily}
                        availabilityCallback={this.availabilityCallbackFunction}
                        navigationCallback={this.navigationCallbackFunction}
                        >
                      </DayAvailabilityPicker>

                    </View>
                   
                </KeyboardAwareScrollView>
                <View style={{paddingHorizontal: 16, marginBottom: 24, height: 60, alignItems: 'center', justifyContent: 'center'}}>
                  <Button style={ this.state.changesMade ? {backgroundColor: "#FF8708", height: 48} : {backgroundColor:  Colors.mist900, height: 48}} textStyle={this.state.changesMade ? {color:"#FFFFFF"} : {color: Colors.cosmos300}} disabled={!this.state.changesMade} onPress={() => this.submitSpace()}>{this.state.savingSpace  ? null : "Save Changes"}</Button>
                </View>
           

                  
                   
                  </Modal>

                  <SafeAreaView>
                  <View>
                    <ScrollView
                        horizontal={true}
                        pagingEnabled={true}
                        scrollEnabled={true}
                        decelerationRate={0}
                        snapToAlignment="start"
                        snapToInterval={Dimensions.get("window").width}
                        onScroll={data =>  this.carouselUpdate(data.nativeEvent.contentOffset.x)}
                        scrollEventThrottle={1}
                        showsHorizontalScrollIndicator={false}
                        // persistentScrollbar={true}
                    >
                    <View>
                    <Image 
                            style={{width: width}}
                            aspectRatio={16/9}
                            source={{uri: this.state.photo}}
                            resizeMode={'cover'}
                        /> 
                        </View>
                        <View>
                        <View  style={{ position:'absolute', width: width, aspectRatio: 16/9, zIndex: 9}}/>
                            <MapView
                            provider={MapView.PROVIDER_GOOGLE}
                            mapStyle={NightMap}
                            style={{width: width, aspectRatio:16/9}}
                            region={{
                            latitude: this.state.region.latitude,
                            longitude: this.state.region.longitude,
                            latitudeDelta: this.state.region.latitudeDelta,
                            longitudeDelta: this.state.region.longitudeDelta,
                            }}
                            pitchEnabled={false} 
                            rotateEnabled={false} 
                            zoomEnabled={false} 
                            scrollEnabled={false}
                            >
                                <Marker 
                                    coordinate={{
                                    latitude: this.state.region.latitude,
                                    longitude: this.state.region.longitude
                                    }}   
                                />
                            </MapView>
                        </View>
                    </ScrollView>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 8}}>
                        {this.renderDotsView(2, this.state.currentActivePhoto)}
                    </View>
                  </View>
                
                  <View style={styles.contentBox}>
                    {this.state.toBeDeleted ? 
                    <View style={{ alignSelf: "flex-start", backgroundColor: Colors.hal500, paddingVertical: 4, paddingHorizontal: 16, borderRadius: width, marginBottom: 8 }}>
                      <Text style={{ fontSize: 16, color: Colors.mist300,}}>{this.state.deleteDate > new Date().getTime() ? `Deleting on ${String(new Date(this.state.deleteDate)).split(" ")[1]} ${String(new Date(this.state.deleteDate)).split(" ")[2]}` : `Deleted`}</Text>
                    </View>
                    :
                    <View style={{alignSelf: 'flex-start', justifyContent: 'center', backgroundColor: Colors.fortune500, paddingVertical: 4, paddingHorizontal: 16, borderRadius: width, marginBottom: 8}}>
                                <Text style={{ fontSize: 16, color: Colors.mist300,}}>{this.state.spacePrice}/hr</Text>
                    </View>
                    }
                  
                        <Text  style={{ flex: 0,fontSize: 24, flexWrap: 'wrap'}}>{this.state.spaceName}</Text>
                        <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
                            <Icon
                                iconName="location-pin"
                                iconLib="Entypo"
                                iconColor={Colors.cosmos300}
                                iconSize={16}
                                style={{marginRight: 8, marginTop: 4}}
                            />
                            <Text style={{fontSize: 16, color: Colors.cosmos300,  flexWrap: 'wrap', marginRight: 24}}>{this.state.address.full} {this.state.address.box ? "#"+this.state.address.box : null}</Text>
                        </View>
                        <View style={{flexDirection: 'row', flex: 1, alignItems: 'flex-start', flexShrink: 1, marginTop: 4}}>
                            <Icon
                                iconName="garage"
                                iconLib="MaterialCommunityIcons"
                                iconColor={Colors.cosmos300}
                                iconSize={20}
                                style={{marginRight: 6, marginTop: 2}}
                            />
                            <Text style={{fontSize: 16, color: Colors.cosmos300, marginRight: 24}}>{this.state.numSpaces} Parking {this.state.numSpaces > 1 ? "Spaces" : "Space"}</Text> 
                        </View>
                        {this.state.spaceBio ? 
                        <View style={{flexDirection: 'row', flex: 1, alignItems: 'flex-start', flexShrink: 1, marginTop: 16}}>
                            <Icon
                                iconName="form"
                                iconLib="AntDesign"
                                iconColor={Colors.cosmos300}
                                iconSize={16}
                                style={{marginRight: 8, marginTop: 4}}
                            />
                            <Text style={{fontSize: 14, color: Colors.cosmos300, marginRight: 24}}>{this.state.spaceBio}</Text> 
                        </View>
                        : null}
                       

                      
                        <View style={{marginTop: 32}}>
                            <DayAvailabilityPicker 
                                listing={this.props.ComponentStore.selectedSpot[0]}
                                availability={this.state.daily}
                                availabilityCallback={this.availabilityCallbackFunction}
                                editable={false}
                            />
                        </View>
                        
                    
                  
                  </View>
              
                  </SafeAreaView>
                  
                </KeyboardAwareScrollView>
      )
}
}

const styles = StyleSheet.create({

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
  contentBox:{
    marginHorizontal: 16,  
  
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
    paddingTop: 4,
    color: '#333',
    fontSize: 14,
    fontWeight: '400',
    height: 24,
    width: 'auto'
},












})
  

export default editSpace
