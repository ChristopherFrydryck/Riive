import React, { Component } from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, SafeAreaView, Dimensions, Animated, TouchableWithoutFeedback, KeyboardAvoidingView, FlatList, Switch, Modal, Picker, Alert, Linking} from 'react-native';
import Text from '../components/Txt'

import MapView, {Marker} from 'react-native-maps';
import DayMap from '../constants/DayMap'
import NightMap from '../constants/NightMap'

//For Shimmer
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient'
import Svg, {Circle, Rect} from 'react-native-svg'
import config from 'react-native-config'


import Icon from '../components/Icon'
import Button from '../components/Button'
import Colors from '../constants/Colors'
import Image from '../components/Image'
import RadioList from '../components/RadioList'
import RadioButton from '../components/RadioButton'
import Input from '../components/Input'

// import * as firebase from 'firebase/app';
import firestore from '@react-native-firebase/firestore';


//MobX Imports
import {inject, observer} from 'mobx-react'





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
          headerTitle: "Edit Trip",
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
            tripReported: this.props.UserStore.reports.map(x => x.visit ? x.visit.visitID : null ).includes(this.props.navigation.state.params.visit.tripID),

            isRefundable: false,
            discountCodeReversable: true,

            refundAmt: null,
            refundAmtCents: null,
            refundCreditAmt: "$0.00",
            refundCreditAmtCents: 0,
            discountRefundAmt: "$0.00",
            discountRefundAmtCents: 0,
            fullRefund: null,
            refundServiceFee: null,


            visitorNameError: "",
            visitorNameValid: true,

            changesMade: false,
            cancellingTrip: false,
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

        // console.log(this.state.visit.price)



    //    this.c(this.state.visit.promoCode);
    

       this.checkIfRefundable()

       this._navListener = this.props.navigation.addListener('didFocus', () => {
        StatusBar.setBarStyle('dark-content', true);
        Platform.OS === 'android' && StatusBar.setBackgroundColor('white');

        this.setState({tripReported: this.props.UserStore.reports.map(x => x.visit ? x.visit.visitID : null ).includes(this.state.visit.tripID)})

    
      });

    //   let {spaceName} = this.state.listing

 

    

      this.updateTripTime();
    //   this.renderVehicleList();

    

    //   this.props.navigation.setParams({
    //     title: this.state.listing.spaceName || "Loading...",
    //   });

    }

    updateTripTime = () => {
        let lastUpdate = new Date(parseInt(this.state.visit.updated.seconds + "000"))
        let lastUpdateString = lastUpdate.toLocaleString('en-US', {timezone: Intl.DateTimeFormat().resolvedOptions().timeZone});

        this.setState({lastUpdate: lastUpdateString})
    }

    componentDidUpdate(prevProps, prevState){

                if(prevState.selectedVehicle.VehicleID !== this.state.selectedVehicle.VehicleID && this.state.selectedVehicle.VehicleID !== this.props.navigation.state.params.visit.vehicle.VehicleID || prevState.visit.visitorName !== this.state.visit.visitorName && this.state.visit.visitorName !== this.props.navigation.state.params.visit.visitorName){
                    // If new vehicle is selected and not original vehicle on initial load or name is changed from default
                    this.setState({changesMade: true})
                }else if(prevState.selectedVehicle.VehicleID !== this.state.selectedVehicle.VehicleID || prevState.visit.visitorName!== this.state.visit.visitorName){
                    // If original vehicle selected or name is the original name
                    this.setState({changesMade:false})
                }else{
                    // DO NOTHING
                }
        
            }
        // }

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
            let vehicleArray = this.props.UserStore.vehicles
            let activeVehicle = vehicleArray.filter(x => x.VehicleID === vehicle)[0]

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

    refundTrip = async (amountRefund, refundFee, discountAmount) => {
            

        const settings = {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntent: this.state.visit.paymentIntentID,
            amount: amountRefund,
            refundApplicationFee: refundFee,
            discountID: this.state.visit.transferID || null,
            discountAmount: discountAmount || 0,
          })
        }



        try{
          
          const fetchResponse = await fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/refundTrip`, settings)
          const data = await fetchResponse.json();
          return data;
        }catch(e){
          return e
        }    
      }

    
    getCouponById = async(couponID) => {
        const settings = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                promoCodeID: couponID,
            })
        }

        try{
            const fetchResponse = await fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/getCouponByID`, settings);
            const data = await fetchResponse.json()
    
            return data
        }catch(e){
            return e
        }

       
    }

    c = (pcode) => {
        this.getCouponById(pcode).then((res) => {
            if(res.statusCode !== 200){
                console.log(res)
                return res
            }else{
                console.log(res.data)
                return res
            }
        })
    }

    checkIfRefundable = () => {
        // const timeDiffEnd = this.state.visit.visit.time.end.unix - new Date().getTime()
        const timeDiffStart = this.state.visit.visit.time.start.unix - new Date().getTime()
        // this.isInPast = timeDiffEnd != Math.abs(timeDiffEnd);
        // this.isCurrentlyActive = timeDiffStart != Math.abs(timeDiffStart) && !this.isInPast;

        var diffVisitTimes = Math.abs(new Date(this.state.visit.visit.time.end.unix) - new Date(this.state.visit.visit.time.start.unix));

        var minutes = Math.floor((diffVisitTimes/1000)/60);
        var thirtyMinSections = Math.ceil(minutes/30)

        let minutesOfTrip = Math.floor(diffVisitTimes/1000/60)

        let minutesSinceStart = Math.ceil((timeDiffStart/1000)/60) >= 0 ? null : Math.abs(Math.ceil((timeDiffStart/1000)/60))
        let minutesUntilEnd = minutes - minutesSinceStart
        
        
        if(minutesSinceStart){
            if(minutesUntilEnd < 30){
                this.setState({isRefundable: false, discountCodeReversable: false})
            }else if(minutesOfTrip/2 >= minutesUntilEnd){
                this.setState({isRefundable: true, discountCodeReversable: false})
            }else{
                this.setState({isRefundable: true, discountCodeReversable: true})
            }
        }else{
            this.setState({isRefundable: true, discountCodeReversable: true})
        }
    }

    showCancellationModal = async() => {
        await this.checkIfRefundable();
        const timeDiffEnd = this.state.visit.visit.time.end.unix - new Date().getTime()
        const timeDiffStart = this.state.visit.visit.time.start.unix - new Date().getTime()
        this.isInPast = timeDiffEnd != Math.abs(timeDiffEnd);
        this.isCurrentlyActive = timeDiffStart != Math.abs(timeDiffStart) && !this.isInPast;

        var diffVisitTimes = Math.abs(new Date(this.state.visit.visit.time.end.unix) - new Date(this.state.visit.visit.time.start.unix));


        var minutes = Math.floor((diffVisitTimes/1000)/60);
        var thirtyMinSections = Math.ceil(minutes/30)

        // If not started yet, minutesSinceStart is null
        let minutesSinceStart = Math.ceil((timeDiffStart/1000)/60) >= 0 ? null : Math.abs(Math.ceil((timeDiffStart/1000)/60))


        let sectionsUnrefundable = Math.ceil((minutesSinceStart/30)%thirtyMinSections)
        let hoursUnrefundable = sectionsUnrefundable / 2


        let refundableAmt = null
        let refundableAmtCents = null;
        let riiveCreditRefundableAmt = null;
        let riiveCreditRefundableAmtCents = null;
        let discountRefundableAmt = null;
        let discountRefundableAmtCents = null;

        if(this.state.isRefundable){
            if(minutesSinceStart){
                if(minutesSinceStart >= 30){
                    if(this.state.visit.price.discount){
                        
                        discountRefundableAmtCents = Math.floor(Math.max(0, this.state.visit.price.discountTotalCents/((thirtyMinSections/2)* hoursUnrefundable)))
                        discountRefundableAmt = (discountRefundableAmtCents/100).toLocaleString("en-US", {style:"currency", currency:"USD"})
                        
                    }
                        riiveCreditRefundableAmtCents = Math.floor(Math.max(0, this.state.visit.price.riiveCreditTotalCents/((thirtyMinSections/2)* hoursUnrefundable)))
                        riiveCreditRefundableAmt = (riiveCreditRefundableAmtCents/100).toLocaleString("en-US", {style:"currency", currency:"USD"})

                        refundableAmtCents = Math.floor(Math.max(0 , Math.floor((this.state.visit.price.priceCents - this.state.visit.price.discountTotalCents - this.state.visit.price.riiveCreditTotalCents) - (((this.state.visit.price.priceCents - this.state.visit.price.discountTotalCents - this.state.visit.price.riiveCreditTotalCents)/(thirtyMinSections/2))*hoursUnrefundable))))

                        refundableAmt = (refundableAmtCents/100).toLocaleString("en-US", {style:"currency", currency:"USD"})
                    

                    await this.setState({refundAmt: refundableAmt, refundAmtCents: refundableAmtCents, fullRefund: false, refundServiceFee: false, discountRefundAmtCents: discountRefundableAmtCents, discountRefundAmt: discountRefundableAmt, refundCreditAmt: riiveCreditRefundableAmt, refundCreditAmtCents: riiveCreditRefundableAmtCents})
                    
                }else{
                    refundableAmtCents = Math.floor(Math.max(0, Math.floor((this.state.visit.price.priceCents - this.state.visit.price.discountTotalCents - this.state.visit.price.riiveCreditTotalCents)) * .9))
                    refundableAmt = (refundableAmtCents/100).toLocaleString("en-US", {style:"currency", currency:"USD"})

                    if(this.state.visit.price.discount){
                        
                        discountRefundableAmtCents = Math.floor(Math.max(0, this.state.visit.price.discountTotalCents*.9))
                        discountRefundableAmt = (discountRefundableAmtCents/100).toLocaleString("en-US", {style:"currency", currency:"USD"})
                        
                    }   

                        riiveCreditRefundableAmtCents = Math.floor(Math.max(0, (this.state.visit.price.riiveCreditTotalCents)*.9))
                        riiveCreditRefundableAmt = (riiveCreditRefundableAmtCents/100).toLocaleString("en-US", {style:"currency", currency:"USD"})

                        
                    
                    
                    await this.setState({refundAmt: refundableAmt, refundAmtCents: refundableAmtCents, fullRefund: false, refundServiceFee: false, discountRefundAmtCents: discountRefundableAmtCents, discountRefundAmt: discountRefundableAmt, refundCreditAmt: riiveCreditRefundableAmt, refundCreditAmtCents: riiveCreditRefundableAmtCents})
                }
            }else{
                refundableAmtCents = Math.floor(Math.max(0, Math.floor((this.state.visit.price.priceCents - this.state.visit.price.discountTotalCents - this.state.visit.price.riiveCreditTotalCents))))
                refundableAmt = (refundableAmtCents/100).toLocaleString("en-US", {style:"currency", currency:"USD"})

                if(this.state.visit.price.discount){
                    
                    discountRefundableAmtCents = Math.floor(Math.max(0, this.state.visit.price.discountTotalCents))
                    discountRefundableAmt = (discountRefundableAmtCents/100).toLocaleString("en-US", {style:"currency", currency:"USD"})
                    
                }

                riiveCreditRefundableAmtCents = Math.floor(Math.max(0, this.state.visit.price.riiveCreditTotalCents))
                riiveCreditRefundableAmt = (riiveCreditRefundableAmtCents/100).toLocaleString("en-US", {style:"currency", currency:"USD"})

                await this.setState({refundAmt: refundableAmt, refundAmtCents: refundableAmtCents, fullRefund: true, refundServiceFee: false, discountRefundAmtCents: discountRefundableAmtCents, discountRefundAmt: discountRefundableAmt, refundCreditAmt: riiveCreditRefundableAmt, refundCreditAmtCents: riiveCreditRefundableAmtCents})
                
            }
        }else{
            Alert("This visit can no longer be refunded. For any questions, contact us at support@riive.net.")
            await this.setState({refundAmt: null, refundAmtCents: null, fullRefund: null, discountRefundableAmt: "$0.00", discountRefundableAmtCents: 0,refundCreditAmt: "$0.00", refundCreditAmtCents: 0 })
        }

        // console.log(discountRefundableAmt)


        if(this.state.isRefundable){
            if(this.props.UserStore.directDepositInfo.id){
                if(this.isCurrentlyActive){
                    if(this.state.refundAmtCents > 0){
                        Alert.alert(
                            'Cancel Trip',
                            `Cancelling your current trip will return a partial amount of ${this.state.refundAmt} back to the account ending in ${this.props.UserStore.directDepositInfo.number} ${this.state.refundCreditAmtCents > 0 ? `and also return ${this.state.refundCreditAmt} credit to your account` : ""}. ${this.state.discountCodeReversable && this.state.visit.price.discount !== null ? "By cancelling you will be allowed to reuse the discount code on this purchase" : !this.state.discountCodeReversable && this.state.visit.price.discount !== null ? "Unfortunately you will be unable to reuse the discount code on this purchase if it was a one time code." : ""}`,
                            [
                            { text: 'Cancel' },
                            { text: 'Cancel Trip', onPress: () => this.cancelTrip() }
                            ]
                        )
                    }else if(this.state.refundCreditAmtCents > 0){
                        Alert.alert(
                            'Cancel Trip',
                            `Cancelling your current trip will return an account credit of ${this.state.refundCreditAmt}. ${this.state.discountCodeReversable && this.state.visit.price.discount !== null ? "By cancelling you will be allowed to reuse the discount code on this purchase" : !this.state.discountCodeReversable && this.state.visit.price.discount !== null ? "Unfortunately you will be unable to reuse the discount code on this purchase if it was a one time code." : ""}`,
                            [
                            { text: 'Cancel' },
                            { text: 'Cancel Trip', onPress: () => this.cancelTrip() }
                            ]
                        )
                    }else{
                        Alert.alert(
                            'Cancel Trip',
                            `Cancelling your current trip will not return any funds to your account. ${this.state.discountCodeReversable && this.state.visit.price.discount!== null ? "By cancelling you will be allowed to reuse the discount code on this purchase" : !this.state.discountCodeReversable && this.state.visit.price.discount !== null ? "Unfortunately you will be unable to reuse the discount code on this purchase if it was a one time code." : ""}`,
                            [
                            { text: 'Cancel' },
                            { text: 'Cancel Trip', onPress: () => this.cancelTrip() }
                            ]
                        )
                    }

                }else{
                    if(this.state.refundAmtCents > 0){
                        
                        Alert.alert(
                            'Cancel Trip',
                            `Cancelling a trip will return a total amount of ${this.state.refundAmt} back to the account ending in ${this.props.UserStore.directDepositInfo.number} ${this.state.refundCreditAmtCents > 0 ? `and also return ${this.state.refundCreditAmt} credit to your account` : ""}. ${this.state.discountCodeReversable && this.state.visit.price.discount!== null ? "By cancelling you will be allowed to reuse the discount code on this purchase" : !this.state.discountCodeReversable && this.state.visit.price.discount!== null ? "Unfortunately you will be unable to reuse the discount code on this purchase if it was a one time code." : ""}`,
                            [
                            { text: 'Cancel' },
                            { text: 'Cancel Trip', onPress: () => this.cancelTrip() }
                            ]
                        )
                    }else if(this.state.refundCreditAmtCents > 0){
                        Alert.alert(
                            'Cancel Trip',
                            `Cancelling your current trip will return an account credit of ${this.state.refundCreditAmt}. ${this.state.discountCodeReversable && this.state.visit.price.discount !== null ? "By cancelling you will be allowed to reuse the discount code on this purchase" : !this.state.discountCodeReversable && this.state.visit.price.discount !== null ? "Unfortunately you will be unable to reuse the discount code on this purchase if it was a one time code." : ""}`,
                            [
                            { text: 'Cancel' },
                            { text: 'Cancel Trip', onPress: () => this.cancelTrip() }
                            ]
                        )
                    }else{
                        Alert.alert(
                            'Cancel Trip',
                            `Cancelling your upcoming trip will not return any funds to your account. ${this.state.discountCodeReversable && this.state.visit.price.discount !== null ? "By cancelling you will be allowed to reuse the discount code on this purchase" : this.state.discountCodeReversable && this.state.visit.price.discount !== null? "Unfortunately you will be unable to reuse the discount code on this purchase if it was a one time code." : ""}`,
                            [
                            { text: 'Cancel' },
                            { text: 'Cancel Trip', onPress: () => this.cancelTrip() }
                            ]
                        )
                    }               
                }
            }else{
                Alert.alert(
                    'Need Bank Information',
                    `Additional bank information is required to direct deposit funds back into your bank account.`,
                    [
                    
                    { text: 'Add Bank Information', onPress: () => this.props.navigation.navigate('BankInfo') },
                    { text: 'Cancel' },
                    ]
                )
            }
        }

        
    }

    checkName = () => {
        const regexFullname = /[^0-9]([a-zA-Z]{1,})+[ ]+([a-zA-Z-']{2,})$/gi;
        if(this.state.visit.visitorName.match(regexFullname)){
            this.setState({
                visitorNameValid: true,
                visitorNameError: ""
            })
        }else{
            this.setState({
                visitorNameValid: false,
                visitorNameError: "Please provide a valid first and last name"
            })
        }
    }

    cancelTrip = () => {
        this.setState({cancellingTrip: true})
        const timeDiffEnd = this.state.visit.visit.time.end.unix - new Date().getTime()
        const timeDiffStart = this.state.visit.visit.time.start.unix - new Date().getTime()
        this.isInPast = timeDiffEnd != Math.abs(timeDiffEnd);
        this.isCurrentlyActive = timeDiffStart != Math.abs(timeDiffStart) && !this.isInPast;
        var currentTime = firestore.Timestamp.now();

        if(!this.isInPast){
            const db = firestore();
            db.collection('trips').doc(this.props.navigation.state.params.visit.tripID).get().then(async(trip) => {
                if(!trip.exists){
                    alert("Failed to save changes. Trip not found.")
                    this.setState({cancellingTrip: false})
                }else{
                    let hostPushTokens = null;
                    let refundID =  null;
                    // console.log(trip.data().hostID)

                    try{

                      await this.refundTrip(this.state.refundAmtCents, false, this.state.discountRefundAmtCents + this.state.refundCreditAmtCents).then(res => {
                      
                            if(res.statusCode !== 200){
                                throw res.message
                            }else{
                                refundID = res.data ? res.data.id : null
                            }
                        })

                        db.collection('trips').doc(this.props.navigation.state.params.visit.tripID).update({
                            isCancelled: true,
                            refundAmt: this.state.refundAmt,
                            refundAmtCents: this.state.refundAmtCents,
                            refundCreditAmt: this.state.refundCreditAmt,
                            refundCreditAmtCents: this.state.refundCreditAmtCents,
                            refundId: refundID,
                            refundFull: this.state.fullRefund,
                            refundServiceFee: this.state.refundServiceFee,
                            hostCharged: null,
                            hostChargedCents: null,
                            cancelledBy: "guest",
                            updated: currentTime
                        }).then(async() => {
                            db.collection("listings").doc(this.props.navigation.state.params.visit.listingID).collection("trips").doc(this.props.navigation.state.params.visit.tripID).update({
                                isCancelled: true,
                            })

                            if(this.state.refundCreditAmtCents > 0){
                                db.collection("users").doc(this.props.UserStore.userID).update({
                                    accountBalance: Math.round(this.state.refundCreditAmtCents + this.props.UserStore.accountBalance)
                                })

                                this.props.UserStore.accountBalance = this.props.UserStore.accountBalance + this.state.refundCreditAmtCents;
                            }


                            if(this.state.visit.promoCode && this.state.discountCodeReversable){
                                db.collection("users").doc(this.props.UserStore.userID).update({
                                    discounts: firestore.FieldValue.arrayRemove(this.state.visit.promoCode),
                                })
    
                                let removedPromo = this.props.UserStore.discounts.filter(x => x !== this.state.visit.promoCode)

                                this.props.UserStore.discounts = removedPromo
                                

                            }
                            

                        }).then(async() => {
                            await db.collection("users").doc(trip.data().hostID).get().then((host) => {
                                if(!host.exists){
                                    throw "Host does not exist"
                                }else{
                                    hostPushTokens = host.data().pushTokens
                                }
                             })
                        }).then(() => {
                            let date = new Date();
                            var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                            var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                            let today = date.getDate();
                            let month = months[date.getMonth()]
                            let year = date.getFullYear();
                            const isToday = this.state.visit.visit.day.dateName === today && this.state.visit.visit.day.year === year && this.state.visit.visit.day.monthName === month;
                            const settings = {
                                method: 'POST',
                                headers: {
                                  Accept: 'application/json',
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    tokens: hostPushTokens.filter(x => x !== null),
                                    title: this.isCurrentlyActive ? "Cancelled current trip" : "Cancelled upcoming trip",
                                    message: this.isCurrentlyActive ? `${this.state.visit.visitorName.split(" ")[0]} ${this.state.visit.visitorName.split(" ")[1].split("")[0]}. has ended their current visit at ${this.state.listing.spaceName} early.` : `${this.state.visit.visitorName.split(" ")[0]} ${this.state.visit.visitorName.split(" ")[1].split("")[0]}. has cancelled their upcoming visit ${isToday ? "today" : `on ${this.state.visit.visit.day.dayName}`} at ${this.state.listing.spaceName} from ${this.state.visit.visit.time.start.labelFormatted} - ${this.state.visit.visit.time.end.labelFormatted}.`,
                                    screen: "HostedTrips"
                                })
                              }
                          
                                
                            fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/sendNotification`, settings)

                            
                        }).then(() => {
                            this.setState({cancellingTrip: false})
                            this.props.navigation.goBack(null)
                        }).catch(e => {
                            throw e
                        })
                    }catch(e){
                        alert(e)
                        this.setState({cancellingTrip: false})
                    }
                }
            })
        }else{
            alert("Failed to cancel this trip. Ended since cancellation.")
            this.setState({cancellingTrip: false})
        }
    }

    updateTrip = async() => {
        await this.checkName();
        if(this.state.changesMade && this.state.visitorNameValid){
            const db = firestore();
            var currentTime = firestore.Timestamp.now();
            db.collection('trips').doc(this.props.navigation.state.params.visit.tripID).get().then((trip) => {
                if(!trip.exists){
                    alert("Failed to save changes. Trip not found.")
                }else{
                    try{
                        db.collection('trips').doc(this.props.navigation.state.params.visit.tripID).update({
                            vehicle: this.state.selectedVehicle,
                            visitorName: this.state.visit.visitorName,
                            updated: currentTime,
                        })
                        this.props.navigation.state.params.visit.vehicle = this.state.selectedVehicle;
                        this.props.navigation.state.params.visit.visitorName = this.state.visitorName
                        this.updateTripTime();
                        this.setState({changesMade: false})
                    }catch(e){
                        alert("Failed to save changes to trip. Try again soon and check connection.")                        
                    }
                }
            })
        }
    }

    renderVehicleList = () => {

        
        let currentVehicles = this.props.UserStore.vehicles
        let defaultVehicle = this.props.navigation.state.params.visit.vehicle
        //   If current vehicle for trip exists on profile
          if(currentVehicles.filter(x => x.VehicleID == defaultVehicle.VehicleID).length > 0){
            //   let usedVehicle = this.props.navigation.state.params.visit.vehicle
            //   currentVehicles.filter(x => x.VehicleID === usedVehicle.VehicleID).unshift(usedVehicle)
            
            return currentVehicles.map(vehicle => {
                return(
                    <RadioButton disabled={this.state.visit.isCancelled || this.isInPast ? true : false} key ={vehicle.VehicleID} style={{paddingVertical: 6}} id={vehicle.VehicleID} selectItem={() => this.setActiveVehicle(vehicle, false)}>
                        <View style={{flex: 1}}>
                            <Text style={{fontSize: 16}}>{`${vehicle.Year} ${vehicle.Make} ${vehicle.Model}`}</Text>
                            <Text style={{fontSize: 12}} >{`${vehicle.LicensePlate}`}</Text>
                        </View>
                    </RadioButton>
                )
              })
            

          }else{
              //   If current vehicle for trip has been removed from profile
              let profileVehicles = currentVehicles.map(vehicle => {
                return(
                    <RadioButton disabled={this.state.visit.isCancelled || this.isInPast ? true : false} key ={vehicle.VehicleID} style={{paddingVertical: 6}} id={vehicle.VehicleID} selectItem={() => this.setActiveVehicle(vehicle, false)}>
                        <View style={{flex: 1}}>
                            <Text style={{fontSize: 16}}>{`${vehicle.Year} ${vehicle.Make} ${vehicle.Model}`}</Text>
                            <Text style={{fontSize: 12}} >{`${vehicle.LicensePlate}`}</Text>
                        </View>
                    </RadioButton>
                )
              })

              let newEl = [
              <RadioButton disabled={this.state.visit.isCancelled || this.isInPast ? true : false} key ={defaultVehicle.VehicleID} style={{paddingVertical: 6}} id={defaultVehicle.VehicleID} selectItem={() => this.setActiveVehicle(defaultVehicle, false)}>
                  <View style={{flex: 1}}>
                      <Text style={{fontSize: 16}}>{`${defaultVehicle.Year} ${defaultVehicle.Make} ${defaultVehicle.Model}`}</Text>
                      <Text style={{fontSize: 12}} >{`${defaultVehicle.LicensePlate}`}</Text>
                    </View>
                </RadioButton>]

            return [newEl[0], ...profileVehicles]
                
            


          }

         

         
    }


    render(){
        const {width, height} = Dimensions.get("window")
        // console.log(this.state.visit.promoCode)
        // let vehicleArray = this.props.UserStore.vehicles.map(vehicle => {
        //     return(
        //         <RadioButton disabled={this.state.visit.isCancelled ? true : false} key ={vehicle.VehicleID} style={{paddingVertical: 6}} id={vehicle.VehicleID} selectItem={() => this.setActiveVehicle(vehicle, false)}>
        //             <View style={{flex: 1}}>
        //                 <Text style={{fontSize: 16}}>{`${vehicle.Year} ${vehicle.Make} ${vehicle.Model}`}</Text>
        //                 <Text style={{fontSize: 12}} >{`${vehicle.LicensePlate}`}</Text>
        //             </View>
        //         </RadioButton>
        //     )
        //   })

        let vehicleArray = this.renderVehicleList();

          
            


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
                            { !this.state.visit.isCancelled ? 
                                <View style={{position: 'absolute', zIndex: 9, backgroundColor: 'white', top: 4, left: 4, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4}}>
                                    <Text>{this.state.visit.price.discount ? (Math.max(0,(this.state.visit.price.totalCents - this.state.visit.price.discountTotalCents - this.state.visit.price.riiveCreditTotalCents))/100).toLocaleString("en-US", {style:"currency", currency:"USD"}) : (Math.max(0,(this.state.visit.price.totalCents - this.state.visit.price.riiveCreditTotalCents))/100).toLocaleString("en-US", {style:"currency", currency:"USD"})}</Text>
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
                                {!this.isInPast && this.state.isRefundable && !this.state.tripReported ? 
                                    // <Text type="medium" onPress={() => this.showCancellationModal()} style={{fontSize: 16, color: Colors.hal500, textDecorationLine: 'underline'}}>Cancel {this.isCurrentlyActive ? "Current" : "Upcoming"} Trip</Text>
                                    <Button
                                        style={{backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: Colors.hal500, height: 40, marginTop: 5, paddingVertical: 0}} 
                                        textStyle={this.state.discountTotalCents ? {color: Colors.hal500, fontSize: 16} : {color: Colors.hal500, fontSize: 16}} 
                                        onPress={() => this.showCancellationModal()}
                                    >
                                        {this.state.cancellingTrip ? null : "Cancel Trip"}
                                    </Button>
                                :
                                this.state.tripReported  ? 
                                    <Text type="medium" style={{fontSize: 16, color: Colors.cosmos300}}>Trip Reported</Text> 
                                :
                                   Math.abs(Math.floor((new Date().getTime() - this.state.visit.visit.time.end.unix) / 86400000)) <= 30 ?
                                    <Text type="medium" onPress={() => this.props.navigation.navigate("ReportTrip", {
                                        isGuest: true,
                                        visit: this.state.visit,
                                        listing: this.state.listing
                                    })} style={{fontSize: 16, color: Colors.tango900, textDecorationLine: 'underline'}}>Report Trip</Text> 
                                    : null 
                                }
                            </View>
                            :
                            <Text>Cancelled {this.state.lastUpdate.split(" ")[0].split("/")[0] + "/" + this.state.lastUpdate.split(" ")[0].split("/")[1] + " @ " + this.state.lastUpdate.split(" ")[1].split(" ")[0].split(":")[0] + ":" + this.state.lastUpdate.split(" ")[1].split(" ")[0].split(":")[1] + " " + this.state.lastUpdate.split(" ")[2].slice(0,2)}</Text>}
                        </View>
                    </View>
                    <View style={[styles.contentBox, {marginTop: 16}]}>
                        <Text type="medium" numberOfLines={1} style={{fontSize: 16, marginBottom: 8}}>Visitor Details</Text>
                        <Input 
                             placeholder='Visitor name...'
                             label="Visitor Name"
                             name="visitor name"
                             editable={!this.state.visit.isCancelled && !this.isInPast ? true : false}
                             onChangeText = {value => {
                                this.setState({
                                    visit: {
                                        ...this.state.visit,
                                        visitorName: value
                                    }
                                })
                             }
                                
                                
                            }
                             value={this.state.visit.visitorName}
                             maxLength = {40}
                             keyboardType='default'
                             error={this.state.visitorNameError}
                        />
                    </View>
                    <View style={[styles.contentBox, {marginTop: 16}]}>
                        <Text type="medium" numberOfLines={1} style={{fontSize: 16, marginBottom: 8}}>Vehicle Details</Text>
                        <RadioList activeItem={this.state.selectedVehicle.VehicleID} selectItem={(option) => this.setActiveVehicle(option, true)}>
                                    {vehicleArray}
                        </RadioList>
                        { !this.isInPast && !this.state.visit.isCancelled ?
                            <Button onPress={() => this.props.navigation.navigate("AddVehicle")} style = {{backgroundColor: "rgba(255, 193, 76, 0.3)", marginTop: 16, height: 40, paddingVertical: 0}} textStyle={{color: Colors.tango900, fontSize: 16}}>+ Add Vehicle</Button>
                            :
                            null
                        }
                    </View>
                    <View style={[styles.contentBox, {marginTop: 16}]}>
                        <Text type="medium" numberOfLines={1} style={{fontSize: 16,}}>Payment Details</Text>
                      
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