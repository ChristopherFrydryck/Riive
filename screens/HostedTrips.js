import React, {Component, createRef} from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, RefreshControl, SectionList, ActivityIndicator, Modal, SafeAreaView, Linking, TouchableOpacity, Alert} from 'react-native'
import Button from '../components/Button'
import Text from '../components/Txt'
import Icon from '../components/Icon'
import RadioList from '../components/RadioList'
import RadioButton from '../components/RadioButton'
import FloatingCircles from '../components/FloatingCircles'
import Image from '../components/Image'
import Colors from '../constants/Colors'

import MapView, {Marker} from 'react-native-maps';
import ActionSheet from "react-native-actions-sheet";
import config from 'react-native-config'
import DayMap from '../constants/DayMap'
import NightMap from '../constants/NightMap'

import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import 'firebase/auth';
import 'firebase/firestore';

//MobX Imports
import {inject, observer} from 'mobx-react/native'
import ClickableChip from '../components/ClickableChip'

const actionSheetRef = createRef();

@inject("UserStore", "ComponentStore")
@observer
export default class HostedTrips extends Component{
   constructor(props){
        super(props);
        this.state = {
            isRefreshing: false,
            visits: [],
            lastRenderedItem: null,
            selectedVisit: null,
            selectedPayment: null,
            visitModalVisible: false,
            cardModalVisible: false,
            cancellingTrip: false,
            // secitonlist stuff
            
        }
        // this._visits = [];
        this.scrollingList = false
        this.VisitModal = this.VisitModal.bind(this)
   }

   componentDidMount(){
        // Set Status Bar page info here!
        this._navListener = this.props.navigation.addListener('didFocus', () => {
            StatusBar.setBarStyle('dark-content', true);
            Platform.OS === 'android' && StatusBar.setBackgroundColor('white');
            this.updateVisits();
        });

        

        
    }

    showCancellationModal = () => {

        
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
        }else{
            this.setState({selectedPayment: null})
        }
        this.setState({cardModalVisible: true})
 
     


        // Alert.alert(
        //                 'Canceling a Guest Trip',
        //                 `Cancelling a trip for an upcoming guest will refund the entire amount to the guest and you will be charged ${amountChargedToHost}. If this day/time does not work in the future, you can update your space availability under Edit Details or manage your space from your profile.`,
        //                 [
        //                 { text: 'Back' },
        //                 { text: 'Cancel Trip', onPress: () => this.cancelTrip() },
                        
        //                 ]
        //             )
            
                

        
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

