
import React, {Component, createRef} from 'react'
import {Alert, View, ActivityIndicator, SafeAreaView, StatusBar, Platform, StyleSheet, Dimensions, Animated, Easing, TouchableOpacity, LogBox, PermissionsAndroid, Linking} from 'react-native'
import {Provider, Snackbar, Menu, Divider} from 'react-native-paper'

import axios from 'axios'
import ActionSheet from "react-native-actions-sheet";
import MapView, {Marker} from 'react-native-maps';
import DayMap from '../constants/DayMap'
import NightMap from '../constants/NightMap'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Geolocation from '@react-native-community/geolocation';
import {requestLocationAccuracy, check ,PERMISSIONS, openSettings, checkMultiple, checkNotifications} from 'react-native-permissions';
import { pushNotification, getToken } from '../functions/in-app/notifications'
import { checkPermissionsStatus } from '../functions/in-app/permissions'

import logo from '../assets/img/Logo_Abbreviated_001.png'

import Button from '../components/Button'
import Text from '../components/Txt'
import Icon from '../components/Icon'
import ProfilePic from '../components/ProfilePic';
import Image from '../components/Image'
import ListingMarker from '../components/ListingMarker'
import FilterButton from '../components/FilterButton'
import SearchFilter from '../components/SearchFilter'


import Colors from '../constants/Colors'
import Times from '../constants/TimesAvailable'

//For Shimmer
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient'
import Svg, {Circle, Rect} from 'react-native-svg'

// MobX
import { observer, inject } from 'mobx-react/native'
import UserStore from '../stores/userStore'
import ComponentStore from '../stores/componentStore'

// Firebase imports
import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging'
import firestore from '@react-native-firebase/firestore';
import 'firebase/firestore';
import 'firebase/auth';
import * as geofirestore from 'geofirestore'

if(Platform.OS === 'android') { // only android needs polyfill
  require('intl'); // import intl object
  require('intl/locale-data/jsonp/en');
  Intl.__disableRegExpRestore()
}




const stores = {
  UserStore, ComponentStore
}

const actionSheetRef = createRef();
const db = firestore();

@inject("UserStore", "ComponentStore")
@observer
class Home extends Component {
  interval = 0;
  


  constructor(props){
    super(props);

    var date = new Date();
        var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        let hour = date.getHours()
        let minute = date.getMinutes();
        let minutes = minute >= 10 ? minute.toString() : "0" + minute;

        var startTimes = [];
      for (var i = 0 ; i < Times[0].start.length; i++){
         startTimes.push({key: i, label: Times[0].start[i], labelFormatted: this.convertToCommonTime(Times[0].start[i])})
      }

      var endTimes = []
       for (var i = 0 ; i < Times[1].end.length; i++){
          endTimes.push({key: i, label: Times[1].end[i], labelFormatted: this.convertToCommonTime(Times[1].end[i])})
       }

        let filteredStarts = startTimes.filter((x) =>  parseInt(x.label) >= parseInt(hour+""+minutes) - 30)
        let filteredEnds = endTimes.filter((x) =>  parseInt(x.label) >= parseInt(hour+""+minutes) - 30)


    this.state = {
      notify: false,
      rippleFadeAnimation: new Animated.Value(1),
      rippleScaleAnimation: new Animated.Value(0.8),
      slideUpAnimation: new Animated.Value(-100),

      inputFocus: false,
      searchedAddress: false,
      mapScrolled: false,
      searchFilterOpen: false,
      searchInputValue: '',
      fetchingResults: true,
            
        daySearched: {
          index: 0,
          dayName: days[(date.getDay())%7],
          dayNameAbbr: days[(date.getDay())%7].slice(0,3),
          monthName: months[date.getMonth()],
          monthNameAbbr: months[date.getMonth()].slice(0,3),
          year: date.getFullYear(),
          dateName: (date.getDate()),
          dayValue: (date.getDay())%7,
          isEnabled: true,
      },
      timeSearched: [filteredStarts[0], filteredEnds[filteredEnds.length / 2]],
      dayTimeValid: false,

      selectedSpace: null,
      selectedSpaceHost: null,

      locationDifferenceWalking: {
          distance: null,
          duration: null,
      },
      locationDifferenceDriving: {
          distance: null,
          duration: null,
      },

      locationSnackbarVisible: false,
    }

    this.mapScrolling = true;
        this.results = [];

    this.region = {
      searched: {
          latitude: null,
          longitude: null,
          latitudeDelta: null,
          longitudeDelta: null,
      },
      current: {
          latitude: null,
          longitude: null,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
      }
    }



    this.currentLocation = {
        description: "Current Location",
        geometry: {
            location: {
                lat: null,
                lng: null,
            }
        }
    }
  }

