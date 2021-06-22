import React, { Component } from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, SafeAreaView, Dimensions, Animated, TouchableWithoutFeedback, KeyboardAvoidingView, FlatList, Switch, Modal, Picker, Alert, Linking} from 'react-native';
import Text from '../components/Txt'

import MapView, {Marker} from 'react-native-maps';
import DayMap from '../constants/DayMap'
import NightMap from '../constants/NightMap'

//For Shimmer
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient'
import Svg, {Circle, Rect} from 'react-native-svg'


import Icon from '../components/Icon'
import Button from '../components/Button'
import Colors from '../constants/Colors'
import Image from '../components/Image'
import RadioList from '../components/RadioList'
import RadioButton from '../components/RadioButton'
import DayAvailabilityPicker from '../components/DayAvailabilityPicker'

import * as firebase from 'firebase/app';
import firestore from '@react-native-firebase/firestore';


//MobX Imports
import {inject, observer} from 'mobx-react/native'





@inject("UserStore", "ComponentStore")
@observer
class externalSpace extends React.Component {
    
    _isMounted = false;
    isInPast = null;
    isCurrentlyActive = null;
    sameTimezone = false;

    static navigationOptions = ({navigation}) => {
        const { params = {} } = navigation.state;
        
        return{
          headerTitle: "Edit Trip Details",
          headerTitleStyle:{
              fontWeight: "300",
              fontSize: 18,
          },
        }
    };

    constructor(props){
        super(props)

        this.state = {
            visit: this.props.navigation.state.params.visit,
            listing: this.props.navigation.state.params.listing,
            currentActivePhoto: 0,
            selectedVehicle:  this.props.navigation.state.params.visit.vehicle,
            lastUpdate: null,

            changesMade: false,
        }


    }

    async componentDidMount(){
        const timeDiffEnd = this.state.visit.visit.time.end.unix - new Date().getTime()
        const timeDiffStart = this.state.visit.visit.time.start.unix - new Date().getTime()
        this.isInPast = timeDiffEnd != Math.abs(timeDiffEnd);
        this.isCurrentlyActive = timeDiffStart != Math.abs(timeDiffStart) && !this.isInPast;
        // Check if space is in same timezone as current device
        if(this.state.listing.timezone.offsetValue + new Date().getTimezoneOffset()/60 === 0){
            this.sameTimezone = true;
        }

        this._isMounted = true;

       

       this._navListener = this.props.navigation.addListener('didFocus', () => {
        StatusBar.setBarStyle('dark-content', true);
        Platform.OS === 'android' && StatusBar.setBackgroundColor('white');
      });

    //   let {spaceName} = this.state.listing

    

      this.updateTripTime();

    

      this.props.navigation.setParams({
        title: this.state.listing.spaceName || "Loading...",
      });

    }

    updateTripTime = () => {
        let lastUpdate = new Date(parseInt(this.state.visit.updated.seconds + "000"))
        let lastUpdateString = lastUpdate.toLocaleString('en-US', {timezone: Intl.DateTimeFormat().resolvedOptions().timeZone});

        this.setState({lastUpdate: lastUpdateString})
    }

    componentDidUpdate(prevProps, prevState){

        if(prevState.selectedVehicle.VehicleID !== this.state.selectedVehicle.VehicleID && this.state.selectedVehicle.VehicleID !== this.props.navigation.state.params.visit.vehicle.VehicleID){
            // If new vehicle is selected and not original vehicle on initial load
            this.setState({changesMade: true})
        }else if(prevState.selectedVehicle.VehicleID !== this.state.selectedVehicle.VehicleID){
            // If original vehicle selected
            this.setState({changesMade:false})
        }else{
            // DO NOTHING
        }
   
    }

    // getHost = () => {
    //     let {selectedExternalSpot} = this.props.ComponentStore;
    //     const db = firestore();

        
    //     // // if(doc.exists){

    //         if(selectedExternalSpot[0].listingID){
    //             db.collection("users").where(firestore.FieldPath.documentId(), "==", selectedExternalSpot[0].hostID).get().then((qs) => {
    //                 this.setState({host: qs.docs[0].data()})
    //             })
    //         }else{
    //             console.log("User not found")
    //         }         
    // }