    cancelTrip = () => {

        let { serviceFeeCents, processingFeeCents, priceCents } = this.state.selectedVisit.visit.price

        this.setState({cancellingTrip: true})


        let amountChargedToHostCents = serviceFeeCents + processingFeeCents
        let amountChargedToHost = (amountChargedToHostCents/100).toLocaleString("en-US", {style:"currency", currency:"USD"})

        let refundAmountCents = serviceFeeCents + processingFeeCents + priceCents
        let refundAmount = (refundAmountCents/100).toLocaleString("en-US", {style:"currency", currency:"USD"})

        const timeDiffEnd = this.state.selectedVisit.visit.visit.time.end.unix - new Date().getTime()
        const timeDiffStart = this.state.selectedVisit.visit.visit.time.start.unix - new Date().getTime()

        let isInPast = this.state.selectedVisit.isInPast
        let isCurrentlyActive = this.state.selectedVisit.current

        var currentTime = firestore.Timestamp.now();
        var visitorPushTokens = null;
       

        if(!isInPast && this.state.selectedPayment !== null){
            const db = firestore();
            let refundID = null;
            db.collection('trips').doc(this.state.selectedVisit.visit.tripID).get().then(async(trip) => {
                if(!trip.exists){
                    alert("Trip not found.")
                }else{

                    // let date = new Date();
                    // var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    // var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    // let today = date.getDate();
                    // let month = months[date.getMonth()]
                    // let year = date.getFullYear();

                    // this.state.selectedVisit.visit.visit.day.dateName === today
                    // this.state.selectedVisit.visit.visit.day.year === year
                    // this.state.seletedVisit.visit.visit.day.monthName === month

                    // const isToday = true;

                    // console.log(isToday)

                    try{
                        await this.collectPayment(amountChargedToHostCents).then(res => {
                            if(res.statusCode !== 200){
                                throw res.raw.message
                            }
                        }).then(() => {
                            return this.refundTrip(refundAmountCents, true)
                        }).then(res => {
                            if(res.statusCode !== 200){
                                throw res.message
                            }else{
                               refundID = res.data.id
                            }
                        }).then(() => {
                            db.collection('trips').doc(this.state.selectedVisit.visit.tripID).update({
                                isCancelled: true,
                                refundAmt: refundAmount,
                                refundAmtCents: refundAmountCents,
                                refundFull: true,
                                refundServiceFee: true,
                                refundId: refundID,
                                hostCharged: amountChargedToHost,
                                hostChargedCents: amountChargedToHostCents,
                                cancelledBy: "host",
                                updated: currentTime
                            })
                        }).then(async() => {
                            await db.collection("users").doc(trip.data().visitorID).get().then((visitor) => {
                                if(!visitor.exists){
                                    throw "Host does not exist"
                                }else{
                                    visitorPushTokens = visitor.data().pushTokens
                                }
                             })
                        }).then(() => {

                            let date = new Date();
                            var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                            var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                            let today = date.getDate();
                            let month = months[date.getMonth()]
                            let year = date.getFullYear();

                           
                            const settings = {
                                method: 'POST',
                                headers: {
                                  Accept: 'application/json',
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    tokens: visitorPushTokens.filter(x => x !== null),
                                    title: "Cancelled upcoming trip",
                                    message: `The host of ${this.state.selectedVisit.listing.spaceName} has cancelled your upcoming visit.`,
                                    screen: "HostedTrips"
                                })
                              }
                          
                                
                            fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/sendNotification`, settings)

                            
                        }).then(() => {
                            this.updateVisits();
                            this.setState({visitModalVisible: false, cancellingTrip: false})
                        }).catch(e => {
                            this.setState({cancellingTrip: false})
                            throw e
                        })
                    }catch(e){
                        alert(e)
                    }
                }
            })
        }else{
            this.setState({cancellingTrip: false})
            if(isInPast){
                alert("Failed to cancel this trip. Ended since cancellation.")
            }else{
                alert("Select or add a payment to cancel this trip.")
            }
           
        }
    }

    refundTrip = async (amountRefund, refundFee) => {
            

        const settings = {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntent: this.state.selectedVisit.visit.paymentIntentID,
            amount: amountRefund,
            refundApplicationFee: refundFee,
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


      collectPayment = async (total) => {

    

        const settings = {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: total,
            visitorID: this.props.UserStore.stripeID,
            description: `Collected money from host on visit ${this.state.selectedVisit.visit.tripID}`,
            paymentID: this.state.selectedPayment.StripePMID,
            customerEmail: this.props.UserStore.email,
          })
        }

        try{
          
          const fetchResponse = await fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/collectPayment`, settings)
          const data = await fetchResponse.json();
          return data;
        }catch(e){
          return e
        }    
      }



    updateVisits = () => {
        try{
            this.setState({isRefreshing: true})
            this.scrollingList = false
            const db = firestore();
            // console.log(`Fetching Original Data on ${Platform.OS}`)

            var date = new Date()
            var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            let today = date.getDate();
            let month = months[date.getMonth()]
            let year = date.getFullYear();


    
            var spaceVisits = db.collection("trips").where("hostID", "==", this.props.UserStore.userID).orderBy("endTimeUnix", "desc").limit(6)
            // spaceVisits = spaceVisits.where("isCancelled", '==', false)

            var visits = [];
            

            spaceVisits.get().then( async(spaceData) => {

                await this.setState({lastRenderedItem: spaceData.docs[spaceData.docs.length-1]})

                for(doc of spaceData.docs){
                    const listingCollection = db.collection("listings").doc(doc.data().listingID)

                    const isToday = doc.data().visit.day.dateName === today && doc.data().visit.day.year === year && doc.data().visit.day.monthName === month;

                    await listingCollection.get().then(listing => {
                        return listing.data()
                    }).then(listing => {

                        if(isToday){
                            var title = "Today"
                        }else{
                            var title = `${days[doc.data().visit.day.dayValue]}, ${doc.data().visit.day.monthName} ${doc.data().visit.day.dateName} ${doc.data().visit.day.year}`
                        }

                        const timeDiffEnd = doc.data().visit.time.end.unix - new Date().getTime()
                        const timeDiffStart = doc.data().visit.time.start.unix - new Date().getTime()
                        

                        let isInPast = timeDiffEnd != Math.abs(timeDiffEnd)
                        let isCurrentlyActive = timeDiffStart != Math.abs(timeDiffStart) && !isInPast

                        let visitData = {listing: listing, isInPast: isInPast, current: isCurrentlyActive, visit: doc.data()}

                        if(visits.some(x => x.title === title)){
                            let visitIndex = visits.findIndex(i => i.title === title)
                            visits[visitIndex].data.push(visitData)
                            for(let i = 0; i < visits.length; i++){
                                visits[i].data.sort((a, b) => a.visit.isCancelled - b.visit.isCancelled)
                            }
                        }else{
                            visits.push({title: title, isInPast: isInPast, data: [visitData]})
                        } 
                    })               
                }

                // Sort each day by start time
                // visits.forEach(x => {
                //     x.data.sort((a, b) => a.visit.visit.time.start.unix - b.visit.visit.time.start.unix)
                // })

                
                
                return(visits)

                
            }).then(arrays => {
                let a = arrays
                this.setState({isRefreshing: false, visits: a})
                this.scrollingList = true;
            })
        }catch(e){
            alert(e)
            this.setState({isRefreshing: false})
            this.scrollingList = true;
        }

    }

    _onMomentumScrollBegin = () => {
        // console.log(`Scrolling on ${Platform.OS}`)
        this.scrollingList = true;
    }

    loadMoreData = () => {
        if (this.scrollingList && !this.state.isRefreshing && this.state.lastRenderedItem) {
            try{
                // console.log(`Loading More Data on ${Platform.OS}`)
                this.setState({isRefreshing: true})
                this.scrollingList = false;
                const db = firestore();
        
                var date = new Date()
                var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                let today = date.getDate();
                let month = months[date.getMonth()]
                let year = date.getFullYear();
            

                var spaceVisits = db.collection("trips").where("hostID", "==", this.props.UserStore.userID).orderBy("endTimeUnix", "desc").limit(20)

                var visits = this.state.visits;
            
                    spaceVisits.startAfter(this.state.lastRenderedItem).get().then( async(nextData) => {
                        await this.setState({lastRenderedItem: nextData.docs[nextData.docs.length-1]})

                        for(doc of nextData.docs){
                            const listingCollection = db.collection("listings").doc(doc.data().listingID)

                            const isToday = doc.data().visit.day.dateName === today && doc.data().visit.day.year === year && doc.data().visit.day.monthName === month;

                            await listingCollection.get().then(listing => {
                                    return listing.data()
                            }).then(listing => {
                                
                                if(isToday){
                                    var title = "Today"
                                }else{
                                    var title = `${days[doc.data().visit.day.dayValue]}, ${doc.data().visit.day.monthName} ${doc.data().visit.day.dateName} ${doc.data().visit.day.year}`
                                }
            
                                const timeDiffEnd = doc.data().visit.time.end.unix - new Date().getTime()
                                const timeDiffStart = doc.data().visit.time.start.unix - new Date().getTime()

            
                                let isInPast = timeDiffEnd != Math.abs(timeDiffEnd)
                                let isCurrentlyActive = timeDiffStart != Math.abs(timeDiffStart) && !isInPast
            
                                let visitData = {listing: listing, isInPast: isInPast, current: isCurrentlyActive, visit: doc.data()}
            
                                if(visits.some(x => x.title === title)){
                                    let visitIndex = visits.findIndex(i => i.title === title)
                                    visits[visitIndex].data.push(visitData)
                                    for(let i = 0; i < visits.length; i++){
                                        visits[i].data.sort((a, b) => a.visit.isCancelled - b.visit.isCancelled)
                                    }
                                }else{
                                    visits.push({title: title, isInPast: isInPast, data: [visitData]})
                                } 
                            })               
                        }
                        // Sort each day by start time
                        // visits.forEach(x => {
                        //     x.data.sort((a, b) => a.visit.visit.time.start.unix - b.visit.visit.time.start.unix)
                        // })

                        
                        
                        return(visits)
                    }).then(arrays => {
                        let a = arrays
                        this.setState({isRefreshing: false, visits: a})
                        this.scrollingList = true;
                    })
            }catch(e){
                alert(e)
                this.setState({isRefreshing: false})
                this.scrollingList = true;
            }
        }
    };

    

    
    renderVisit = (data) => {
        const {visit, listing, isInPast, current} = data;
        const {isCancelled} = visit
    

        const visitorName = `${visit.visitorName.split(" ")[0]} ${visit.visitorName.split(" ")[1].slice(0,1)}.`
        return(

            <TouchableOpacity  style={styles.visitCard} onPress={() => this.setState({selectedVisit: data, visitModalVisible: true})}>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <View style={{borderRadius: 4, overflow: 'hidden',}}>
                    {!isCancelled ? 
                            <View style={{position: 'absolute', zIndex: 9, backgroundColor: 'white', top: 4, left: 4, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4}}>
                                <Text>{visit.price.price}</Text>
                            </View>
                        : null }
                        <Image 
                                aspectRatio={1/1}
                                source={{uri: listing.photo}}
                                height={100}
                                style={{shadowColor: '#000', 
                                shadowOpacity: 0.6, 
                                shadowOffset:{width: 0, height: 0}, 
                                shadowRadius: 3, 
                                elevation: 0,}}
                                resizeMode={'cover'}
                        /> 
                    </View>
                 <View style={{flex: 1, marginHorizontal: 8}}>
                    <Text numberOfLines={1} ellipsizeMode='tail' style={{fontSize: 18}}>{listing.spaceName}</Text>
                    {isCancelled ? 
                      <Text type="Medium" numberOfLines={1} ellipsizeMode='tail' style={{color: Colors.hal500}}>Cancelled by {visit.cancelledBy === 'host' ? 'you' : 'guest'}</Text>
                    : 
                      <Text numberOfLines={1} ellipsizeMode='tail' style={{color: Colors.cosmos700}}>Visited by {visitorName}</Text>
                    }
                    {isCancelled ? 
                        <Text numberOfLines={1} ellipsizeMode='tail' style={{color: "#adadad", textDecorationLine: "line-through"}}>{visit.visit.time.start.labelFormatted} - {visit.visit.time.end.labelFormatted}</Text> 
                        : 
                        <Text numberOfLines={1} ellipsizeMode='tail' style={{color: Colors.cosmos700}}>{visit.visit.time.start.labelFormatted} - {visit.visit.time.end.labelFormatted}</Text>
                    }
                 </View>
                 
                </View>
            </TouchableOpacity>  
        )
    }

    emptyComponent = () => {
        return(
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32}}>
                <Icon 
                    iconName="home-city"
                    iconLib="MaterialCommunityIcons"
                    iconColor={Colors.cosmos500}
                    iconSize={120}
                    style={{marginBottom: 32}}
                />
                <Text type="Medium" style={{fontSize: 24, textAlign: 'center', color: Colors.cosmos500}} >You are not hosting any guests... yet!</Text>
                <Text type="Regular" style={{marginTop: 8, fontSize: 16, textAlign: 'center', color: Colors.cosmos500}}>Pull down to refresh and see if any future trips are booked.</Text>
            </View>
        )
    }

    openEditSpace = (spot) => {
        this.props.ComponentStore.selectedSpot.clear()
        this.props.ComponentStore.selectedSpot.push(spot)
        this.setState({visitModalVisible: false})
        this.props.navigation.navigate("EditSpace")
    }


    LoadingIndicatorBottom = () => {
        if(this.state.isRefreshing){
            return(
                <View style={{height: 80, alignItems: "center", justifyContent: 'center', paddingVertical: 16}}>
                    <ActivityIndicator color={Colors.apollo900} style={{paddingBottom: 8}}/>
                    <Text>Finding more...</Text>
                </View>
            )
        }else{
            return(
                <View style={{alignItems: "center", justifyContent: 'center', paddingVertical: 16}}>
                    <Text>No more results</Text>
                </View>
            )
        }
        
    }

    pressedTOS = () => {
        this.setState({visitModalVisible: false})
        this.props.navigation.navigate("TOS")
    }

    cardsSheet = (props) => {
        const {data, visible, active} = props;

        const {visit, listing, current} = data;
        const {isCancelled} = visit

        let { serviceFeeCents, processingFeeCents } = this.state.selectedVisit.visit.price

        let amountChargedToHostCents = serviceFeeCents + processingFeeCents
        let amountChargedToHost = (amountChargedToHostCents/100).toLocaleString("en-US", {style:"currency", currency:"USD"})

            if(visible){
                actionSheetRef.current?.setModalVisible(true);

                var paymentsArray = this.props.UserStore.payments.map(payment => {
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
                              
                              <Text style={cardValid ? {fontSize: 12} : {fontSize: 12, color: Colors.hal500}} >{cardValid ? `Expires ${payment.Month}/${payment.Year}` : "Expired"}</Text>
                          </View>
                      </RadioButton>
                    )
                })
            }
            
           
            return(
                <ActionSheet 
                        ref = {actionSheetRef}
                        bounceOnOpen={true}
                        bounciness={4}
                        gestureEnabled={true}
                        containerStyle={{paddingTop: 8, zIndex: 99999}}
                        extraScroll={40}
                        delayActionSheetDrawTime={0}
                        initialOffsetFromBottom = {1}
                   >
                       <View style={styles.actionSheetContent}>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8}}>
                                        <Text type="Medium" style={{flex: 8, fontSize: 24, flexWrap: 'wrap', paddingRight: 16}} numberOfLines={2}>Cancelling Trip</Text>
                                     </View>
                                     <Text style={{fontSize: 14}}>Cancelling a trip for an upcoming guest will refund the entire amount to the guest and <Text style={{fontSize: 14, fontWeight: 'bold'}}>you will be charged {amountChargedToHost}</Text>. Update your space availability to prevent future bookings at this time.</Text>
                                     <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16}}>
                                        <Text style={{flex: 1}}>Choose a payment method</Text>
                                        <ClickableChip 
                                        bgColor='rgba(255, 193, 76, 0.3)' // Colors.Tango300 with opacity of 30%
                                        textColor={Colors.tango700}
                                        onPress={() => {
                                            this.setState({cardModalVisible: false, visitModalVisible: false})
                                            this.props.navigation.navigate("AddPayment")
                                        }}
                                        >+ Card</ClickableChip>
            
                                     </View>
                                     
                                     {this.props.UserStore.payments.length > 0 ? 
                                        <RadioList style={{marginBottom: 24}} activeItem={this.state.selectedPayment ? this.state.selectedPayment.PaymentID : null} selectItem={(option) => this.setActivePayment(option, true)}>
                                            {paymentsArray}
                                        </RadioList>
                                    : null}
                                      <Button disabled={active && !isCancelled || this.state.cancellingTrip} onPress={() => this.cancelTrip()} style = {active ? {flex: 1, height: 48, backgroundColor: Colors.mist900} : { flex: 1, height: 48, backgroundColor: Colors.tango900}} textStyle={{color: "white", fontWeight: "500"}}>{this.state.cancellingTrip ? <FloatingCircles color="white"/> : `Cancel & Pay ${amountChargedToHost}`}</Button>
                                     
                        </View>
                   </ActionSheet>
            )
    }
 
    VisitModal(props) {
        const {data, visible} = props;
        
        if(data){
            var date = new Date()
            var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            let today = date.getDate();
            let month = months[date.getMonth()]
            let year = date.getFullYear();

            const isToday = data.visit.visit.day.dateName === today && data.visit.visit.day.year === year && data.visit.visit.day.monthName === month;

            let sameTimezone = false;

            const {visit, listing, current} = data;
            const {isCancelled} = visit

            // Check if space is in same timezone as current device
            if(listing.timezone.offsetValue + new Date().getTimezoneOffset()/60 === 0){
                sameTimezone = true;
            }

            const isReported = this.props.UserStore.reports.map(x => x.visit ? x.visit.visitID : null ).includes(visit.tripID)

            const hostName = `${visit.hostName.split(" ")[0]} ${data.visit.hostName.split(" ")[1].slice(0,1)}.`

            const timeDiffEnd = visit.visit.time.end.unix - new Date().getTime()
            const timeDiffStart = visit.visit.time.start.unix - new Date().getTime()


                        

                        let isInPast = timeDiffEnd != Math.abs(timeDiffEnd)
                        let isCurrentlyActive = timeDiffStart != Math.abs(timeDiffStart) && !isInPast

            return(
                <Modal 
                    animationType="slide"
                    visible={visible}
                    onRequestClose={() => this.setState({visitModalVisible: false, selectedVisit: null})}
                    style={{zIndex: -999}}
                >
                    <SafeAreaView style={{flex: 1, paddingBottom: 16}}>
                        <View style={{flex: 0}}>
                            <View style={{flexGrow: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: Platform.OS === 'ios' ? 0 : 16}}>
                                <Text numberOfLines={1}  ellipsizeMode='tail' style={{ fontSize: 18}}>{data.listing.spaceName}</Text>
                                <Text type="Regular" numberOfLines={1} ellipsizeMode='tail' style={{paddingBottom: 8}}>Visit by {hostName}</Text>
                            </View>
                                <Icon 
                                    iconName="x"
                                    iconColor={Colors.cosmos500}
                                    iconSize={28}
                                    onPress={() => this.setState({visitModalVisible: false, selectedVisit: null})}
                                    style={{position: 'absolute', top: Platform.OS === 'ios' ? 8 : 16, right: 8}}
                                />
                        </View>
                        <ScrollView style={{flex: 1}}>
                            <Image 
                                    aspectRatio={21/9}
                                    source={{uri: listing.photo}}
                                    resizeMode={'cover'}
                            /> 
                            <View style={{paddingHorizontal: 16}}>
                                
                            <Text numberOfLines={1} style={{textAlign: 'center', fontSize: 18, marginTop: 8, paddingBottom: 4}}>{isToday ? `Today, ${visit.visit.day.monthName} ${visit.visit.day.dateName} ${visit.visit.day.year}` : `${visit.visit.day.dayName}, ${visit.visit.day.monthName} ${visit.visit.day.dateName} ${visit.visit.day.year}`}</Text>
                            {isCancelled ? 
                                <View style={{paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.mist900, marginBottom: 8}}>
                                <Text type="Regular" numberOfLines={1} style={{fontSize: 22, color: Colors.hal500, textAlign: 'center'}}>Trip cancelled by {data.visit.cancelledBy === 'host' ? "you" : "guest"}</Text>
                                <Text>{}</Text>
                                </View>
                            :
                                <View>
                                    <Text numberOfLines={1} style={{textAlign: "center", paddingBottom: 8, color: Colors.cosmos300}}>Driving {visit.vehicle.Year} {visit.vehicle.Make} {visit.vehicle.Model} ({visit.vehicle.LicensePlate})</Text>
                                        <View style={{flexDirection: 'row', alignItems: "flex-end", justifyContent: 'space-between', marginTop: 0, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.mist900}}>
                                            <View style={{flexDirection: 'column', alignItems: 'center', flex: 3}}>
                                                <Text type="Light" numberOfLines={1} style={{fontSize: 18}}>Arrival</Text>
                                                <Text type="Regular" numberOfLines={1} style={{fontSize: 22, color: Colors.tango700}}>{visit.visit.time.start.labelFormatted} {sameTimezone ? null : listing.timezone.timeZoneAbbr}</Text>
                                            </View>
                                            <Icon 
                                                iconName="arrow-right"
                                                iconColor={Colors.tango700}
                                                iconSize={24}
                                                iconLib="MaterialCommunityIcons"
                                                style={{flex: 1, paddingBottom: 4, textAlign: 'center'}}
                                            />
                                            <View style={{flexDirection: 'column', alignItems: 'center', flex: 3}}>
                                                <Text type="Light" numberOfLines={1} style={{fontSize: 18}}>Departure</Text>
                                                <Text type="Regular" numberOfLines={1} style={{fontSize: 22, color: Colors.tango700}}>{visit.visit.time.end.labelFormatted} {sameTimezone ? null : listing.timezone.timeZoneAbbr}</Text>
                                            </View>
                                        </View>
                                    </View>
                                }
                                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 8, marginBottom: 8}}>
                                        <Text style={{flex: 1, fontSize: 18, paddingRight: 8}} numberOfLines={1} ellipsizeMode='tail'>Visit Details</Text>
                                        <Text style={{flex: 0, color: Colors.cosmos300, fontSize: 11}}>{visit.tripID}</Text>
                                </View>
                                {listing.spaceBio ? <Text style={{color: Colors.cosmos500, lineHeight: Platform.OS === 'ios' ? 18 : 20}}>{listing.spaceBio}</Text> : null}
                                <View style={{paddingVertical: 16, borderBottomColor: Colors.mist900, borderBottomWidth: 1, flexDirection: 'row'}}>
                                    <MapView
                                        provider={MapView.PROVIDER_GOOGLE}
                                        mapStyle={NightMap}
                                        style={{width: 100, height: 100, flex: 1, aspectRatio: 1/1,  marginRight: 16}}
                                        region={{
                                            latitude: listing.region.latitude,
                                            longitude: listing.region.longitude,
                                            latitudeDelta: .25,
                                            longitudeDelta: .25,
                                            }}
                                        pitchEnabled={false} 
                                        rotateEnabled={false} 
                                        zoomEnabled={false} 
                                        scrollEnabled={false}
                                    />
                                    <View style={{flex: 2, justifyContent: 'space-between'}}>
                                        <Text>{listing.address.full}</Text>
                                        <Button onPress={() => this.openEditSpace(listing)} style = {{backgroundColor: 'rgba(255, 193, 76, 0.3)', height: 48}} textStyle={{color: Colors.tango900, fontWeight: "500"}}>Edit Details</Button>
                                    </View>
                                </View>
                                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 8}}>
                                        <Text style={{flex: 1, fontSize: 18, paddingRight: 8}} numberOfLines={1} ellipsizeMode='tail'>Payment Details</Text>
                                        <Icon 
                                            iconName={visit.payment.CardType !== '' ? 'cc-' + visit.payment.CardType : 'credit-card'}
                                            iconLib="FontAwesome"
                                            iconColor={Colors.cosmos300}
                                            iconSize={28}
                                            style={{ marginLeft: 16}}
                                        />
                                </View>
                                <View style={{paddingVertical: 16, borderBottomColor: Colors.mist900, borderBottomWidth: 1, flexDirection: 'column'}}>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                                        <Text>Parking Fare</Text>
                                        {visit.isCancelled ? 
                                       
                                            <View>
                                                {visit.refundFull ? 
                                                    <Text style={visit.cancelledBy === 'host' ? {textDecorationLine: 'line-through'} : null} >{visit.price.price }</Text>
                                                : 
                                                    <View style={{flexDirection: 'row'}}>
                                                        <Text style={{textDecorationLine: 'line-through', marginRight: 8}}>{visit.price.price }</Text>
                                                        <Text>{((visit.refundAmtCents - visit.price.serviceFeeCents)/100).toLocaleString("en-US", {style:"currency", currency:"USD"})}</Text>
                                                    </View>
                                                }
                                            </View>
                                        
                                        :
                                            <Text>{visit.price.price}</Text>
                                        }
                                    </View>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                                        <Text>Service Fee {visit.price.serviceFeeCents !== 0 && isCancelled && visit.cancelledBy === 'host' ? <Text style={{fontSize: 12}}>(charged to you)</Text> : visit.price.serviceFeeCents !== 0 ? <Text style={{fontSize: 12}}>(charged to visitor)</Text> : null}</Text>
                                        <Text style={visit.isCancelled && !visit.refundServiceFee ? {textDecorationLine: 'line-through'} : null}>{visit.price.serviceFeeCents === 0 ? "Free" : visit.price.serviceFee}</Text>
                                    </View>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                                        <Text>Processing Fee {visit.price.processingFeeCents !== 0 &&isCancelled && visit.cancelledBy === 'host' ? <Text style={{fontSize: 12}}>(charged to you)</Text> : visit.price.processingFeeCents !== 0 ? <Text style={{fontSize: 12}}>(charged to visitor)</Text> : null}</Text>
                                        <Text style={visit.isCancelled && visit.cancelledBy !== 'host' ? {textDecorationLine: 'line-through'} : null} >{visit.price.processingFeeCents === 0 ? "Free" : visit.price.processingFee}</Text>
                                    </View>
                                </View>
                                <View style={{paddingVertical: 16, flexDirection: 'column'}}>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                                        <Text type="Medium" numberOfLines={1} style={isCancelled && visit.cancelledBy === 'host' ? {fontSize: 24, color: Colors.hal500, flex: 1} : {fontSize: 24, flex: 1}}>{isCancelled ? visit.cancelledBy === 'host' ? "Charged (USD)" : "Guest Refund (USD)" : "Total(USD)"}</Text>
                                        <Text type="Medium" numberOfLines={1} style={isCancelled && visit.cancelledBy === 'host' ? {fontSize: 24, color: Colors.hal500, flex: 0}: {fontSize: 24, flex: 0}}>{isCancelled ? visit.cancelledBy === 'host' ? visit.hostCharged : visit.refundAmt : visit.price.price}</Text>
                                    </View>
                                    <Text style={{fontSize: 12, lineHeight: Platform.OS === 'ios' ? 16 : 18}}>For more information in regards to our return policy or currency conversion, please visit our <Text style={{fontSize: 12, color: Colors.tango900}} onPress={() => this.pressedTOS()}>Terms of Service</Text>. If you have a question, or you do not recall booking this parking experience, please contact us at support@riive.net.</Text>
                                </View>
                                {isInPast || isCancelled ? 
                                <View style={{flexDirection: 'row'}}>
                                    <Button 
                                    disabled={isReported}
                                    onPress={() =>  {
                                        this.props.navigation.navigate("ReportTrip", {
                                            isGuest: false,
                                            visit: visit,
                                            listing: listing
                                        })
                                        this.setState({visitModalVisible: false})
                                    }} style = {isReported ? {flex: 1, height: 48, backgroundColor: Colors.mist900} : {flex: 1, height: 48, backgroundColor: Colors.tango900}} textStyle={{color: "white", fontWeight: "500"}}>{isReported ? "Trip Reported" : "Report Trip"}</Button>
                                </View>
                                : 
                                <View style={{flexDirection: 'column'}}>
                                    <Button disabled={isCurrentlyActive && !isCancelled} onPress={() => this.showCancellationModal()} style = {isCurrentlyActive ? {flex: 1, height: 48, backgroundColor: Colors.mist900} : { flex: 1, height: 48, backgroundColor: Colors.tango900}} textStyle={{color: "white", fontWeight: "500"}}>Cancel Trip</Button>
                                    {isCurrentlyActive && !isCancelled ? <Text style={{fontSize: 14, marginVertical: 8}}>Currently active trips can only be cancelled by guests. To prevent this in the future, <Text onPress={() => this.openEditSpace(listing)} style={{textDecorationLine: 'underline', color: Colors.tango900, fontSize: 14}}>edit your availability</Text></Text> :  null}
                                </View>
                                }
                            </View>

                            <this.cardsSheet visible={this.state.cardModalVisible} data={data} active={isCurrentlyActive}/>
                            
                            
                            
                        </ScrollView>
                    </SafeAreaView>
                </Modal>
            )
        }else{
            return null
        }
    }
    

    render(){
        return(
            <View style={styles.container}>
                <this.VisitModal visible={this.state.visitModalVisible} data={this.state.selectedVisit}/>
                 {/* <ScrollView refreshControl={<RefreshControl refreshing={this.state.isRefreshing} onRefresh={this.updateVisits}/>}>
                    <Text>This is Visiting trips.</Text>
                     <View> */}
                        <SectionList
                            contentContainerStyle={{flexGrow: 1}}
                            refreshControl={<RefreshControl color={Colors.apollo900} refreshing={this.state.isRefreshing} onRefresh={this.updateVisits}/>}
                            ref={(ref) => { this.visitsRef = ref; }}
                            sections={this.state.visits}
                            renderItem={({item}) => this.renderVisit(item)}
                            renderSectionHeader={({section}) => <Text style={section.isInPast ? [styles.sectionHeader, styles.sectionHeaderPast] : styles.sectionHeader}>{section.title}</Text>}
                            keyExtractor={(item, index) => index}
                            onEndReachedThreshold={Platform.OS === "ios" ? 0 : 0.1}
                            onEndReached={() => this.loadMoreData()}
                            onMomentumScrollBegin={() => this._onMomentumScrollBegin()}
                            ListEmptyComponent={() => this.emptyComponent()}
                            ListFooterComponent={this.LoadingIndicatorBottom()}
                        />
                    
               {/* </View>
             </ScrollView> */}
            </View>
        )
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 8,
        paddingHorizontal: 8,
        backgroundColor: "white"
    },
    sectionHeader: {
        paddingTop: 2,
        paddingBottom: 2,
        paddingLeft: 10,
        paddingRight: 10,
        fontSize: 20,
        fontWeight: '400',
        color: Colors.cosmos700,
        backgroundColor: 'white'
      },
    sectionHeaderPast: {
        color: '#c2c2c2',
    },
    
      item: {
        padding: 10,
        fontSize: 18,
        height: 44,
      },
      visitCard: {
          backgroundColor: 'white',
          
          height: 100,
          marginVertical: 8,
          marginHorizontal: 4,
        //   shadowColor: '#000', 
        //   shadowOpacity: 0.6, 
        //   shadowOffset:{width: 2, height: 2}, 
        //   shadowRadius: 3, 
        //   elevation: 12,
        //   borderRadius: 4,
      },
      actionSheetContent:{
        paddingTop: 8,
        paddingHorizontal: 16, 
    }
})