  async componentDidMount(){
    // Geolocation.getCurrentPosition(info => console.log(`${Platform.OS} ${JSON.stringify(info)}`));
       // Set Status Bar page info here!
       this._navListener = this.props.navigation.addListener('didFocus', () => {
        
        this.setPermissions();
        this.mapLocationFunction();
        this.getCurrentLocation(true);
        
        if(this.state.searchFilterOpen){
            StatusBar.setBarStyle('light-content', true);
            Platform.OS === 'android' && StatusBar.setBackgroundColor(Colors.tango900);
        }else{
            StatusBar.setBarStyle('dark-content', true);
            Platform.OS === 'android' && StatusBar.setBackgroundColor('white');
        }
       
      });

      this._navListener = this.props.navigation.addListener('didBlur', () => {
        this.setPermissions();
        clearInterval(this._interval)
      })


  
      this.getCurrentLocation(true);

     
    
    
      if(!this.props.ComponentStore.notificationsSetUp){
        await this.notificationListener().then(() => this.props.ComponentStore.notificationsSetUp = true);
      }
      await getToken().then(tok => {
          if(!this.props.UserStore.pushTokens.includes(tok)){
            try{
                firestore().collection("users").doc(this.props.UserStore.userID).update({
                    pushTokens: firestore.FieldValue.arrayUnion(tok)
                })
                this.props.UserStore.pushTokens.push(tok);
            }catch(e){
                alert(e)
            }
          }
          return tok
      })
 

      this.rippleAnimation();
   

  }

  setPermissions = () => {
    checkPermissionsStatus().then(res => {
      this.props.UserStore.permissions = res;
    })
  }


  

 notificationListener = async() => {
    messaging().onMessage((payload) => {
        const {title, body} = payload.notification;
        const { data, messageId } = payload;
        // const imageUrl = Platform.OS === 'ios' ? data.fcm_options.image : payload.notification.android.imageUrl;
        
        // console.log(imageUrl)
               
        pushNotification(title, body, data.screen ? () => this.props.navigation.navigate(data.screen) : null)
    })
    
}


 

  setLocationState = (isFirstTime, lat, lng) => {
    try{
        if(isFirstTime){
            
            this.region = {
                ...this.region,
                current: {
                    ...this.region.current,
                    latitude: lat,
                    longitude: lng
                }
            }

            this.currentLocation = {
                ...this.currentLocation,
                geometry: {
                    location: {
                        lat: lat,
                        lng: lng,
                    }
                }
            }

        }else{
            this.currentLocation = {
                ...this.currentLocation,
                    geometry: {
                        location: {
                            lat: lat,
                            lng: lng,
                        }
                    }
            }

        }
        this.forceUpdate();

      } catch (error) {
        Alert.alert(error)
      }
  }

  mapLocationFunction = () => {
     
    this._interval = setInterval(() => {
        if(this.mapScrolling === false){
          this.getCurrentLocation(false)
        }
      }, 5000)
      
}

  getCurrentLocation = async(isFirstTime) => {
    // console.log("Getting location")
    try{
      const permission = await check(
        Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      )



     
      if(permission !== "granted"){
        await Geolocation.getCurrentPosition((position) => {
            this.setLocationState(isFirstTime, position.coords.latitude, position.coords.longitude)
          },
          error => {
            if(isFirstTime){
                Alert.alert(
                    "Location Services Disabled",
                    "Enable location permissions and restart Riive to discover parking nearby.",
                    [
                    {
                        text: "No thanks",
                        onPress: () => { this.setState({locationSnackbarVisible: true})},
                        style: "cancel"
                    },
                    { text: "Enable location services", onPress: () => Linking.openSettings()}
                    ],
                    { cancelable: false }
                );
            }
                
            }
        );
      }else{
       
        await Geolocation.getCurrentPosition((position) => {
            this.setLocationState(isFirstTime, position.coords.latitude, position.coords.longitude)
        },  error => alert(`There was an issue getting your location. ${error.message}`),
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 3600000
        })
        this.setState({locationSnackbarVisible: false})
      }

     
      
        
    
    }catch(e){
          Alert.alert(
          "Location Unavailable",
          "Enable location permissions and restart Riive to discover parking nearby.",
          [
            {
              text: "No thanks",
              onPress: () => {},
              style: "cancel"
            },
            { text: "Enable location services", onPress: () => Linking.openSettings()}
          ],
          { cancelable: false }
        );
    }
  }





 

  convertToCommonTime = (t) => {
    let hoursString = t.substring(0,2)
    let minutesString = t.substring(2)


    
    let hours = parseInt(hoursString) == 0 ? "12" : parseInt(hoursString) > 12 ? (parseInt(hoursString) - 12).toString() : parseInt(hoursString);
    // let minutes = parseInt(minutesString)
    return(`${hours}:${minutesString} ${parseInt(hoursString) >= 12 ? 'PM' : 'AM'}`)
  }

  searchFilterTimeCallback = (timeData) => {
    this.setState({timeSearched: timeData, dayTimeValid: true});
    this.slideBottomPill()
}

  searchFilterDayCallback = (dayData) => {
    this.setState({daySearched: dayData, dayTimeValid: true});
    this.slideBottomPill()
 }

 slideBottomPill = () => {
  const { dayTimeValid, fetchingResults } = this.state
  var shouldShow;
  if(!fetchingResults && this.results.length > 0 && dayTimeValid){
      shouldShow = false;
  }else{
      shouldShow = true
  }
  if(shouldShow){
      Animated.timing(this.state.slideUpAnimation, {
          toValue: 16,
          duration: 250,
          easing: Easing.elastic(1),
          useNativeDriver: false,
        }).start();
  }else{
      Animated.timing(this.state.slideUpAnimation, {
          toValue: -100,
          duration: 250,
          easing: Easing.elastic(1),
          useNativeDriver: false,
        }).start();
  }
  
}

