import React, { Component } from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, SafeAreaView, Dimensions, KeyboardAvoidingView, FlatList, Switch, Modal, Picker, LogBox} from 'react-native';
import Text from '../components/Txt'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapView, {Marker} from 'react-native-maps';
import DayMap from '../constants/DayMap'
import NightMap from '../constants/NightMap'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import {Card, ThemeProvider} from 'react-native-paper';

// import ImageBrowser from '../features/camera-roll/ImageBrowser'
import ImagePicker from 'react-native-image-crop-picker';




import Input from '../components/Input'
import Icon from '../components/Icon'
import Button from '../components/Button'
import Colors from '../constants/Colors'
import Image from '../components/Image'
import DayAvailabilityPicker from '../components/DayAvailabilityPicker'

import Timezones from '../constants/Timezones'

import * as firebase from 'firebase/app';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage'
import * as geofirestore from 'geofirestore'


//MobX Imports
import {inject, observer} from 'mobx-react/native'









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
             visits: 0,
            
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
        alert(e)
        this.setState({imageUploading: false})
      })

      
    }


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
        alert(e)
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
                 
                 console.log(this.state.photo)
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
   


       
   

     componentWillUnmount() {
      this._isMounted = false;
          // Unmount status bar info
         this._navListener.remove();
       }

      getCoordsFromName(loc) {
        this.setState({
          latitude: loc.lat,
          longitude: loc.lng,
        })
      }

      imageBrowserCallback = (callback) => {
        callback.then((photos) => {
          console.log(photos)
          this.setState({
            imageBrowserOpen: false,
            photos: photos,
          })
        }).catch((e) => console.log(e))
      }


onSelectAddress = (det) => {
  // console.log(det.formatted_address)
  // console.log(det.geometry.location.lat);
  // console.log(det.address_c omponents)

  
  let gmtValue = null;
  
  // If it is not UTC 0
  if(det.utc_offset !== 0){
    let gmtOffset = det.utc_offset/60;
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



 
  
  var number = det.address_components.filter(x => x.types.includes('street_number'))[0]
  var street = det.address_components.filter(x => x.types.includes('route'))[0]
  var city = det.address_components.filter(x => x.types.includes('locality'))[0]
  var county = det.address_components.filter(x => x.types.includes('administrative_area_level_2'))[0]
  var state = det.address_components.filter(x => x.types.includes('administrative_area_level_1'))[0]
  var country = det.address_components.filter(x => x.types.includes('country'))[0]
  var zip = det.address_components.filter(x => x.types.includes('postal_code'))[0]

  if(number && street && city && county && state){
    this.setState(prevState => ({
      searchedAddress: true,
      timezone: timeZoneDB,
      region:{
        latitude: det.geometry.location.lat,
        longitude: det.geometry.location.lng,
        latitudeDelta: .006,
        longitudeDelta: .006
      },
      address:{
        ...prevState.address,
        full: det.formatted_address,
        number: number.long_name,
        street: street.long_name,
        city: city.long_name,
        county: county.long_name,
        state: state.long_name,
        state_abbr: state.short_name,
        country: country.long_name,
        zip: zip.long_name,
      }
    }))
    this.setState({addressError: ""})
  }else{
    this.setState({addressError: "Select a valid street address"})
    this.clearAddress();
  }



  
}

clearAddress = () => {
  this.GooglePlacesRef.setAddressText("")
  this.setState(prevState => ({
    searchedAddress: false,
    timezone: timeZoneDB,
    address:{
      ...prevState.address,
      full: null,
      number: null,
      street: null,
      city: null,
      county: null,
      state: null,
      state_abbr: null,
      country: null,
      zip: null,
    }
  }))
}










  render() {

    var numSpacesArray = Array.from(Array(10), (_, i) => i + 1)

    return (
      <KeyboardAwareScrollView
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustContentInsets={false}
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
            <GooglePlacesAutocomplete
            placeholder='Your Address...'
            returnKeyType={'search'}
            ref={(instance) => { this.GooglePlacesRef = instance }}
            currentLocation={false}
            minLength={2}
            autoFocus={false}
            listViewDisplayed={false}
            fetchDetails={true}
            onPress={(data, details = null) => this.onSelectAddress(details)}
            textInputProps={{
              clearButtonMode: 'never'
            }}
            renderRightButton={() => 
            <Icon 
              iconName="x"
              iconColor={Colors.cosmos500}
              iconSize={24}
              onPress={() => this.clearAddress()}
              style={{marginTop: 8, display: this.state.searchedAddress ? "flex" : "none"}}
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
                marginBottom: 8,
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
                backgroundColor: "none"
              },
              textInput: {
                paddingRight: 0,
                paddingLeft: 0,
                paddingBottom: 0,
                color: '#333',
                fontSize: 18,
                width: '100%'
              },
              description: {
                fontWeight: 'bold'
              },
              predefinedPlacesDescription: {
                color: '#1faadb'
              }
              
            }}
            />
            <Text style={styles.error}>{this.state.addressError}</Text>
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
                rightText="Estimated $1.50/hr"
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
