import React, { Component } from 'react';
import { Platform, Animated, Dimensions, StatusBar, ScrollView, View, StyleSheet, ActivityIndicator } from 'react-native';





import Text from '../components/Txt'
import Button from '../components/Button'
import Icon from '../components/Icon'
import Colors from '../constants/Colors'

import MapView, {Marker} from 'react-native-maps';
import DayMap from '../constants/DayMap'
import NightMap from '../constants/NightMap'

// import { RadioButton } from 'react-native-paper';
import RadioList from '../components/RadioList'
import RadioButton from '../components/RadioButton'


import * as firebase from 'firebase/app';
import firestore from '@react-native-firebase/firestore';


//MobX Imports
import {inject, observer} from 'mobx-react/native'

    
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
            
            serviceFeePercentage: .15, 

            price: null,
            priceCents: null,
            serviceFee: null,
            serviceFeeCents: null,
            processingFee: null,
            processingFeeCents: null,
            total: null,
            totalCents: null,

            selectedVehicle: null,
            selectedPayment: null,

            
            inSameTimezone: false,

            spaceAvailabilityWorks: true,
            authenticatingReservation: false,
        }
        
    }

    async componentDidMount(){
        const { timeSearched } = this.props.navigation.state.params.homeState;
        await this.getDiffHours(timeSearched[0].label, timeSearched[1].label)

        await this.getPrice();

       
        // Check if space is in same timezone as current device
        if(this.props.ComponentStore.selectedExternalSpot[0].timezone.offsetValue + new Date().getTimezoneOffset()/60 === 0){
            this.setState({inSameTimezone: true})
        }

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


        this._isMounted = true;
        this._navListener = this.props.navigation.addListener('didFocus', () => {
           StatusBar.setBarStyle('dark-content', true);
           Platform.OS === 'android' && StatusBar.setBackgroundColor('white');
         });

         
  
         
      }

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
                 // If specific time slot is marked unavailable, we will check it
                 if(!data.available){
                    // Check if start time is out of bounds
                    if(parseInt(data.start) >= parseInt(timeSearched[0].label) && parseInt(data.start) <= parseInt(timeSearched[1].label)){
                        // console.log(`Start value ${data.start} is invalid within the bounds of ${this.state.timeSearched[0].label} and ${this.state.timeSearched[1].label}`)
                        worksArray.push(false)
            
                        
                    }
                    // Check if end time is out of bounds
                    else if(parseInt(data.end) >= parseInt(timeSearched[0].label) && parseInt(data.start) <= parseInt(timeSearched[1].label)){
                        worksArray.push(false)
                  
                       
                        // console.log(`End value ${data.end} is invalid within the bounds of ${this.state.timeSearched[0].label} and ${this.state.timeSearched[1].label}`)
                    // If both start and end time don't interfere with filtered time slots
                    }else{
                        worksArray.push(true)
       
                        // console.log(`Time slot ${data.id} is marked unavailable but works since ${data.start} and ${data.end} are not within the bounds of ${this.state.timeSearched[0].label} and ${this.state.timeSearched[1].label}`)
                    }
                   
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
                                    worksArray.push(false)
                                    break;
                                
                                // if a visit end is before a start time and after end time
                                }else if(parseInt(data.visit.time.end.label) >= parseInt(timeSearched[0].label) && parseInt(data.visit.time.end.label) <= parseInt(timeSearched[1].label)){
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


            var dollarsServiceFee = price * this.state.serviceFeePercentage / 100 > 1.75 ? (price * this.state.serviceFeePercentage / 100) : 1.75;
            var dollarsServiceFeeCents = price * this.state.serviceFeePercentage > 175 ? Math.ceil(price * this.state.serviceFeePercentage) : 175;
            dollarsServiceFee = dollarsServiceFee.toLocaleString("en-US", {style:"currency", currency:"USD"});

            var dollarsProcessingFee = ((((price * this.state.serviceFeePercentage) * .029) + 30) / 100);
            var dollarsProcessingFeeCents = Math.ceil(((price * this.state.serviceFeePercentage) * .029) + 30)
            dollarsProcessingFee = dollarsProcessingFee.toLocaleString("en-US", {style:"currency", currency:"USD"});


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


        checkout = async() => {
            const { region, searchedAddress, searchInputValue, daySearched, timeSearched, locationDifferenceWalking } = this.props.navigation.state.params.homeState;
            await this.setState({authenticatingReservation: true})
            await this.checkAvailability()
            const db = firestore();

            if(this.state.selectedVehicle && this.state.selectedPayment && this.state.spaceAvailabilityWorks){
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


                            const ref = db.collection("trips").doc();
                            var currentTime = firestore.Timestamp.now();

                            

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
                                },
                                tripID: ref.id,
                                updated: currentTime,
                                vehicle: this.state.selectedVehicle,
                                visitorID: this.props.UserStore.userID,
                                visitorName: this.props.UserStore.fullname,
                                searchedAddress: searchedAddress,
                                searchInputValue: searchInputValue,
                                distanceWalking: locationDifferenceWalking,
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

                            db.collection("trips").doc(ref.id).set(obj)
                            db.collection("listings").doc(this.props.ComponentStore.selectedExternalSpot[0].listingID).update({
                                visits: firestore.FieldValue.arrayUnion(ref.id)
                            });
                            db.collection("users").doc(this.props.UserStore.userID).update({
                                trips: firestore.FieldValue.arrayUnion(ref.id)
                            })

                            const settings = {
                                method: 'POST',
                                headers: {
                                  Accept: 'application/json',
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    tokens: hostDoc.pushTokens.filter(x => x !== null),
                                    title: `You have a new booking`,
                                    message: `${this.props.UserStore.firstname} ${this.props.UserStore.lastname.split("")[0].toUpperCase()}. booked your space at ${timeSearched[0].labelFormatted}.`,
                                    screen: "HostedTrips"
                                })
                              }
                          
                                
                            fetch('https://us-central1-riive-parking.cloudfunctions.net/sendNotification', settings)
                                
                               
                            
                            
                           
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
                                    },
                                    ...this.props.navigation.state.params.homeState
                                }
                            })
                            
                        }catch(e){
                            this.setState({authenticatingReservation: false})
                            throw e
                        }
                    }).catch(e => {
                        console.log(e)
                    })




                }
            }

            
        }

        payForSpace = async (hostStripeID) => {
            // console.log(this.props.ComponentStore.selectedExternalSpot[0].hostID)

            const settings = {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount: this.state.totalCents,
                customer: this.props.UserStore.stripeID,
                cardID: this.state.selectedPayment.StripeID,
                customerEmail: this.props.UserStore.email,
                transactionFee: this.state.serviceFeeCents + this.state.processingFeeCents,
                hostID: hostStripeID
              })
            }
            try{
              
              const fetchResponse = await fetch('https://us-central1-riive-parking.cloudfunctions.net/payForSpace', settings)
              const data = await fetchResponse.json();
              return data;
            }catch(e){
              alert(e);
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
              return(
                <RadioButton key={payment.PaymentID} style={{paddingVertical: 6}} id={payment.PaymentID} selectItem={() => this.setActivePayment(payment, false)}>
                    <View style={{flex: 1, alignItems: 'flex-start'}}>
                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                            <Text style={{fontSize: 16, marginRight: 16}}>{`••••••••••••${payment.Number}`}</Text> 
                            <Icon 
                                iconName={payment.CardType ? 'cc-' + payment.CardType : 'credit-card'}
                                iconLib="FontAwesome"
                                iconColor={Colors.cosmos900}
                                iconSize={20}
                                style={{ marginLeft: "auto"}}
                             />
                        </View>
                        
                        <Text style={{fontSize: 12}} >{`Expires ${payment.Month}/${payment.Year}`}</Text>
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
                        <Text type="light" numberOfLines={1} style={{marginTop: 16, fontSize: 24, textAlign: 'center'}}>{new Date().getDay() === daySearched.dayValue ? "Today" : daySearched.dayName}, {daySearched.monthName} {daySearched.dateName}{daySearched.dateName.toString().split("")[daySearched.dateName.toString().split("").length - 1] == 1 && (daySearched.dateName > 20 || daySearched < 3)  ? "st" : daySearched.dateName == 2  && (daySearched.dateName > 20 || daySearched < 3) ? "nd" : "th"}</Text>

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
                        {this.props.UserStore.vehicles.length > 0 ? 
                            <RadioList activeItem={this.state.selectedVehicle ? this.state.selectedVehicle.VehicleID : null} selectItem={(option) => this.setActiveVehicle(option, true)}>
                                {vehicleArray}
                            </RadioList>
                        : null}
                        <Button onPress={() => this.props.navigation.navigate("AddVehicle")} style = {{backgroundColor: "rgba(255, 193, 76, 0.3)", marginTop: 16, height: 40}} textStyle={{color: Colors.tango900, fontSize: 14}}>+ Add Vehicle</Button>
                    </View>
                    

                    {/* Payments */}
                    
                        <View style={[styles.container, {marginTop: 16}]}>
                            <Text type="medium" numberOfLines={1} style={{fontSize: 16}}>Payments</Text>
                            {this.props.UserStore.payments.length > 0 ? 
                                <RadioList activeItem={this.state.selectedPayment ? this.state.selectedPayment.PaymentID : null} selectItem={(option) => this.setActivePayment(option, true)}>
                                    {paymentsArray}
                                </RadioList>
                            : null}
                        <Button onPress={() => this.props.navigation.navigate("AddPayment")} style = {{backgroundColor: "rgba(255, 193, 76, 0.3)", marginTop: 16, height: 40}} textStyle={{color: Colors.tango900, fontSize: 14}}>+ Add Payment</Button>
                        </View>
                    

                    {/* Price Breakdown */}
                    <View style={[styles.container, {marginTop: 32}]}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                            <Text>Parking Fare</Text>
                            <Text>{this.state.price}</Text>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                            <Text>Service Fee</Text>
                            <Text>{this.state.serviceFee}</Text>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                            <Text>Processing Fee</Text>
                            <Text>{this.state.processingFee}</Text>
                        </View>
                        <View
                            style={{
                                marginTop: 8,
                                borderBottomColor: Colors.cosmos300,
                                borderBottomWidth: 1,
                            }}
                        />
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                            <Text type="medium" numberOfLines={1} style={{fontSize: 24}}>Total (USD)</Text>
                            <Text type="medium" numberOfLines={1} style={{fontSize: 24}}>{this.state.total}</Text>
                        </View>
                        <Button onPress={() => this.checkout()} style = {this.state.spaceAvailabilityWorks ? styles.activeButton : styles.disabledButton} disabled={!this.state.spaceAvailabilityWorks || this.state.authenticatingReservation} textStyle={this.state.spaceAvailabilityWorks ? {color: 'white'} : {color: Colors.cosmos300}}>{this.state.spaceAvailabilityWorks ? "Reserve Space" : `Booked at ${timeSearched[0].labelFormatted}`}</Button>
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