checkDayTimeValid = async() => {
  var date = new Date();
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  let today = date.getDate();
  let weekday = days[date.getDay()]
  let month = months[date.getMonth()]
  let year = date.getFullYear();

  let hour = date.getHours()
  let minute = date.getMinutes();
  let minutes = minute >= 10 ? minute.toString() : "0" + minute;

  var startTimes = [];
  for (var i = 0 ; i < Times[0].start.length; i++){
      startTimes.push({key: i, label: Times[0].start[i], labelFormatted: this.convertToCommonTime(Times[0].start[i])})
  }

  var endTimes = []
  for (var i = 0 ; i < Times[1].end.length; i++){
      endTimes.push({key: i, label: Times[1].end[i], labelFormatted: this.convertToCommonTime(Times[1].end[i])})
  }

  let filteredStarts = startTimes.filter((x) =>  parseInt(x.label) >= parseInt(hour+""+minutes) - 30)
  let filteredEnds = endTimes.filter((x) =>  parseInt(x.label) >= parseInt(hour+""+minutes) - 30)



  // console.log(filteredStarts[0].key)
  // console.log(this.state.daySearched)


  var isToday = year === this.state.daySearched.year && months.indexOf(month) === months.indexOf(this.state.daySearched.monthName) && today === this.state.daySearched.dateName

  var isFuture = year < this.state.daySearched.year || (year === this.state.daySearched.year && months.indexOf(month) < months.indexOf(this.state.daySearched.monthName)) || (year === this.state.daySearched.year && months.indexOf(month) === months.indexOf(this.state.daySearched.monthName) && today < this.state.daySearched.dateName);


  if(isToday){
      if(filteredStarts[0].key <= this.state.timeSearched[0].key){
          await this.setState({dayTimeValid: true})
      }else{
          await this.setState({dayTimeValid: false})      
      }
      this.slideBottomPill()
  }else if(isFuture){
      await this.setState({dayTimeValid: true})
      this.slideBottomPill()
  }else{
      await this.setState({dayTimeValid: false})
      this.slideBottomPill()
  }
}