    carouselUpdate = (xVal) => {
        const {width} = Dimensions.get('window')
    
        let newIndex = Math.round(xVal/width)
    
        // console.log(newIndex)
    
        this.setState({currentActivePhoto: newIndex})
    }


    


    // goToHostProfile = () => {
    //     this.props.ComponentStore.selectedUser[0] = this.state.host ;
    //     this.props.navigation.navigate("ExternalProfile", {
    //         homeState: {
    //             ...this.props.navigation.state.params.homeState,
    //         },
    //     })
    // }



    setActiveVehicle = (vehicle, idOnly) => {
        

        if(idOnly){
            let activeVehicle = this.props.UserStore.vehicles.filter(x => x.VehicleID === vehicle)[0]

            this.setState({selectedVehicle: {
                Year: activeVehicle.Year,
                Model: activeVehicle.Model,
                Make: activeVehicle.Make,
                VehicleID: activeVehicle.VehicleID,
                LicensePlate: activeVehicle.LicensePlate,
                Color: activeVehicle.Color,
            }})

            // this.setState({selectedVehicle: activeVehicle.VehicleID})
        }else{
            this.setState({selectedVehicle: {
                Year: vehicle.Year,
                Model: vehicle.Model,
                Make: vehicle.Make,
                VehicleID: vehicle.VehicleID,
                LicensePlate: vehicle.LicensePlate,
                Color: vehicle.Color,
            }})
            // // console.log(vehicle.VehicleID)
            // this.setState({selectedVehicle: vehicle.VehicleID})
        }
        
    }

    showCancellationModal = () => {

        Alert.alert(
            'Cancel Trip',
            'Cancelling a trip will',
            [
            { text: 'Cancel' },
            // If they said no initially and want to change their mind,
            // we can automatically open our app in their settings
            // so there's less friction in turning notifications on
            { text: 'Cancel Trip', onPress: () => this.cancelTrip() }
            ]
        )
    }

    cancelTrip = () => {
        const timeDiffEnd = this.state.visit.visit.time.end.unix - new Date().getTime()
        const timeDiffStart = this.state.visit.visit.time.start.unix - new Date().getTime()
        this.isInPast = timeDiffEnd != Math.abs(timeDiffEnd);
        this.isCurrentlyActive = timeDiffStart != Math.abs(timeDiffStart) && !this.isInPast;
        var currentTime = firestore.Timestamp.now();

        if(!this.isInPast){
            const db = firestore();
            db.collection('trips').doc(this.props.navigation.state.params.visit.tripID).get().then((trip) => {
                if(!trip.exists){
                    alert("Failed to save changes. Trip not found.")
                }else{
                    try{
                        db.collection('trips').doc(this.props.navigation.state.params.visit.tripID).update({
                            isCancelled: true,
                            cancelledBy: trip.data().hostID === this.props.UserStore.userID ? "host" : "guest",
                            updated: currentTime
                        }).then(() => {
                            this.props.navigation.goBack(null)
                        })
                    }catch(e){
                        alert("Failed to cancel trip. Check your connection and try again soon.")
                    }
                }
            })
        }else{
            alert("Failed to cancel this trip. Ended since cancellation.")
        }
    }

    updateTrip = () => {

        if(this.state.changesMade){
            const db = firestore();
            var currentTime = firestore.Timestamp.now();
            db.collection('trips').doc(this.props.navigation.state.params.visit.tripID).get().then((trip) => {
                if(!trip.exists){
                    Alert("Failed to save changes. Trip not found.")
                }else{
                    try{
                        db.collection('trips').doc(this.props.navigation.state.params.visit.tripID).update({
                            vehicle: this.state.selectedVehicle,
                            updated: currentTime,
                        })
                        this.props.navigation.state.params.visit.vehicle = this.state.selectedVehicle;
                        this.updateTripTime();
                        this.setState({changesMade: false})
                    }catch(e){
                        alert("Failed to save changes to trip. Try again soon and check connection.")
                    }
                }

            })
        }
    }


