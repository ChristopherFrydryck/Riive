import React, { Component } from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, SafeAreaView, Dimensions, Animated, TouchableOpacity, KeyboardAvoidingView, FlatList, Switch, Modal, Picker, Alert, Linking} from 'react-native';
import Text from '../components/Txt'
import MapView, {Marker} from 'react-native-maps';
import DayMap from '../constants/DayMap'
import NightMap from '../constants/NightMap'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import {Card, ThemeProvider} from 'react-native-paper';

// import * as ImagePicker from 'expo-image-picker'
import ImagePicker from 'react-native-image-crop-picker';
// import RNImagePicker from 'react-native-image-crop-picker';
// import * as Permissions from 'expo-permissions'

import 'intl'



import Input from '../components/Input'
import Icon from '../components/Icon'
import Button from '../components/Button'
import Colors from '../constants/Colors'
import Image from '../components/Image'
import DayAvailabilityPicker from '../components/DayAvailabilityPicker'

import * as firebase from 'firebase/app';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage'


//MobX Imports
import {inject, observer} from 'mobx-react/native'
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
            deleteDate: null,
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
         openEditModal: this.openEditModal,
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



  verifyInputs = () => {

    const nameValidation = /^[A-Za-z0-9]+[A-Za-z0-9 %\-&,()]+[A-Za-z0-9]{1}$/
    const bioValidation =  /^[A-Za-z0-9]{1}[A-Za-z0-9 .?!;,()\-$@%&]{1,299}$/;

    let nameValid = nameValidation.test(this.state.spaceName)
    let bioValid = this.state.spaceBio.split("").length > 0 ? bioValidation.test(this.state.spaceBio) : true;

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


  checkForChanges = async(stateArg, val) => {
    const {selectedSpot} = this.props.ComponentStore;
    const space = selectedSpot[0]

    await this.setState({[stateArg]: val})


    let spaceAvailableMatch = JSON.stringify(space.availability) == JSON.stringify(this.state.daily)
    let spaceBioMatch = space.spaceBio == this.state.spaceBio
    let spaceNameMatch = space.spaceName == this.state.spaceName;
    let spacePriceMatch = space.spacePrice == this.state.spacePrice;
    let spacePhotoMatch = space.photo == this.state.photo

    if(spaceAvailableMatch && spaceBioMatch && spaceNameMatch && spacePriceMatch && spacePhotoMatch){
      // console.log("No changes")
      this.setState({changesMade: false})
    }else{
      // console.log("Changes made")
      this.setState({changesMade: true})
    }
  }




  submitSpace = async() => {


    await this.verifyInputs();

    const db = firestore();
    var spaceFromDB = null
    // console.log(this.state.postID)

    await db.collection("listings").doc(this.state.postID).get().then((snapshot) => {
      spaceFromDB = snapshot.data()
     })


      if(this.state.searchedAddress && this.state.spacePrice && this.state.priceValid && this.state.nameValid && this.state.bioValid && this.state.photo){


       
          await this.uploadImage(this.state.photo)
          this.setState({savingSpace: true})
          try{  
             let spaceCentsArray = this.state.spacePrice.split(".")
             let spaceCents = parseInt(spaceCentsArray[0].slice(1) + spaceCentsArray[1])
             let createdTime = new Date().getTime();
                 
           
              await this.setState({savingSpace: true})

              
              
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
        
       

        // console.log(`${this.state.address.number} ${this.state.address.street}${this.state.address.box && this.state.address.box.split('').length > 0 ? " APT #" + this.state.address.box :""}, ${this.state.address.city}, ${this.state.address.state_abbr} ${this.state.address.zip}...${this.state.address.country}`)
        // console.log(`${this.state.address.spaceNumber}`)
                 

      }else{
        this.setState({savingSpace: false})
      }
    }
    
  


  availabilityCallbackFunction = (data) => {
  
    this.checkForChanges("daily", data)
  }

  navigationCallbackFunction = () => {
    this.props.navigation.goBack(null)
  }
   


       
   

     componentWillUnmount() {
      this._isMounted = false;
          // Unmount status bar info
         this._navListener.remove();
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
                    <View style={{ padding: 8, backgroundColor: 'rgba(0, 0, 0, 0.6)'}}>
                      <View style={{flexDirection: 'row'}}>
                      <Icon
                                iconName="location-pin"
                                iconLib="Entypo"
                                iconColor="white"
                                iconSize={16}
                                style={{marginRight: 8, marginTop: 4}}
                            />
                        <Text style={{color: "white", fontSize: 16, marginRight: 24}}>{this.state.address.full} {this.state.address.box ? <Text style={{color: "white"}}># {this.state.address.box}</Text> : null}</Text>
                      </View>
                      {this.state.address.spaceNumber ? <Text style={{color: "white", marginLeft: 24}}>Space # {this.state.address.spaceNumber}</Text> : null}
                    </View>
                  </View>
                  <View style={{paddingHorizontal: 16}}>
                      
                      <View style={{}}>
                        <Image 
                          style={{width: Dimensions.get("window").width - 32, flex: 1}}
                          aspectRatio={16/9}
                          source={{uri: this.state.photo}}
                          resizeMode={'cover'}
                        /> 

                        <View style={{flexDirection: 'row', position: 'absolute', bottom: 8, left: 8, width: Dimensions.get("window").width - 32}}>
                          <ClickableChip onPress={() => this.pickImage()} bgColor='rgba(0, 0, 0, 0.6)' style={{height: 30, alignItems: 'center', justifyContent: 'center', marginRight: 8}}>
                            <View style={{flexDirection: 'row', alignItems: 'center',}}>
                              <Icon 
                                    iconName="photo"
                                    iconLib="Foundation"
                                    iconColor={Colors.mist300}
                                    iconSize={16}
                                    style={{paddingRight: 6, marginTop: 4}}
                                />
                                <Text style={{color: Colors.mist300}}>Change Photo</Text>
                            </View>
                          </ClickableChip>
                          <ClickableChip onPress={() => this.launchCamera()} bgColor='rgba(0, 0, 0, 0.6)' style={{height: 30, alignItems: 'center', justifyContent: 'center'}}>
                            <View style={{flexDirection: 'row', alignItems: 'center',}}>
                              <Icon 
                                    iconName="camera"
                                    iconColor={Colors.mist300}
                                    iconSize={16}
                                    style={{paddingRight: 6, marginTop: 4}}
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
                 
                  <View style={{paddingHorizontal: 16}}>
                    <Input 
                        placeholder='$1.25'         
                        label="Cost Per Hour"
                        name="cost"             
                        onChangeText= {val => this.checkForChanges("spacePrice", val)}
                        value={this.state.spacePrice}
                        mask="USD"
                        maxLength = {6}
                        keyboardType='default'
                        suffix="/hr"
                        rightText="Estimated $1.50/hr"
                        error={this.state.priceError}
                      />
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
                  <Button style={ this.state.changesMade ? {backgroundColor: "#FF8708", height: 48} : {backgroundColor:  Colors.mist900, height: 48}} textStyle={this.state.changesMade ? {color:"#FFFFFF"} : {color: Colors.cosmos300}} disabled={!this.state.changesMade} onPress={() => this.submitSpace()}>Save Changes</Button>
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
                    <View style={{width: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.fortune500, paddingVertical: 4, borderRadius: width, marginBottom: 8}}>
                                <Text style={{ fontSize: 16, color: Colors.mist300,}}>{this.state.spacePrice}/hr</Text>
                    </View>
                  
                        <Text  style={{fontSize: 24, flexWrap: 'wrap'}}>{this.state.spaceName}</Text>
                        <View style={{flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8}}>
                            <Icon
                                iconName="location-pin"
                                iconLib="Entypo"
                                iconColor={Colors.cosmos300}
                                iconSize={16}
                                style={{marginRight: 8, marginTop: 4}}
                            />
                            <Text style={{fontSize: 16, color: Colors.cosmos300,  flexWrap: 'wrap', marginRight: 24}}>{this.state.address.full} {this.state.address.box ? "#"+this.state.address.box : null}</Text>
                        </View>
                        {this.state.spaceBio ? 
                        <View style={{flexDirection: 'row', flex: 1, alignItems: 'flex-start', flexShrink: 1}}>
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
    paddingTop: 5,
    marginBottom: -2,
    paddingTop: 0,
    color: '#333',
    fontSize: 14,
    fontWeight: '400',
    width: 'auto'
},











})
  

export default editSpace