getDistance = async(start, end, type) => {
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  let stringName = `locationDifference${type}`
  let stateName = stringName.slice(0,18) + stringName.charAt(18).toUpperCase() + stringName.slice(19)

  // Define arrival time by the state of the search start
  let d = new Date();
  d.setDate(this.state.daySearched.dateName)
  d.setMonth(months.indexOf(this.state.daySearched.monthName))
  d.setHours(parseInt(this.state.timeSearched[0].label.slice(0,2)))
  d.setMinutes(parseInt(this.state.timeSearched[0].label.slice(2)))

  let arrival = d.getTime();

  

      await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${start}&destinations=${end}&departure_time=now&mode=${type}&arrival_time=${arrival}&traffic_model=optimistic&key=AIzaSyBa1s5i_DzraNU6Gw_iO-wwvG2jJGdnq8c`).then(x =>{
          this.setState({[stateName]: {
              distance: x.data.rows[0].elements[0].distance.text,
              duration: x.data.rows[0].elements[0].duration.text,
          }})
          return x
      }).catch(e => {
          console.log(e)
      })
  
}

getResults = async (lat, lng, radius, prevLat, prevLng) => {
  let results = [];
  await this.setState({fetchingResults: true})
  await this.slideBottomPill();


  
   // Create a Firestore reference
   const db = firestore();

   // Create a GeoFirestore reference
   const GeoFirestore = geofirestore.initializeApp(db);

   // Create a GeoCollection reference
   const geocollection = GeoFirestore.collection('listings');

     let query = geocollection.near({ 
         center: new firestore.GeoPoint(lat, lng), 
         radius: radius,
         limit: 100,
      }).where("hidden", "==", false)

      query = query.where("toBeDeleted", "==", false)
      // query = query.where()

      // console.log(`Lat is ${lat} and prev lat is ${prevLat}`)

  //    if(lat.toFixed(3) != prevLat.toFixed(3) || lng.toFixed(3) != prevLng.toFixed(3)){

     await query.get().then( async(value) => {
       // All GeoDocument returned by GeoQuery, like the GeoDocument added above
      //  console.log(value.docs);
     

      for (const doc of value.docs) {
          const hostRef = db.collection('users').doc(doc.data().hostID);
          const spaceVisits = db.collection("trips").where("listingID", "==", doc.data().listingID)
          const spaceVisitsFuture = spaceVisits.where("visit.time.end.unix", ">", new Date().getTime())
          let futureVisits = new Array;
         
          
          await spaceVisitsFuture.get().then((spaceData) => {
             spaceData.docs.map(x => {
                  futureVisits.push(x.data())
              })
              
          })
   

          await hostRef.get().then((hostDoc) => {
              
              return hostDoc.data();
          }).then((hostDoc) => {
              results.push({
                  space: doc.data(),
                  host: hostDoc,
                  visits: futureVisits,
              })
             
              // console.log(`space id: ${doc.data().hostID} and host: ${hostDoc.id}`)
          })
          // console.log(doc.data())
         
          
        }
     });
  let resultsFiltered = results.filter(res => !res.host.deleted.toBeDeleted && !res.host.deleted.isDeleted && !this.props.UserStore.deleted && !res.host.disabled.isDisabled)
 
  let resultsFilteredTimeAvail = new Array;

     
     
     

  resultsFiltered.forEach((x, i) => {
      // Gets current day data
      let avail = resultsFiltered[i].space.availability[this.state.daySearched.dayValue].data
      // Creates new array to assume 
      let worksArray = new Array;
      for(let data of avail){
          // If specific time slot is marked unavailable, we will check it
          if(!data.available){
              // Check if start time is out of bounds
              if(parseInt(data.start) >= parseInt(this.state.timeSearched[0].label) && parseInt(data.start) <= parseInt(this.state.timeSearched[1].label)){
                  // console.log(`Start value ${data.start} is invalid within the bounds of ${this.state.timeSearched[0].label} and ${this.state.timeSearched[1].label}`)
                  worksArray.push(false)
              }
              // Check if end time is out of bounds
              else if(parseInt(data.end) >= parseInt(this.state.timeSearched[0].label) && parseInt(data.start) <= parseInt(this.state.timeSearched[1].label)){
                  worksArray.push(false)
                  // console.log(`End value ${data.end} is invalid within the bounds of ${this.state.timeSearched[0].label} and ${this.state.timeSearched[1].label}`)
              // If both start and end time don't interfere with filtered time slots
              }else{
                  worksArray.push(true)
                  // console.log(`Time slot ${data.id} is marked unavailable but works since ${data.start} and ${data.end} are not within the bounds of ${this.state.timeSearched[0].label} and ${this.state.timeSearched[1].label}`)
              }
             
              // console.log("Time slot " + data.id + " does not work")
          }else{
              let upcomingVisits = resultsFiltered[i].visits
              // Check each upcoming visit for a space
              for(data of upcomingVisits){
                  // Check if visit is not cancelled
                  if(!data.isCancelled){
                      // Check if day of search matches visit day
                      if(this.state.daySearched.dayValue === data.visit.day.dayValue){
                          // if a visit start is after start time and before end time
                          if(parseInt(data.visit.time.start.label) >= parseInt(this.state.timeSearched[0].label) && parseInt(data.visit.time.start.label) <= parseInt(this.state.timeSearched[1].label)){
                              worksArray.push(false)
                              break;
                          
                          // if a visit end is before a start time and after end time
                          }else if(parseInt(data.visit.time.end.label) >= parseInt(this.state.timeSearched[0].label) && parseInt(data.visit.time.end.label) <= parseInt(this.state.timeSearched[1].label)){
                              worksArray.push(false)
                              break;
                          }else{
                              worksArray.push(true)
                              continue;
                          }
                      // If visit day doesn't match searched day
                      }else{
                          worksArray.push(true)
                          continue;
                      }
                  }else{
                      continue;
                  }
                 
              }
              
              // console.log("Time slot " + data.id + " is marked available")
          }
      }

      if(!worksArray.includes(false)){
          resultsFilteredTimeAvail.push(x)
      }
  })

  this.results = resultsFilteredTimeAvail;
  await this.setState({fetchingResults: false})
  await this.slideBottomPill();

// }


this.forceUpdate();
}


filterResults = async() => {
  if(this.state.searchFilterOpen){
      await this.getResults(this.region.current.latitude, this.region.current.longitude, this.region.current.longitudeDelta * 69, 99999.9999, 99999.9999)
  }
  
  await this.setState({searchFilterOpen: !this.state.searchFilterOpen})
   
}

clickSpace = async(data) => {
  await this.checkDayTimeValid()
  if(this.state.dayTimeValid){
      await this.props.ComponentStore.selectedExternalSpot.clear()
      this.setState({selectedSpace: data.space, selectedSpaceHost: data.host})
      this.props.ComponentStore.selectedExternalSpot.push(data.space)

  
      if(this.state.searchInputValue.split("").length > 0){
          await this.getDistance(`${data.space.region.latitude}, ${data.space.region.longitude}`, `${this.region.searched.latitude}, ${this.region.searched.longitude}`, "walking")
      }

  
      await actionSheetRef.current?.setModalVisible(true)
  }



  
}


onSelectAddress = async(det) => {
  const db = firestore();
  const date = new Date();
  let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let dateString = date.toLocaleString('en-US', {timezone: timeZone});
  let ref = db.collection("users").doc(this.props.UserStore.userID).collection("searchHistory").doc();

  

  this.region = {
      current: {
          ...this.region.current,
          latitude: det.geometry.location.lat,
          longitude: det.geometry.location.lng
      },
      searched: {
          ...this.region.current,
          latitude: det.geometry.location.lat,
          longitude: det.geometry.location.lng
      }
  }
  this.setState(prevState => ({
      mapScrolled: false,
      searchedAddress: true,
      searchInputValue: det.description == "Current Location" ? "Current Location" : det.name,

  }));
  
  if(det.description != "Current Location"){
      var number = det.address_components.filter(x => x.types.includes('street_number'))[0] || null;
      var street = det.address_components.filter(x => x.types.includes('route'))[0] || null;
      var city = det.address_components.filter(x => x.types.includes('locality'))[0] || null;
      var county = det.address_components.filter(x => x.types.includes('administrative_area_level_2'))[0] || null;
      var state = det.address_components.filter(x => x.types.includes('administrative_area_level_1'))[0] || null;
      var country = det.address_components.filter(x => x.types.includes('country'))[0] || null;
      var zip = det.address_components.filter(x => x.types.includes('postal_code'))[0] || null;

    

      var searchHistoryData = {
          locationID: det.place_id,
          searchID: ref.id,
          region:{
              latitude: det.geometry.location.lat,
              longitude: det.geometry.location.lng
          },
          addressData:{
              formattedName: det.name || null,
              full: det.formatted_address || null,
              number: number ? number.long_name : null,
              street: street ? street.long_name : null,
              city: city ? city.long_name : null,
              county: county ? county.long_name : null,
              state: state ? state.long_name : null,
              state_abbr: state ? state.short_name : null,
              country: country ? country.long_name : null,
              zip: zip ? zip.long_name : null,
              vicinity: det.vicinity || null,
          },
          dateTime: {
              unix: date.getTime(),
              date: date,
              dateString: dateString,
          } 
      }

  }else{
      var searchHistoryData = {
          locationID: null,
          searchID: ref.id,
          region:{
              latitude: det.geometry.location.lat,
              longitude: det.geometry.location.lng
          },
          addressData:{
              formattedName: "Current Location",
          },
          dateTime: {
              unix: date.getTime(),
              date: date,
              dateString: dateString,
          } 
      }
      
  }

  this.props.UserStore.searchHistory.push(searchHistoryData);
  await db.collection("users").doc(this.props.UserStore.userID).collection("searchHistory").doc(ref.id).set(searchHistoryData)

  await this.getResults(this.region.current.latitude, this.region.current.longitude, this.region.current.longitudeDelta * 69, 99999.9999, 99999.9999)
}

onRegionChange = (region) => {

  
           
  let prevLat = this.region.current.latitude;
  let prevLng = this.region.current.longitude;
  let prevLatD = this.region.current.latitudeDelta;
  let prevLngD = this.region.current.longitudeDelta;



  // console.log(`prevLat: ${prevLat.toFixed(2)}. CurrentLat: ${region.latitude.toFixed(2)}`)
  // console.log(`prevLng: ${prevLng.toFixed(2)}. CurrentLng: ${region.longitude.toFixed(2)}`)
 

  if(this.mapScrolling){                

      this.region = {
          ...this.region,
          current: {
              latitudeDelta: region.latitudeDelta,
              longitudeDelta: region.longitudeDelta,
              latitude: region.latitude,
              longitude: region.longitude
          }
      }
      
      this.setState(prevState => ({
          mapScrolled: true,
      }))

      this.getResults(this.region.current.latitude, this.region.current.longitude, this.region.current.longitudeDelta * 69, prevLat, prevLng)

      
  }
  
  this.mapScrolling = false;

  
}

clearAddress = () => {
  this.GooglePlacesRef.setAddressText("")
   

  this.setState(prevState => ({
      searchedAddress: false,
      // region: {
      //     ...prevState.region,
      //     searched: {
      //         ...prevState.region.current
      //     },
      // },
      searchInputValue: '',
      locationDifferenceWalking: {
          distance: null,
          duration: null,
      },
      locationDifferenceDriving: {
          distance: null,
          duration: null,
      }
  }))
}

goToHostProfile = () => {
  this.props.ComponentStore.selectedUser.push(this.state.selectedSpaceHost);
  actionSheetRef.current?.setModalVisible(false);
  this.props.navigation.navigate("ExternalProfile", {
    homeState: {...this.state},
  })
}

goToSpaceProfile = () => {
  actionSheetRef.current?.setModalVisible(false);
  this.props.navigation.navigate("ExternalSpace", {
      homeState: {...this.state},
  })
  
}

goToReserveSpace = () => {
  actionSheetRef.current?.setModalVisible(false);
  this.props.navigation.navigate("ReserveSpace", {
      homeState: {...this.state},
  })
}



  rippleAnimation = () => {
    Animated.loop(
            Animated.parallel([
                Animated.timing(
                    this.state.rippleFadeAnimation,
                    {
                        toValue: 0,
                        duration: 1300,
                        useNativeDriver: false,
                    }),
                Animated.timing(
                    this.state.rippleScaleAnimation,
                        {
                            toValue: 10,
                            duration: 2000,
                            useNativeDriver: false,
                        }),
            ]),
    ).start()
}

  componentWillUnmount() {
    // Unmount status bar info
    this._navListener.remove();
    clearInterval(this._interval)
  }

  render() {
  
    const {width, height} = Dimensions.get('window')
    const {firstname, email, permissions} = this.props.UserStore
    if(permissions.locationServices && this.region.current.latitude && this.region.current.longitude){
      return (
        <SafeAreaView style={{flex: 1, position: 'relative', backgroundColor: this.state.searchFilterOpen ? Colors.tango500 : 'white'}}>

          {/* Search Filter component */}
          <View style={{opacity: this.state.searchFilterOpen ? 1 : 0,  marginTop: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight, zIndex: 999, position: 'absolute'}}>
              <SearchFilter visible={this.state.searchFilterOpen} currentSearch={this.state.searchInputValue} timeCallback={(data) => this.searchFilterTimeCallback(data)} dayCallback={(data) => this.searchFilterDayCallback(data)}/>
              {this.state.searchFilterOpen ? 
              <TouchableOpacity onPress={() => this.filterResults()} style={{width: width, height: height, backgroundColor: 'black', opacity: 0.3}} disabled={this.state.timeSearched[0].key > this.state.timeSearched[1].key ? true : false}/>
              : null}
          </View>

          <View style={{paddingHorizontal: 16, paddingBottom: this.state.searchFilterOpen ? 0 : 36, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: "space-between"}}>
            {/* <Text type="Medium" numberOfLines={1} style={{flex: this.state.searchFilterOpen ? 0 : 4,fontSize: 24, paddingTop: 8}}>{this.state.searchFilterOpen ? "" : `Hello, ${firstname || 'traveler'}`}</Text> */}
            <Image 
                localImage={true} 
                source={require('../assets/img/Logo_Abbreviated_001.png')} 
                width={48}
                aspectRatio={1/1}
                style={styles.img} />
            <FilterButton 
              onPress={() => this.filterResults()}
              disabled={this.state.timeSearched[0].key > this.state.timeSearched[1].key ? true : false}
              searchFilterOpen={this.state.searchFilterOpen}
              daySearched={this.state.daySearched}
              timeSearched={this.state.timeSearched}
            />
          </View>
          
          <View style={{flex: 1}}>
          <MapView
              provider={MapView.PROVIDER_GOOGLE}
              mapStyle={DayMap}
              style={styles.mapStyle}
              onRegionChangeComplete={region =>  this.onRegionChange(region)}
              onRegionChange={() => this.mapScrolling = true}
              initialRegion={{
                latitude: this.currentLocation.geometry.location.lat,
                longitude: this.currentLocation.geometry.location.lng,
                latitudeDelta: this.region.current.latitudeDelta || 0.025,
                longitudeDelta: this.region.current.longitudeDelta || 0.025
              }}
              region={{
                  latitude: 0,
                  longitude: 0,
                  latitudeDelta: 0.025,
                  longitudeDelta: 0.025
              }}
              region={Platform.OS == 'ios' ? {
                  latitude: this.region.searched.latitude && !this.state.mapScrolled ? this.region.searched.latitude : this.region.current.latitude,

                  longitude: this.region.searched.longitude && !this.state.mapScrolled ? this.region.searched.longitude : this.region.current.longitude,

                  latitudeDelta: this.region.searched.latitudeDelta  && !this.state.mapScrolled ? this.region.searched.latitudeDelta : this.region.current.latitudeDelta ,

                  longitudeDelta: this.region.searched.longitudeDelta  && !this.state.mapScrolled ? this.region.searched.longitudeDelta : this.region.current.longitudeDelta
                } : 
                  this.region.searched.latitude && this.region.searched.longitude && !this.state.mapScrolled ? 
                    {
                      latitude: this.region.searched.latitude || this.region.current.latitude,

                      longitude: this.region.searched.longitude || this.region.current.longitude,
    
                      latitudeDelta: this.region.searched.latitudeDelta || this.region.current.latitudeDelta ,

                      longitudeDelta: this.region.searched.longitudeDelta || this.region.current.longitudeDelta
                    }
                  :
                    null}
              pitchEnabled={false} 
              rotateEnabled={false} 
              zoomEnabled={true} 
              scrollEnabled={true}
              minZoomLevel={6}
              toolbarEnabled={false}
              moveOnMarkerPress={false}
          >
              {this.currentLocation.geometry.location.lat && this.currentLocation.geometry.location.lng ? 
                  <Marker 
                    anchor={{x: 0.5, y: 0.5}} // For Android          
                    coordinate={{
                      latitude: this.currentLocation.geometry.location.lat,
                      longitude: this.currentLocation.geometry.location.lng
                    }} 
                      style={{position: 'relative', width: 150, height: 150, alignItems: 'center', justifyContent: 'center'}}
                  >
                    {Platform.OS == "android" ?
                        <View style={[styles.circleMarker, {}]}>
                            <Animated.View style={[styles.circleMarker, { top: 0, left: 0, opacity: this.state.rippleFadeAnimation, transform:[{scale: this.state.rippleScaleAnimation},]}]}></Animated.View>
                          </View>
                      :
                          <View style={{width: 150, height: 150}}>
                            <View style={[styles.circleMarker,{ left: 63, top: 63}]}>
                                <Animated.View style={[styles.circleMarker, { top: 0, left: 0, opacity: this.state.rippleFadeAnimation, transform:[{scale: this.state.rippleScaleAnimation}]}]}></Animated.View>
                              </View>
                          </View>
                    }
                  </Marker>
                : null}

                {this.state.searchedAddress ?
                    <Marker 
                      coordinate={{
                        latitude: this.region.searched.latitude,
                        longitude: this.region.searched.longitude
                      }}   
                    />
                 : null }
                
                {this.results.map(x => {
                    return( <ListingMarker 
                                key={x.space.listingID}
                                listing={x.space}
                                onPress={() => this.clickSpace(x)}
                            />)
                })}
            </MapView>
            <View style={{zIndex: 9, position: 'absolute', top: -16}}>
             <GooglePlacesAutocomplete
               placeholder='Search by destination...'
               returnKeyType={'done'}  
                            
               autofocus={false}
              ref={(instance) => { this.GooglePlacesRef = instance }}
               currentLocation={false}
               minLength={2}
               listViewDisplayed={false}
               fetchDetails={true}
               onPress={(data, details = null) => {this.onSelectAddress(details)}}
               textInputProps={{
                   onFocus: () => {
                       this.setState({
                           inputFocus: true,
                       })
                       clearInterval(this._interval)
                   },
                   onBlur: () => {
                       this.setState({
                           inputFocus: false
                       })
                                    this.mapLocationFunction();
                   },
                   clearButtonMode: 'never'
               }}
               renderRightButton={() => 
                   <Icon 
                       iconName="x"
                       iconColor={Colors.cosmos500}
                       iconSize={24}
                       onPress={() => this.clearAddress()}
                       style={{ position: "relative", 
                       borderRadius: width/2,
                       padding: 10, display: this.state.searchedAddress ? "flex" : "none"}}
                   />
               }
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
              predefinedPlaces={[this.currentLocation]}

              styles={{
                  container:{
                      display: this.state.searchFilterOpen ? 'none' : 'flex',
                      justifySelf: 'content',
                      width: width,
                      alignItems: "center",
                  },
                  textInputContainer:{
                      width: width - 24,
                      backgroundColor: "white",
                      height: 48,
                      borderTopWidth: 0,
                      borderBottomWidth: 0,
                      borderRadius: width/2, 
                      // Shadow
                      shadowColor: '#000', 
                      shadowOpacity: 0.2, 
                      shadowOffset:{width: 1, height: 1}, 
                      shadowRadius: 4, 
                      elevation: 12,
                  },
                  textInput:{
                      marginTop: 0, 
                      height: 40,
                      alignSelf: 'center',
                      paddingRight: 0,
                  },
                  listView:{
                      paddingVertical: 6,
                      borderRadius: 9,
                      // position: 'absolute',
                      top: 8,
                      width: width - 24,
                      zIndex: 9,
                      backgroundColor: 'white',
                      // Shadow
                      shadowColor: '#000', 
                      shadowOpacity: 0.2, 
                      shadowOffset:{width: 1, height: 1}, 
                      shadowRadius: 4, 
                      elevation: 12,
                  },
                  predefinedPlacesDescription:{
                      color: Colors.fortune700,
                  },
                  separator:{
                      marginVertical: 2,
                  },
                  //   row:{
                  //       marginTop: 32, 
                  //   }
                }}                      
              />
            </View>
          </View>

          <ActionSheet 
                    ref = {actionSheetRef}
                    bounceOnOpen={true}
                    bounciness={4}
                    gestureEnabled={true}
                    containerStyle={{paddingTop: 8}}
                    extraScroll={40}
                    delayActionSheetDrawTime={0}
                    initialOffsetFromBottom = {1}
                 
                   >
                        <View>
                            {this.state.selectedSpace && this.state.selectedSpaceHost ?
                            
                            <View style={{paddingTop: 8}}>
                                
                                <Image 
                                    aspectRatio={21/9}
                                    source={{uri: this.state.selectedSpace.photo}}
                                    // backupSource={require('../assets/img/Logo_001.png')}
                                    resizeMode={'cover'}
                                /> 
                                <View style={styles.actionSheetContent}>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8}}>
                                        <Text type="Medium" style={{flex: 8, fontSize: 24, flexWrap: 'wrap', paddingRight: 16}} numberOfLines={2}>{this.state.selectedSpace.spaceName}</Text>
                                        <ProfilePic 
                                            source={{ uri: this.state.selectedSpaceHost.photo }}
                                            imgWidth = {32}
                                            imgHeight = {32}
                                            initals={this.state.selectedSpaceHost.firstname.charAt(0).toUpperCase() + "" + this.state.selectedSpaceHost.lastname.charAt(0).toUpperCase()}
                                            style={{backgroundColor:"#FFFFFF", flex: 1}}
                                            fontSize={12}
                                            fontColor="#1D2951"
                                            onPress={() => this.goToHostProfile()}
                                            alt="Your profile picture"
                                        />
                                    </View>
                                    <Text style={{fontSize: 16}}>{this.state.selectedSpace.spacePrice}/hr</Text>
                                    <Text style={{marginBottom: 16}}>No ratings yet</Text>
                                    {/* {this.state.selectedSpace.spaceBio ?
                                        <Text style={{marginBottom: 16}}>{this.state.selectedSpace.spaceBio}</Text>
                                    : null} */}
                                    {this.state.searchInputValue != '' && this.state.locationDifferenceWalking.duration != null ? 
                                        <View style={{flexDirection: 'row', alignItems: 'center', marginRight: 48}}>
                                             <Icon 
                                                iconName="walk"
                                                iconColor={Colors.cosmos500}
                                                iconSize={24}
                                                iconLib="MaterialCommunityIcons"
                                                style={{paddingRight: 8}}
                                            />
                                            
                                            { this.state.locationDifferenceWalking.duration.split(" ")[1] === 'mins' || this.state.locationDifferenceWalking.duration.split(" ")[1] === 'min' ?
                                                <Text numberOfLines={1}>{this.state.locationDifferenceWalking.duration} to {this.state.searchInputValue}</Text> 
                                                :
                                                <Text numberOfLines={1}>Longer than 1 hour to {this.state.searchInputValue}</Text> 
                                            }
                                        </View>
                                    : null}
                                    <Button style={{backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: Colors.tango900}} textStyle={{color: Colors.tango900}} onPress={() => this.goToSpaceProfile()}>More Details</Button>
                                    <Button onPress={() => this.goToReserveSpace()} style = {{backgroundColor: Colors.tango700, height: 48}} textStyle={{color: 'white'}}>Reserve Space</Button>
                                </View>
                            </View>
                            : 
                            <View>
                                <SvgAnimatedLinearGradient width={Dimensions.get('window').width} style={{marginTop: 8}}>
                                    <Rect width={width} height={width * 2.3333} rx="0" ry="0" />
                                </SvgAnimatedLinearGradient>
                                <View style={styles.actionSheetContent}>
                                    <SvgAnimatedLinearGradient  width={width - 32} height="225" style={{marginTop: 8}}>
                                        {/* <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}> */}
                                            <Rect x="0" y="0" width={width *.7} height={32} />
                                            <Circle x={width - 64} y="0" cx="16" cy="16" r="16"/>
                                            <Rect x="0" y="40" width="80" height="16" />
                                            <Rect x="0" y="64" width="64" height="16" />
                                            <Rect x="0" y="96" width={width} height="16" />
                                            <Rect x="0" y="120" width={width} height="16" />
                                            <Rect x="0" y="144" width={width * .4} height="16" />
                                            <Rect x="0" y="176" width={width} height="40" />
                                        {/* </View> */}
                                    </SvgAnimatedLinearGradient>
                                </View>
                            </View>
                            }
                        </View>
                    </ActionSheet>
                    

                    <Animated.View style={[styles.searchToastPill, {bottom: this.state.slideUpAnimation}]}>
                        {/* <ActivityIndicator /> */}
                        {this.state.fetchingResults ? 
                            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                                <ActivityIndicator color="white"/>
                                <Text style={{color: "white", paddingLeft: 8}}>Finding Spaces</Text>
                            </View>  
                        : !this.state.dayTimeValid ? 
                            <Text style={{color: "white"}}>Update Search Time</Text>
                        : this.results.length === 0 ? 
                            <Text style={{color: "white"}}>No Results</Text>
                        : null}
                    </Animated.View>
          

          {/* <Button onPress={async() => {
              await this.setState({notify: true})
              this.setState({notify: false})
            }}>Hello</Button> */}


        </SafeAreaView>
      )
    }else{
      return(
          <SafeAreaView style={{flex: 1}}>
              
              <SvgAnimatedLinearGradient width={width} height={height}>
                      <Rect x="16" width={width / 2} height={40} rx="0" ry="0" />
                      <Rect x={width / 2 + 24}  width={width / 2 - 40} height="40" rx="0" ry="0" />
                      <Rect x="16" y="64" width={width -32} height="48" rx="24" ry="24"/>
                      <Rect x="0" y="48" width={width} height={height} />
              </SvgAnimatedLinearGradient>
              <Snackbar
                    visible={this.state.locationSnackbarVisible}
                    onDismiss={() => this.setState({ verificationSnackbarVisible: false })}
                    theme={{ colors: { accent: "#1eeb7a" }}}
                    action={{
                        label: "Turn On",
                        
                        onPress: () => this.props.navigation.navigate("Settings"),
                    }}
                >
                    You must turn on location services to view parking nearby.
                </Snackbar>
           </SafeAreaView>
      )
    }
  
    }
}

export default Home

const styles = StyleSheet.create({
  mapStyle:{
      zIndex: -999,
      position: "relative",
      flex: 1,
  },
  img:{
    resizeMode: 'contain',
    alignSelf: 'center'
  },
  circleMarker:{
      position: 'absolute',
      // top: (50+25)/2 + 4,
      // left: (50+25)/2 + 4,
      overflow: 'visible',
      height: 20,
      width: 20,
      backgroundColor: Colors.apollo300, 
      borderRadius: Dimensions.get('window').width/2, 
  },
  searchToastPill: {
      height: 40, 
      backgroundColor: Colors.apollo900, 
      position: 'absolute', 
      alignSelf: 'center', 
      alignItems: 'center', 
      flexDirection: 'row',
      justifyContent: 'center', 
      borderRadius: 24, 
      paddingHorizontal: 16,
      shadowColor: Colors.cosmos900,
      shadowOffset: {
          width: 0,
          height: 20,
      },
      shadowOpacity: .5,
      shadowRadius: 20,
      elevation: 12,
  },
  actionSheetContent:{
      paddingHorizontal: 16, 
  }
})