import React, { Component } from 'react';
import { Platform, Animated, Dimensions, StatusBar, ScrollView, View, StyleSheet, ActivityIndicator, Alert } from 'react-native';

import Text from '../components/Txt'
import Button from '../components/Button'
import Input from '../components/Input';
import Icon from '../components/Icon'
import Colors from '../constants/Colors'

import Round from '../functions/in-app/round'
import checkUserStatus from '../functions/in-app/checkUserStatus';

import MapView, {Marker} from 'react-native-maps';
import config from 'react-native-config'

import DayMap from '../constants/DayMap'
import NightMap from '../constants/NightMap'

// import { RadioButton } from 'react-native-paper';
import RadioList from '../components/RadioList'
import RadioButton from '../components/RadioButton'
import StripeTOSModal from '../components/StripeTOSModal';

// Firebase imports
// import * as firebase from 'firebase/app';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging'
import storage from '@react-native-firebase/storage'
// import 'firebase/firestore';
// import 'firebase/auth';


//MobX Imports
import {inject, observer} from 'mobx-react'
import { panGestureHandlerCustomNativeProps } from 'react-native-gesture-handler/lib/typescript/handlers/PanGestureHandler';



    
// if (Platform.OS === "android") {
//     
// }
if(Platform.OS === 'android') { // only android needs polyfill
    require('intl'); // import intl object
    require('intl/locale-data/jsonp/en');
    Intl.__disableRegExpRestore()
  }



@inject("UserStore", "ComponentStore")
@observer
class reserveSpace extends Component {
    _isMounted = false;

    static navigationOptions = {
        
    };

    constructor(props){
        super(props)
        this.state = {
            currentActivePhoto: 0,
            hoursSpent: null,
            minutesSpent: null,
            
            serviceFeePercentage: 0,
            processingFeePercentage: 0, 

            price: null,
            priceCents: null,
            serviceFee: null,
            serviceFeeCents: null,
            processingFee: null,
            processingFeeCents: null,
            discount: null,
            discountType: null,
            discountTotal: null,
            discountTotalCents: null,
            total: null,
            totalCents: null,

            promoCode: "newuser20",
            promoCodeID: null,
            promoCodeError: "",
            promoCodeActive: false,

            selectedVehicle: null,
            selectedVehicleError: "",
            selectedPayment: null,
            selectedPaymentError: "",

            
            inSameTimezone: false,

            spaceAvailabilityWorks: true,
            spaceCancelledOrHidden: false,
            authenticatingReservation: false,
            authenticatingCoupon: false,

            stripeModalVisible: false,
        }
        
    }

    async componentDidMount(){
        const { timeSearched } = this.props.navigation.state.params.homeState;
        await this.getDiffHours(timeSearched[0].label, timeSearched[1].label)

        await this.getAppPricing().then(values => {
            this.setState({
                serviceFeePercentage: values.service_fee_percentage,
                processingFeePercentage: values.processing_fee_percentage,
                serviceFeeCents: values.service_fee,
            })
        })

        await this.getPrice();

       
        // Check if space is in same timezone as current device
        if(this.props.ComponentStore.selectedExternalSpot[0].timezone.offsetValue + new Date().getTimezoneOffset()/60 === 0){
            this.setState({inSameTimezone: true})
        }

        


        this._isMounted = true;
        this._navListener = this.props.navigation.addListener('didFocus', () => {
           checkUserStatus(auth().currentUser.uid);
           StatusBar.setBarStyle('dark-content', true);
           Platform.OS === 'android' && StatusBar.setBackgroundColor('white');

           if(this.props.UserStore.vehicles.length > 0){
            let vehicle = this.props.UserStore.vehicles[0]
            this.setState({selectedVehicle: {
                Color: vehicle.Color,
                LicensePlate: vehicle.LicensePlate,
                Make: vehicle.Make,
                Model: vehicle.Model,
                VehicleID: vehicle.VehicleID,
                Year: vehicle.Year,
            }})
        }

        if(this.props.UserStore.payments.length > 0){
            let payment = this.props.UserStore.payments[0]
            this.setState({selectedPayment: {
                CCV: payment.CCV,
                Number: payment.Number,
                CardType: payment.CardType,
                Month: payment.Month,
                Name: payment.Name,
                PaymentID: payment.PaymentID,
                StripeID: payment.StripeID,
                StripePMID: payment.StripePMID,
                Type: payment.Type,
                Year: payment.Year
            }})
        }
         });

         
  
         
      }

      getAppPricing = () => {
        const db = firestore();
        const pricing = db.collection("environment").doc("pricing") 

        return pricing.get().then(res => {
            return res.data()
        }).then((res) => {
            return res
        }).catch(e => {
            throw e
        })
      };

    carouselUpdate = (xVal) => {
        const {width} = Dimensions.get('window')
    
        let newIndex = Math.round(xVal/width)
    
        // console.log(newIndex)
    
        this.setState({currentActivePhoto: newIndex})
    }