    render(){
        const {width, height} = Dimensions.get("window")
        let vehicleArray = this.props.UserStore.vehicles.map(vehicle => {
            return(
                <RadioButton disabled={this.state.visit.isCancelled ? true : false} key ={vehicle.VehicleID} style={{paddingVertical: 6}} id={vehicle.VehicleID} selectItem={() => this.setActiveVehicle(vehicle, false)}>
                    <View style={{flex: 1}}>
                        <Text style={{fontSize: 16}}>{`${vehicle.Year} ${vehicle.Make} ${vehicle.Model}`}</Text>
                        <Text style={{fontSize: 12}} >{`${vehicle.LicensePlate}`}</Text>
                    </View>
                </RadioButton>
            )
          })

          let paymentsArray = this.props.UserStore.payments.map(payment => {
            let cardValid = false
            let d = new Date();
            // Validate card is not expired
            if(payment.Year < parseInt(d.getFullYear().toString().slice(2))){
              cardValid = false;
          }else if(payment.Year == parseInt(d.getFullYear().toString().slice(2)) && payment.Month < d.getMonth() + 1){
              cardValid = false;
          }else{
              cardValid = true;
          }
        })

      

        if(this._isMounted){
       return(
           <View style={{flex: 1, backgroundColor: 'white'}}>
                <ScrollView >
                    <View style={[styles.contentBox, {marginTop: 16, display: 'flex', flexDirection: 'row'}]}>
                        <View style={{borderRadius: 4, overflow: 'hidden', width: 120}}>
                            {!this.state.visit.isCancelled ? 
                                <View style={{position: 'absolute', zIndex: 9, backgroundColor: 'white', top: 4, left: 4, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4}}>
                                    <Text>{this.state.visit.price.total}</Text>
                                </View>
                            : null }
                            <Image 
                                aspectRatio={1/1}
                                source={{uri: this.state.listing.photo}}
                                height={120}
                                style={{shadowColor: '#000', 
                                shadowOpacity: 0.6, 
                                shadowOffset:{width: 0, height: 0}, 
                                shadowRadius: 3, 
                                elevation: 0,}}
                                resizeMode={'cover'}
                            /> 
                        </View>
                        <View style={{marginLeft: 12, flex: 1, }}>
                            <Text numberOfLines={2} ellipsizeMode='tail' style={{fontSize: 20}}>{this.state.listing.spaceName}</Text>
                            {!this.state.visit.isCancelled ? 
                            <View>
                                <Text numberOfLines={1} ellipsizeMode='tail' style={{flex: 1}}>{this.state.visit.visit.time.start.labelFormatted} - {this.state.visit.visit.time.end.labelFormatted}{this.sameTimezone ? null : ` (${this.state.listing.timezone.timeZoneAbbr})`}</Text>
                                <Text numberOfLines={1} ellipsizeMode='tail'>Last updated {`${this.state.lastUpdate.split(" ")[0].split("/")[0]}/${this.state.lastUpdate.split(" ")[0].split("/")[1]} @ ${this.state.lastUpdate.split(" ")[1].split(":")[0]}:${this.state.lastUpdate.split(" ")[1].split(":")[1]} ${this.state.lastUpdate.split(" ")[2]}`}</Text>
                                <Text type="medium" onPress={() => this.showCancellationModal()} style={{fontSize: 16, color: Colors.hal500, textDecorationLine: 'underline'}}>Cancel {this.isCurrentlyActive ? "Current" : "Upcoming"} Trip</Text>
                            </View>
                            :
                            <Text>Cancelled {this.state.lastUpdate.split(" ")[0].split("/")[0] + "/" + this.state.lastUpdate.split(" ")[0].split("/")[1] + " @ " + this.state.lastUpdate.split(" ")[1].slice(0,4) + " " + this.state.lastUpdate.split(" ")[2].slice(0,2)}</Text>}
                        </View>
                    </View>
                    <View style={[styles.contentBox, {marginTop: 16}]}>
                        <Text type="medium" numberOfLines={1} style={{fontSize: 16, marginBottom: 8}}>Vehicle</Text>
                        <RadioList activeItem={this.state.selectedVehicle.VehicleID} selectItem={(option) => this.setActiveVehicle(option, true)}>
                                    {vehicleArray}
                        </RadioList>
                        <Button onPress={() => this.props.navigation.navigate("AddVehicle")} style = {{backgroundColor: "rgba(255, 193, 76, 0.3)", marginTop: 16, height: 40, paddingVertical: 0}} textStyle={{color: Colors.tango900, fontSize: 16}}>+ Add Vehicle</Button>
                    </View>
                    <View style={[styles.contentBox, {marginTop: 16}]}>
                        <Text type="medium" numberOfLines={1} style={{fontSize: 16,}}>Payment</Text>
                      
                  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderColor: Colors.mist900, borderTopWidth: 2, borderBottomWidth: 2, paddingVertical: 8, paddingHorizontal: 16, marginTop: 16 }}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Icon
                            iconName="credit-card"
                            iconColor="black"
                            iconSize={32}
                            style={styles.icon}          
                        />
                            <View>
                                <Text style={{fontSize: 12}}>{this.state.visit.payment.CardType.charAt(0).toUpperCase() + this.state.visit.payment.CardType.slice(1)}</Text>
                                <Text>{`•••• •••• •••• ${this.state.visit.payment.Number}`}</Text>
                            </View>
                        </View>
                  </View>
        
                    </View>
                </ScrollView>
                <View style={styles.contentBox}>
                    <Button disabled={!this.state.changesMade} onPress={() => this.updateTrip()} style = {this.state.changesMade ? {backgroundColor: Colors.tango700, height: 48} : {backgroundColor: Colors.mist900, height: 48}} textStyle={{color: 'white'}}>Save Changes</Button>
                </View>
                </View>
       )
        }else{
            return(
                <SvgAnimatedLinearGradient width={Dimensions.get('window').width} height={height}>
                        <Rect x="0" width={width} height={width / 1.7777777} rx="0" ry="0" />
                        <Rect x="16" y={width / 1.77777777 + 24} width="100" height="36" rx="20" ry="20" />
                        <Rect x="16" y={width / 1.77777777 + 67} width={width  * .75} height="36" />
                        <Rect x="16" y={width / 1.77777777 + 112} width={width  * .45} height="16" />
                        <Rect x="16" y={width / 1.77777777 + 132} width={width  * .3} height="16" />
                        <Rect x="16" y={width / 1.77777777 + 158} width={width - 32} height="24" />
                        <Rect x="16" y={width / 1.77777777 + 188} width={width  * .65} height="24" />
                        {/* Days of week */}
                        <Rect x="16" y={width / 1.77777777 + 240} width={width / 7 - 12} height="24" rx="12" ry="12" />
                        <Rect x={(((width - 32) / 7) * 1 + 12)} y={width / 1.77777777 + 240} width={(width - 32) / 7 - 8} height="24" rx="12" ry="12" />
                        <Rect x={(((width - 32) / 7) * 2 + 8)} y={width / 1.77777777 + 240} width={(width - 32) / 7 - 8} height="24" rx="12" ry="12" />
                        <Rect x={(((width - 32) / 7) * 3 + 8)} y={width / 1.77777777 + 240} width={(width - 32) / 7 - 8} height="24" rx="12" ry="12" />
                        <Rect x={(((width - 32) / 7) * 4 + 8)} y={width / 1.77777777 + 240} width={(width - 32) / 7 - 8} height="24" rx="12" ry="12" />
                        <Rect x={(((width - 32) / 7) * 5 + 8)} y={width / 1.77777777 + 240} width={(width - 32) / 7 - 8} height="24" rx="12" ry="12" />
                        <Rect x={(((width - 32) / 7) * 6 + 8)} y={width / 1.77777777 + 240} width={(width - 32) / 7 - 8} height="24" rx="12" ry="12" />
                        <Rect x="16" y={width / 1.77777777 + 280} width={width - 32} height="48" />
                        <Rect x="16" y={width / 1.77777777 + 332} width={width - 32} height="48" />
                </SvgAnimatedLinearGradient>
            )
        }
    }


}

const styles = StyleSheet.create({
    contentBox:{
        marginHorizontal: 16,  
      
      },
      icon:{
        paddingRight: 8
    }
})

export default externalSpace;