    renderDotsView = (numItems, position) => {
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

        setActivePayment = (payment, idOnly) => {
            if(idOnly){
                let activePayment = this.props.UserStore.payments.filter(x => x.PaymentID === payment)[0]
                this.setState({selectedPayment: {
                    CCV: activePayment.CCV,
                    Number: activePayment.Number,
                    CardType: activePayment.CardType,
                    Month: activePayment.Month,
                    Name: activePayment.Name,
                    PaymentID: activePayment.PaymentID,
                    StripeID: activePayment.StripeID,
                    StripePMID: activePayment.StripePMID,
                    Type: activePayment.Type,
                    Year: activePayment.Year
                }})
            }else{
                this.setState({selectedPayment: {
                    CCV: payment.CCV,
                    Number: payment.Number,
                    CardType: payment.CardType,
                    Month: payment.Month,
                    Name: payment.Name,
                    PaymentID: payment.PaymentID,
                    StripeID: payment.StripeID,
                    StripePMID: payment.StripePMID,
                    Type: payment.Type,
                    Year: payment.Year
                }})
            }
        }

        setActiveVehicle = (vehicle, idOnly) => {


            if(idOnly){
                let activeVehicle = this.props.UserStore.vehicles.filter(x => x.VehicleID === vehicle)[0]

                this.setState({selectedVehicle: {
                    Color: activeVehicle.Color,
                    LicensePlate: activeVehicle.LicensePlate,
                    Make: activeVehicle.Make,
                    Model: activeVehicle.Model,
                    VehicleID: activeVehicle.VehicleID,
                    Year: activeVehicle.Year,
                }})

                // this.setState({selectedVehicle: activeVehicle.VehicleID})
            }else{
                this.setState({selectedVehicle: {
                    Color: vehicle.Color,
                    LicensePlate: vehicle.LicensePlate,
                    Make: vehicle.Make,
                    Model: vehicle.Model,
                    VehicleID: vehicle.VehicleID,
                    Year: vehicle.Year,
                }})
                // // console.log(vehicle.VehicleID)
                // this.setState({selectedVehicle: vehicle.VehicleID})
            }
            
        }

    
        convertToCommonTime = (t) => {
            let hoursString = t.substring(0,2)
            let minutesString = t.substring(2)
    
    
            
            let hours = parseInt(hoursString) == 0 ? "12" : parseInt(hoursString) > 12 ? (parseInt(hoursString) - 12).toString() : parseInt(hoursString);
            // let minutes = parseInt(minutesString)
            return(`${hours}:${minutesString} ${parseInt(hoursString) >= 12 ? 'PM' : 'AM'}`)
        }

        getDiffHours = (arrive, depart) => {
            let arriveArray = arrive.split("").map(x => parseInt(x))
            let departArray = depart.split("").map(x => parseInt(x))
            let hoursArrive = parseInt(arriveArray[0] + "" + arriveArray[1]) 
            let hoursDepart = parseInt(departArray[0] + "" + departArray[1]) 
            let minutesArrive = parseInt(arriveArray[2] + "" + arriveArray[3]) 
            let minutesDepart = parseInt(departArray[2] + "" + departArray[3]) 

            

            this.setState({ hoursSpent: minutesDepart + 1 + minutesArrive == 60 ? (hoursDepart - hoursArrive) + 1 : hoursDepart - hoursArrive, minutesSpent: minutesDepart + 1 + minutesArrive == 60 ? 0 : 30})

        }

        checkHiddenOrCancelled = async() => {
            const db = firestore();
            const space = db.collection("listings").doc(this.props.ComponentStore.selectedExternalSpot[0].listingID)

            await space.get().then(res => {
                return res.data()
            }).then((res) => {
                if(res.toBeDeleted || res.hidden){
                    this.setState({spaceCancelledOrHidden: true})
                }else{
                    this.setState({spaceCancelledOrHidden: false})
                }
            })
        }

        checkAvailability = async() => {
            let worksArray = [];
            let futureVisits = [];
            const db = firestore()
            
            let {timeSearched, daySearched} = this.props.navigation.state.params.homeState;

            const spaceVisits = db.collection("trips").where("listingID", "==", this.props.ComponentStore.selectedExternalSpot[0].listingID)
            const spaceVisitsFuture = spaceVisits.where("visit.time.end.unix", ">", new Date().getTime())

            await spaceVisitsFuture.get().then((spaceData) => {
                spaceData.docs.map(x => {
                     futureVisits.push(x.data())
                 })
             })

            await this.props.ComponentStore.selectedExternalSpot[0].availability[daySearched.dayValue].data.forEach((data, i) => {

                let numSpacesTotal = this.props.ComponentStore.selectedExternalSpot[0].numSpaces
                let spacesBooked = 0;

                 // If specific time slot is marked unavailable, we will check it
                 if(!data.available){
                    // // Check if start time is out of bounds
                    
                        worksArray.push(false)
                        
       
                        // console.log(`Time slot ${data.id} is marked unavailable but works since ${data.start} and ${data.end} are not within the bounds of ${this.state.timeSearched[0].label} and ${this.state.timeSearched[1].label}`)
                    // }
                   
                    // console.log("Time slot " + data.id + " does not work")
                }else{
                    
                     // Check each upcoming visit for a space
                     for(data of futureVisits){

                         // Check if visit is not cancelled
                         if(!data.isCancelled){
                            // Check if day of search matches visit day
                            if(daySearched.dayValue === data.visit.day.dayValue){
                                // if a visit start is after start time and before end time
                                if(parseInt(data.visit.time.start.label) >= parseInt(timeSearched[0].label) && parseInt(data.visit.time.start.label) <= parseInt(timeSearched[1].label)){
                                    
                                    spacesBooked ++;
                                    if (spacesBooked >= numSpacesTotal){
                                        worksArray.push(false)
                                        break;
                                    }

                                // if a visit end is before a start time and after end time
                                }else if(parseInt(data.visit.time.end.label) >= parseInt(timeSearched[0].label) && parseInt(data.visit.time.end.label) <= parseInt(timeSearched[1].label)){
                                   
                                    spacesBooked ++;
                                    if (spacesBooked >= numSpacesTotal){
                                        worksArray.push(false)
                                        break;
                                    }

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
                }

            })
            
            if(worksArray.includes(false)){
                this.setState({spaceAvailabilityWorks: false})
            }else{
                this.setState({spaceAvailabilityWorks: true})
            }
           
       
               
        }


        getPrice = () => {
            // console.log(`${this.state.hoursSpent} hours and ${this.state.minutesSpent} minutes`)
            let price = (this.state.hoursSpent * this.props.ComponentStore.selectedExternalSpot[0].spacePriceCents) + (this.state.minutesSpent === 0 ? 0 : Math.ceil(this.props.ComponentStore.selectedExternalSpot[0].spacePriceCents / 2));

            
            var dollars = (price / 100);
            var dollarsCents = Math.ceil(price);
            dollars = dollars.toLocaleString("en-US", {style:"currency", currency:"USD"});

            
            var dollarsServiceFeeCents = price * this.state.serviceFeePercentage > this.state.serviceFeeCents ? Math.ceil(price * this.state.serviceFeePercentage) : this.state.serviceFeeCents;
            var dollarsServiceFee = (dollarsServiceFeeCents/100).toLocaleString("en-US", {style:"currency", currency:"USD"});


    
            var dollarsProcessingFeeCents = Math.ceil((price  * this.state.processingFeePercentage) + 30)
            var dollarsProcessingFee = (dollarsProcessingFeeCents/100).toLocaleString("en-US", {style:"currency", currency:"USD"});


            this.setState({
                price: dollars, 
                priceCents: dollarsCents,
                serviceFee: dollarsServiceFee,
                serviceFeeCents: dollarsServiceFeeCents,
                processingFee: dollarsProcessingFee,
                processingFeeCents: dollarsProcessingFeeCents,
            })

            this.setState({
                total: ((this.state.priceCents + this.state.serviceFeeCents + this.state.processingFeeCents) / 100).toLocaleString("en-US", {style:"currency", currency:"USD"}),
                totalCents: this.state.priceCents + this.state.serviceFeeCents + this.state.processingFeeCents
            })

    
        }

        checkCoupon = async (val) => {
            
            // Sets state of button to authenticating 
            this.setState({authenticatingCoupon: true})

            const settings = {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: val,
                })
            }
    
            const fetchResponse = await fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/getCoupon`, settings);
            const data = await fetchResponse.json();

            // If successfully fetching function
            if(data.statusCode == 200){
             
                // If a result is available (we only gather valid coupons)
                if(data.data.data.length > 0){
                    this.setState({promoCodeValid: true, promoCodeError: ""})

                    // Just in case there is somehow two or more discounts with the same code even though Stripe doesn't allow this
                    const sortedResultsNewFirst = data.data.data.sort((a, b) => a.created - b.created)
                    const pcode = sortedResultsNewFirst[0]

                    // The number of times a coupon has been used by a user
                    let numTimesUsedDiscount = this.props.UserStore.discounts.filter(x => x == pcode.id).length;

                    // The minimum amount of money that can make the coupon valid. Only for fare, not for additional fees
                    let minimumAmountValid = pcode.restrictions.minimum_amount ? this.state.priceCents >= pcode.restrictions.minimum_amount : true;

                    // The number of times a coupon can be used by a user 
                    let numTimesUsedValid = pcode.coupon.max_redemptions ? numTimesUsedDiscount < pcode.coupon.max_redemptions : true;

                    // The value for if the coupon is valid only the first trip (we default this to true but make it false down the line if a user has a trip that wasn't cancelled)
                    let firstTimeOnlyValid = true;

                    // If a coupon is only for a specific customer
                    let isValidCustomer = pcode.customer ?  pcode.customer == this.props.UserStore.stripeID : true;


                    // If the promo code has a restriction for first-time only transactions
                    if(pcode.restrictions.first_time_transaction){

                        // Get most recent ten user trips 
                        const db = firestore();
                        await db.collection("trips").where("visitorID", "==", this.props.UserStore.userID).orderBy("endTimeUnix", "desc").limit(10).get().then((trips) => {

                            // For each trip, see if it is cancelled, If so, continue else make the first time only valid false
                            for (let i = 0; i < trips.docs.length; i++){
                                // console.log(trips.docs[i].data().isCancelled)
                                if(trips.docs[i].data().isCancelled){
                                    continue;
                                }else{
                                    firstTimeOnlyValid = false;
                                    break;
                                }
                            }
                        
                                
                            }).catch(e => {
                                Alert.alert("Coupon Issue", "There are issues gathering your past trips information to see if this coupon is valid.", 
                                [
                                    { text: 'Retry', onPress: () =>{
                                        this.checkCoupon();
                                    }},
                                    { text: 'Cancel' }
                                ])

                                this.setState({authenticatingCoupon: false})
                                
                            })
                    }

                    // console.log(`numTimesUsedValid: ${numTimesUsedValid}, minimumAmountValid: ${minimumAmountValid}, firstTimeOnlyValid: ${firstTimeOnlyValid}, isValidCustomer: ${isValidCustomer} `)

                    // If everything is valid and the coupon type is a fixed amount off the final fare
                        if(pcode.coupon.amount_off && numTimesUsedValid && minimumAmountValid && firstTimeOnlyValid && isValidCustomer){
                            const discountTotalCents = (this.state.totalCents - pcode.coupon.amount_off) > 0 ? pcode.coupon.amount_off : this.state.totalCents
    
    
                            this.setState({
                                promoCode: pcode.code, 
                                promoCodeID: pcode.id,
                                discountType: "dollarsOff",
                                discount: pcode.coupon.amount_off,
                                discountTotalCents: discountTotalCents,
                                discountTotal: (discountTotalCents * .01).toLocaleString("en-US", {style:"currency", currency:"USD"}),
                                authenticatingCoupon: false,
                            })
    
                        
                       // If everything is valid and the coupon type is a percentage amount off the final fare
                        }else if(pcode.coupon.percent_off && numTimesUsedValid && minimumAmountValid && firstTimeOnlyValid && isValidCustomer){
                            const discountTotalCents = this.state.totalCents * (pcode.coupon.percent_off * .01)
    
                            this.setState({
                                promoCode: pcode.code, 
                                promoCodeID: pcode.id,
                                discountType: "percentOff",
                                discount: pcode.coupon.percent_off,
                                discountTotalCents: discountTotalCents,
                                discountTotal: (discountTotalCents * .01).toLocaleString("en-US", {style:"currency", currency:"USD"}),
                                authenticatingCoupon: false,
                            })
                        // If there are issues
                        }else{
                            if(!minimumAmountValid){
                                this.setState({promoCodeValid: false, promoCodeID: null, promoCodeError: `This coupon requires a minimum fare of ${(pcode.restrictions.minimum_amount * .01).toLocaleString("en-US", {style:"currency", currency:"USD"})}`, authenticatingCoupon: false,})    
                            }else if(!firstTimeOnlyValid){
                                this.setState({promoCodeValid: false, promoCodeID: null, promoCodeError: "This code is only available for your first trip", authenticatingCoupon: false,})
                            }else if(!isValidCustomer){
                                this.setState({promoCodeValid: false, promoCodeID: null, promoCodeError: "This code is unavailable for this account", authenticatingCoupon: false,})
                            }else{
                                this.setState({promoCodeValid: false, promoCodeID: null, promoCodeError: "This code has already been used", authenticatingCoupon: false,})
                            }
                        }
                        
                        // console.log(`Promo code: ${this.state.promoCode} (AKA ID: ${this.state.promoCodeID}) is ${this.state.discount} ${this.state.discountType} the total of ${this.state.total} which is ${this.state.discountTotal} or ${this.state.discountTotalCents} cents off.`)
                        
                    

                // If there were no valid coupons with the code provided
                }else{
                    this.setState({promoCodeValid: false, promoCodeID: null, promoCodeError: "This code is no longer valid", authenticatingCoupon: false,})
                }

            // If server response was not 200
            }else{
                this.setState({
                    promoCode: "",
                    promoCodeID: null,
                    promoCodeError: "",
                    promoCodeActive: false,
                    discountType: null,
                    discount: null,
                    discountTotalCents: null,
                    discountTotal: null,
                    authenticatingCoupon: false,
                })

                switch(data.statusCode){
                    default:
                        this.setState({promoCodeError: "There was an issue applying your promo"})
                        break;
                    case 400:
                        this.setState({promoCodeError: "Promo code cannot be empty"})
                        break;
                    case 429:
                        this.setState({promoCodeError: "Too many attempts made. Try again soon."})
                        break;
                }
                
            }
        }

        
        clearCoupon = ()  => {
            this.setState({
                discount: null,
                discountType: null,
                discountTotalCents: null,
                promoCode: "",
                promoCodeID: null,
                promoCodeError: "",
                promoCodeActive: false,
                authenticatingCoupon: false,
            })
        }


        checkout = async() => {
            const { region, searchedAddress, searchInputValue, daySearched, timeSearched, locationDifferenceWalking } = this.props.navigation.state.params.homeState;
            await this.setState({authenticatingReservation: true})
            await this.checkHiddenOrCancelled()
            await this.checkAvailability()
            const db = firestore();

            // console.log(`Vehicle: ${JSON.stringify(this.state.selectedVehicle)}`)
            // console.log(`Card: ${JSON.stringify(this.state.selectedPayment)}`)

            if(this.state.selectedVehicle && this.state.selectedPayment && this.state.spaceAvailabilityWorks && !this.state.spaceCancelledOrHidden){
                let card = this.state.selectedPayment;
                let vehicle = this.state.selectedPayment;
                // console.log(`${this.props.UserStore.userID} is paying for spot ${this.props.ComponentStore.selectedExternalSpot[0].listingID} with card ${this.state.selectedPayment.PaymentID} and driving a ${this.state.selectedVehicle.Year} ${this.state.selectedVehicle.Make} ${this.state.selectedVehicle.Model}`)
                var d = new Date()

                // Validate card is not expired
                if(card.Year < parseInt(d.getFullYear().toString().slice(2))){
                    console.log("Card expired prior year")
                }else if(card.Year == parseInt(d.getFullYear().toString().slice(2)) && card.Month < d.getMonth() + 1){
                    console.log("Card expired this year")
                }else{
                    // Card Valid

       

                    
                    
                    const hostRef = await db.collection('users').doc(this.props.ComponentStore.selectedExternalSpot[0].hostID);

                    await hostRef.get().then((hostDoc) => {
                        return hostDoc.data();
                    }).then(async (hostDoc) => {
                        
                        try{
                            const { region, searchedAddress, searchInputValue, daySearched, timeSearched, locationDifferenceWalking } = this.props.navigation.state.params.homeState;
                            var today = new Date()
                            let currentYear = today.getMonth() === 11 && daySearched.monthName === "January" ? today.getFullYear() + 1 : today.getFullYear();

                            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

                            // timeSearched[0].label.slice(0,2), timeSearched[0].label.slice(2,4)

                            let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                            // let timeZoneAbbr = new Date().toLocaleTimeString('en-us',{timeZoneName:'short'}).split(' ')[2]

                            

                            
                            
                            let startDate = new Date(currentYear, monthNames.indexOf(daySearched.monthName), daySearched.dateName, timeSearched[0].label.slice(0,2), timeSearched[0].label.slice(2,4));
                            let startDateString = startDate.toLocaleString('en-US', {timezone: timeZone});

                            let endDate = new Date(currentYear, monthNames.indexOf(daySearched.monthName), daySearched.dateName, timeSearched[1].label.slice(0,2), timeSearched[1].label.slice(2,4), 59);
                            let endDateString = new Date(currentYear, monthNames.indexOf(daySearched.monthName), daySearched.dateName, timeSearched[1].label.slice(0,2), timeSearched[1].label.slice(2,4), 59).toLocaleString('en-US', {timezone: timeZone});

                            var paymentIntent = null
                            var transferID = null

                            


                            const ref = db.collection("trips").doc();
                            var currentTime = firestore.Timestamp.now();

                            await this.payForSpace(hostDoc.stripeConnectID, ref.id).then(res => {
                                if(res.statusCode !== 200){
                                    throw `Error ${res.statusCode}: ${res.raw.message}`

                                }else{
                                    if(this.state.discount){
                                        // console.log(res.transferData)
                                        transferID = res.transferData.id

                                        if(Math.round(this.state.totalCents - this.state.discountTotalCents) == 0){
                                            paymentIntent = null
                                            
                                        }else{
                                            paymentIntent = res.data.id
                                        }
                                    }else{
                                        paymentIntent = res.data.id
                                    }
                                }
                            })

                            

                            

                            var obj = {
                                hostID: hostDoc.id,
                                hostName: hostDoc.fullname,
                                hostStripeID: hostDoc.stripeID,
                                isCancelled: false,
                                cancelledBy: null,
                                listingID: this.props.ComponentStore.selectedExternalSpot[0].listingID,
                                listingSubSpaceID: null,
                                payment: this.state.selectedPayment,
                                startTimeUnix: startDate.getTime(),
                                endTimeUnix: endDate.getTime(),
                                price: {
                                    price: this.state.price,
                                    priceCents: this.state.priceCents,
                                    serviceFee: this.state.serviceFee,
                                    serviceFeeCents: this.state.serviceFeeCents,
                                    processingFee: this.state.processingFee,
                                    processingFeeCents: this.state.processingFeeCents,
                                    total: this.state.total,
                                    totalCents: this.state.totalCents,
                                    discount: this.state.discount,
                                    discountType: this.state.discountType,
                                    discountTotal: this.state.discountTotal,
                                    discountTotalCents: this.state.discountTotalCents
                                },
                                paymentIntentID: paymentIntent,
                                transferID: transferID,
                                promoCode: this.state.promoCodeID,
                                refundId: null,
                                tripID: ref.id,
                                updated: currentTime,
                                created: currentTime,
                                vehicle: this.state.selectedVehicle,
                                visitorID: this.props.UserStore.userID,
                                visitorName: this.props.UserStore.fullname,
                                searchedAddress: searchedAddress,
                                searchInputValue: searchInputValue,
                                distanceWalking: locationDifferenceWalking,
                                refundAmt: null,
                                refundAmtCents: null,
                                refundFull: null,
                                refundServiceFee: null,
                                hostCharged: null,
                                hostChargedCents: null,
                                visit: {
                                    day: daySearched,
                                    time: {
                                        timezone: this.props.ComponentStore.selectedExternalSpot[0].timezone,
                                        start: {
                                            label: timeSearched[0].label,
                                            labelFormatted: timeSearched[0].labelFormatted,
                                            unix: startDate.getTime(),
                                            dateString: startDateString,
                                            dateUTC: startDate,
                                        },
                                        end: {
                                            label: timeSearched[1].label,
                                            labelFormatted: timeSearched[1].labelFormatted,
                                            unix: endDate.getTime(),
                                            dateString: endDateString,
                                            dateUTC: endDate,
                                        },
                                    },

                                },
                            }

                            var shortObj = {
                                hostID: hostDoc.id,
                                listingID: this.props.ComponentStore.selectedExternalSpot[0].listingID,
                                listingSubSpaceID: null,
                                id: ref.id,
                                created: currentTime,
                                isCancelled: false,
                                visitorID: this.props.UserStore.userID,
                            }

                            

                            db.collection("trips").doc(ref.id).set(obj)
                            db.collection("listings").doc(this.props.ComponentStore.selectedExternalSpot[0].listingID).collection("trips").doc(ref.id).set(shortObj);
                            db.collection("users").doc(this.props.UserStore.userID).update({
                                trips: firestore.FieldValue.arrayUnion(ref.id),
                                discounts: firestore.FieldValue.arrayUnion(this.state.promoCodeID)
                            })

                            if(this.state.discount){
                                this.props.UserStore.discounts.push(this.state.promoCodeID)
                            }


                            let isToday = this.isToday(startDate);

                            const settings = {
                                method: 'POST',
                                headers: {
                                  Accept: 'application/json',
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    tokens: hostDoc.pushTokens.filter(x => x !== null),
                                    title: `You have a new booking`,
                                    message: `${this.props.UserStore.firstname} ${this.props.UserStore.lastname.split("")[0].toUpperCase()}. booked your space ${isToday ? "today" : daySearched.dayName} at ${timeSearched[0].labelFormatted}.`,
                                    screen: "HostedTrips"
                                })
                              }
                          
                                
                            fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/sendNotification`, settings)
                                
                               
                            
                            
                            await this.setState({authenticatingReservation: false})
                            await this.props.navigation.navigate("ReservationConfirmed", {
                                homeState: {
                                    tripID: obj.tripID,
                                    cost: {
                                        price: this.state.price,
                                        priceCents: this.state.priceCents,
                                        serviceFee: this.state.serviceFee,
                                        serviceFeeCents: this.state.serviceFeeCents,
                                        processingFee: this.state.processingFee,
                                        processingFeeCents: this.state.processingFeeCents,
                                        total: this.state.total,
                                        totalCents: this.state.totalCents,
                                        discountTotalCents: this.state.discountTotalCents,
                                        discountTotal: this.state.discountTotal,
                                        discount: this.state.discount,
                                    },
                                    ...this.props.navigation.state.params.homeState
                                }
                            })
                            
                        }catch(e){
                            this.setState({authenticatingReservation: false})
                            throw e
                        }
                    }).catch(e => {
                        if(e !== null){
                            alert(e)
                        }
                    })




                }
            }else{
                if(!this.state.selectedVehicle){
                    this.setState({selectedVehicleError: "Select/add a vehicle to reserve a space"})
                }else{
                    this.setState({selectedVehicleError: ""})
                }

                if(!this.state.selectedPayment){
                    this.setState({selectedPaymentError: "Select/add a card to reserve a space"})
                }else{
                    this.setState({selectedPaymentError: ""})
                }
                this.setState({authenticatingReservation: false})
            }

            
        }

       nth = (n) => { return["st","nd","rd"][((n+90)%100-10)%10-1]||"th" }

        isToday = (someDate) => {
            const today = new Date()
            return someDate.getDate() == today.getDate() &&
              someDate.getMonth() == today.getMonth() &&
              someDate.getFullYear() == today.getFullYear()
          }

        payForSpace = async (hostStripeID, refID) => {

            const settings = {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount: this.state.discount ? Math.round(this.state.totalCents - this.state.discountTotalCents) : this.state.totalCents,
                visitorID: this.props.UserStore.stripeID,
                description: `Visit id: ${refID}`,
                cardID: this.state.selectedPayment.StripePMID,
                customerEmail: this.props.UserStore.email,
                transactionFee: this.state.serviceFeeCents + this.state.processingFeeCents,
                hostID: hostStripeID,
                discount: this.state.discount ? true : false,
                discountAmount: Math.round(this.state.discountTotalCents)
              })
            }

   

            try{
              
              const fetchResponse = await fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/payForSpace`, settings)
              const data = await fetchResponse.json();
              return data;
            }catch(e){
              return e
            }    
          }

      render(){
          const {width, height} = Dimensions.get("window");
          const { region, searchedAddress, searchInputValue, daySearched, timeSearched, locationDifferenceWalking } = this.props.navigation.state.params.homeState;

          let vehicleArray = this.props.UserStore.vehicles.map(vehicle => {
            return(
                <RadioButton  key ={vehicle.VehicleID} style={{paddingVertical: 6}} id={vehicle.VehicleID} selectItem={() => this.setActiveVehicle(vehicle, false)}>
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

              return(
                <RadioButton key={payment.PaymentID} style={{paddingVertical: 6}} id={payment.PaymentID} disabled={!cardValid} selectItem={() => this.setActivePayment(payment, false)}>
                    <View style={{flex: 1, alignItems: 'flex-start'}}>
                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                            <Text style={{fontSize: 16, marginRight: 16, color: cardValid ? Colors.cosmos900 : Colors.cosmos300}}>{`••••••••••••${payment.Number}`}</Text> 
                            <Icon 
                                iconName={payment.CardType ? 'cc-' + payment.CardType : 'credit-card'}
                                iconLib="FontAwesome"
                                iconColor={cardValid ? Colors.cosmos900 : Colors.cosmos300}
                                iconSize={20}
                                style={{ marginLeft: "auto"}}
                             />
                        </View>
                        
                        <Text style={cardValid ? {fontSize: 12} : {fontSize: 12, color: Colors.hal500}} >{cardValid ? `Expires ${payment.Month}/${payment.Year}` : "Expired"}</Text>
                    </View>
                </RadioButton>
              )
          })

            // console.log(this.state.selectedVehicle)

        //   console.log(this.state.selectedVehicle ? this.state.selectedVehicle.VehicleID : null)
        //   console.log(`hours spent: ${this.state.hoursSpent} and minutes spent: ${this.state.minutesSpent}`)

          return(
              <ScrollView
                stickyHeaderIndices={searchedAddress ? [2] : [1]}
                style={{backgroundColor: 'white'}}
              >
                    <MapView
                        provider={MapView.PROVIDER_GOOGLE}
                        mapStyle={NightMap}
                        style={{width: width, aspectRatio:21/9}}
                        region={{
                            latitude: this.props.ComponentStore.selectedExternalSpot[0].region.latitude,
                            longitude: this.props.ComponentStore.selectedExternalSpot[0].region.longitude,
                            latitudeDelta: this.props.ComponentStore.selectedExternalSpot[0].region.latitudeDelta,
                            longitudeDelta: this.props.ComponentStore.selectedExternalSpot[0].region.longitudeDelta,
                            }}
                        pitchEnabled={false} 
                        rotateEnabled={false} 
                        zoomEnabled={false} 
                        scrollEnabled={false}
                    >
                        <Marker 
                            coordinate={{
                                latitude: this.props.ComponentStore.selectedExternalSpot[0].region.latitude,
                                longitude: this.props.ComponentStore.selectedExternalSpot[0].region.longitude
                            }}   
                        />
                    </MapView>
                    {searchedAddress ? 
                    <View style={[styles.container, {paddingVertical: 8, display: 'flex', flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.apollo700}]}>
                        <Icon 
                            iconName="walk"
                            iconColor={Colors.mist300}
                            iconSize={20}
                            iconLib="MaterialCommunityIcons"
                        />
                        {locationDifferenceWalking.duration.split(" ")[1] === 'mins' || locationDifferenceWalking.duration.split(" ")[1] === 'min' ? 
                            <Text numberOfLines={1} style={{color: Colors.mist300, marginLeft: 8, flex: 1}}>{locationDifferenceWalking.duration} to {searchInputValue}</Text>
                        :
                            <Text numberOfLines={1} style={{color: Colors.mist300, marginLeft: 8, flex: 1}}>Longer than 1 hour to {searchInputValue}</Text>
                        }
                    </View>
                    : null}


                    {/* Date and Time */}
                    <View style={[styles.container, {backgroundColor: 'white', paddingBottom: 8}]}>
                        <Text type="light" numberOfLines={1} style={{marginTop: 16, fontSize: 24, textAlign: 'center'}}>{new Date().getDay() === daySearched.dayValue ? "Today" : daySearched.dayName}, {daySearched.monthName} {daySearched.dateName}{this.nth(daySearched.dateName)}</Text>

                        <View style={{flexDirection: 'row', alignItems: "flex-end", justifyContent: 'space-between', marginTop: 16}}>
                            <View style={{flexDirection: 'column', alignItems: 'center', flex: 1}}>
                                
                                <Text type="light" numberOfLines={1} style={{fontSize: 18}}>Arrival</Text>
                                <Text numberOfLines={1} style={{fontSize: 20, color: Colors.tango700}}>{this.convertToCommonTime(timeSearched[0].label)} {this.state.inSameTimezone ? null : this.props.ComponentStore.selectedExternalSpot[0].timezone.timeZoneAbbr}</Text>
                            </View>
                            <Icon 
                                iconName="arrow-right"
                                iconColor={Colors.tango700}
                                iconSize={20}
                                iconLib="MaterialCommunityIcons"
                            />
                            <View style={{flexDirection: 'column', alignItems: 'center', flex: 1}}>
                                <Text type="light" numberOfLines={1} style={{fontSize: 18}}>Departure</Text>
                                <Text numberOfLines={1} style={{fontSize: 20, color: Colors.tango700}}>{this.convertToCommonTime(timeSearched[1].label)} {this.state.inSameTimezone ? null : this.props.ComponentStore.selectedExternalSpot[0].timezone.timeZoneAbbr}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Vehicles */}
                    
                    <View style={[styles.container, {marginTop: 16}]}>
                        <Text type="medium" numberOfLines={1} style={{fontSize: 16}}>Vehicle</Text>
                        { this.state.selectedVehicleError === "" ? null :
                        <Text numberOfLines={1} style={{fontSize: 16, color: Colors.hal500}}>{this.state.selectedVehicleError}</Text>
                        }
                        {this.props.UserStore.vehicles.length > 0 ? 
                            <RadioList activeItem={this.state.selectedVehicle ? this.state.selectedVehicle.VehicleID : null} selectItem={(option) => this.setActiveVehicle(option, true)}>
                                {vehicleArray}
                            </RadioList>
                        : null}
                        <Button onPress={() => this.props.navigation.navigate("AddVehicle")} style = {{backgroundColor: "rgba(255, 193, 76, 0.3)", marginTop: 16, height: 40, paddingVertical: 0}} textStyle={{color: Colors.tango900, fontSize: 16}}>+ Add Vehicle</Button>
                    </View>
                    

                    {/* Payments */}
                    
                        <View style={[styles.container, {marginTop: 16}]}>
                            <Text type="medium" numberOfLines={1} style={{fontSize: 16}}>Payments</Text>
                            { this.state.selectedPaymentError === "" ? null :
                                <Text numberOfLines={1} style={{fontSize: 16, color: Colors.hal500}}>{this.state.selectedPaymentError}</Text>
                            }
                            {this.props.UserStore.payments.length > 0 ? 
                                <RadioList activeItem={this.state.selectedPayment ? this.state.selectedPayment.PaymentID : null} selectItem={(option) => this.setActivePayment(option, true)}>
                                    {paymentsArray}
                                </RadioList>
                            : null}
                        <Button onPress={() => this.props.navigation.navigate("AddPayment")} style = {{backgroundColor: "rgba(255, 193, 76, 0.3)", marginTop: 16, height: 40, paddingVertical: 0}} textStyle={{color: Colors.tango900, fontSize: 16}}>+ Add Payment</Button>
                        </View>
                    

                    {/* Price Breakdown */}
                    <View style={[styles.container, {marginTop: 32}]}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                            <Text>Parking Fare</Text>
                            <Text>{this.state.price}</Text>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                            <Text>Service Fee</Text>
                            <Text>{this.state.serviceFeeCents === 0 ? "Free" : this.state.serviceFee}</Text>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                            <Text>Processing Fee</Text>
                            <Text>{this.state.processingFeeCents === 0 ? "Free" : this.state.processingFee}</Text>
                        </View>
                        {this.state.discount ? 
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                                <Text>Discount</Text>
                                <Text>{this.state.discountTotal}</Text>
                            </View>
                        : null}
                        <View style={{display: 'flex', flexDirection: 'row', marginTop: 8, alignItems: 'flex-start', height: 72}}>
                            <Input 
                                placeholder='Promo Code (optional)'         
                                // label="Space Name"
                                name="promo code"
                                editable={this.state.discount ? false : true}               
                                onChangeText= {(promoCode) => this.setState({promoCode})}
                                value={this.state.promoCode}
                                maxLength = {32}
                                keyboardType='default'
                                error={this.state.promoCodeError}
                                style={{borderBottomWidth: 0, flex: 3, marginRight: 16}}
                                containerType="fullBorder"
                            />
                            <Button 
                                style={this.state.discountTotalCents ? {backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: Colors.hal500, flex: 1, height: 40, marginTop: 5, paddingVertical: 0} : {backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: Colors.tango900, flex: 1, height: 40, marginTop: 5, paddingVertical: 0}} 
                                textStyle={this.state.discountTotalCents ? {color: Colors.hal500, fontSize: 16} : {color: Colors.tango900, fontSize: 16}} 
                                onPress={this.state.discountTotalCents ?  () => this.clearCoupon() : () => this.checkCoupon(this.state.promoCode)}>
                                    {this.state.authenticatingCoupon ? null :this.state.discountTotalCents ? "Clear" : "Apply"}
                            </Button>
                        </View>
                        <View
                            style={{
                                marginBottom: 16,
                                marginTop: this.state.promoCodeError !== "" ? 24 : 4,
                                borderBottomColor: Colors.cosmos300,
                                borderBottomWidth: 1,
                            }}
                        />
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                            <Text type="medium" numberOfLines={1} style={{fontSize: 24}}>Total (USD)</Text>
                            <View style={{display: 'flex', flexDirection: 'row'}}>
                                <Text type="medium" numberOfLines={1} style={{fontSize: 24}}>{this.state.discountTotalCents ? ((this.state.totalCents - this.state.discountTotalCents) * .01).toLocaleString("en-US", {style:"currency", currency:"USD"}): this.state.total}</Text>
                            </View>
                        </View>
                        
                        <Button onPress={() => this.checkout()} style = {this.state.spaceAvailabilityWorks && !this.state.spaceCancelledOrHidden ? styles.activeButton : styles.disabledButton} disabled={!this.state.spaceAvailabilityWorks || this.state.spaceCancelledOrHidden || this.state.authenticatingReservation} textStyle={this.state.spaceAvailabilityWorks && !this.state.spaceCancelledOrHidden ? {color: 'white'} : {color: Colors.cosmos300}}>{this.state.spaceAvailabilityWorks && !this.state.spaceCancelledOrHidden ? this.state.authenticatingReservation ? null : "Reserve Space" : this.state.spaceCancelledOrHidden ? `Space No Longer Available` :`Space No Longer Available`}</Button>
                        <Text style={{fontSize: 12, lineHeight: Platform.OS === 'ios' ? 16 : 18}}>For more information in regards to our return policy or currency conversion, please visit our <Text style={{fontSize: 12, color: Colors.tango900}} onPress={() => this.props.navigation.navigate("TOS")}>Terms of Service</Text>. If you have a question, or you do not recall booking this parking experience, please contact us at support@riive.net.</Text>
                    </View>
                    
                </ScrollView>
                
          )
      }
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
    },
    activeButton: {
        backgroundColor: Colors.tango700, 
        height: 48, 
        marginTop: 36, 
        marginBottom: 24
    },
    disabledButton:{
        backgroundColor: Colors.mist900, 
        height: 48, 
        marginTop: 36, 
        marginBottom: 24
    }
})

export default reserveSpace