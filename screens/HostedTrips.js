import React, {Component} from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, RefreshControl, SectionList, ActivityIndicator, Modal, SafeAreaView, Linking, TouchableOpacity, Alert} from 'react-native'
import Button from '../components/Button'
import Text from '../components/Txt'
import Icon from '../components/Icon'
import Image from '../components/Image'
import Colors from '../constants/Colors'

import MapView, {Marker} from 'react-native-maps';
import DayMap from '../constants/DayMap'
import NightMap from '../constants/NightMap'

import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import 'firebase/auth';
import 'firebase/firestore';

//MobX Imports
import {inject, observer} from 'mobx-react/native'



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
            modalVisible: false,
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

        let { serviceFeeCents, processingFeeCents } = this.state.selectedVisit.visit.price

        let amountChargedToHostCents = serviceFeeCents + processingFeeCents
        let amountChargedToHost = (amountChargedToHostCents/100).toLocaleString("en-US", {style:"currency", currency:"USD"})



        Alert.alert(
                        'Canceling a Guest Trip',
                        `Cancelling a trip for an upcoming guest will refund the entire amount to the guest and you will be charged ${amountChargedToHost}. If this day/time does not work in the future, you can update your space availability under Edit Details or manage your space from your profile.`,
                        [
                        { text: 'Back' },
                        { text: 'Cancel Trip', onPress: () => this.cancelTrip() },
                        
                        ]
                    )
            
                

        
    }

    cancelTrip = () => {

      

        let { serviceFeeCents, processingFeeCents, priceCents } = this.state.selectedVisit.visit.price


        let amountChargedToHostCents = serviceFeeCents + processingFeeCents
        let amountChargedToHost = (amountChargedToHostCents/100).toLocaleString("en-US", {style:"currency", currency:"USD"})

        let refundAmountCents = serviceFeeCents + processingFeeCents + priceCents
        let refundAmount = (refundAmountCents/100).toLocaleString("en-US", {style:"currency", currency:"USD"})

        const timeDiffEnd = this.state.selectedVisit.visit.visit.time.end.unix - new Date().getTime()
        const timeDiffStart = this.state.selectedVisit.visit.visit.time.start.unix - new Date().getTime()

        let isInPast = timeDiffEnd != Math.abs(timeDiffEnd)
        let isCurrentlyActive = timeDiffStart != Math.abs(timeDiffStart) && !isInPast

        var currentTime = firestore.Timestamp.now();

       

        if(!isInPast){
            const db = firestore();
            db.collection('trips').doc(this.state.selectedVisit.visit.tripID).get().then((trip) => {
                if(!trip.exists){
                    alert("Failed to save changes. Trip not found.")
                }else{
                    try{
                        db.collection('trips').doc(this.state.selectedVisit.visit.tripID).update({
                            isCancelled: true,
                            refundAmt: refundAmount,
                            refundAmtCents: refundAmountCents,
                            hostCharged: amountChargedToHost,
                            hostChargedCents: amountChargedToHostCents,
                            cancelledBy: "host",
                            updated: currentTime
                        }).then(() => {
                            // this.props.navigation.goBack(null)
                            this.updateVisits();
                            this.setState({modalVisible: false})
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

            <TouchableOpacity  style={styles.visitCard} onPress={() => this.setState({selectedVisit: data, modalVisible: true})}>
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
        this.setState({modalVisible: false})
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
        this.setState({modalVisible: false})
        this.props.navigation.navigate("TOS")
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
                    onRequestClose={() => this.setState({modalVisible: false, selectedVisit: null})}
                >
                    <SafeAreaView style={{flex: 1}}>
                        <View style={{flex: 0}}>
                            <View style={{flexGrow: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: Platform.OS === 'ios' ? 0 : 16}}>
                                <Text numberOfLines={1}  ellipsizeMode='tail' style={{ fontSize: 18}}>{data.listing.spaceName}</Text>
                                <Text type="Regular" numberOfLines={1} ellipsizeMode='tail' style={{paddingBottom: 8}}>Visit by {hostName}</Text>
                            </View>
                                <Icon 
                                    iconName="x"
                                    iconColor={Colors.cosmos500}
                                    iconSize={28}
                                    onPress={() => this.setState({modalVisible: false, selectedVisit: null})}
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
                                <Text type="Regular" numberOfLines={1} style={{fontSize: 22, color: Colors.hal500, textAlign: 'center'}}>Trip Cancelled</Text>
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
                                        <Text style={visit.isCancelled ? {textDecorationLine: 'line-through'}: null} >{visit.price.price}</Text>
                                    </View>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                                        <Text>Service Fee</Text>
                                        <Text style={visit.isCancelled ? {textDecorationLine: 'line-through'}: null}>{visit.price.serviceFee}</Text>
                                    </View>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                                        <Text>Processing Fee</Text>
                                        <Text style={visit.isCancelled ? {textDecorationLine: 'line-through'}: null} >{visit.price.processingFee}</Text>
                                    </View>
                                </View>
                                <View style={{paddingVertical: 16, flexDirection: 'column'}}>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                                        <Text type="Medium" numberOfLines={1} style={{fontSize: 24}}>{isCancelled ? "Returned (USD)" : "Total (USD)"}</Text>
                                        <Text type="Medium" numberOfLines={1} style={{fontSize: 24}}>{isCancelled ? visit.price.price : visit.price.total}</Text>
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
                                        this.setState({modalVisible: false})
                                    }} style = {isReported ? {flex: 1, height: 48, backgroundColor: Colors.mist900} : {flex: 1, height: 48, backgroundColor: Colors.tango900}} textStyle={{color: "white", fontWeight: "500"}}>{isReported ? "Trip Reported" : "Report Trip"}</Button>
                                </View>
                                : 
                                <View style={{flexDirection: 'row'}}>
                                    <Button disabled={isCurrentlyActive && !isCancelled} onPress={() => this.showCancellationModal()} style = {isCurrentlyActive ? {flex: 1, height: 48, backgroundColor: Colors.mist900} : { flex: 1, height: 48, backgroundColor: Colors.tango900}} textStyle={{color: "white", fontWeight: "500"}}>Cancel Trip</Button>
                                </View>
                                }
                            </View>
                            
                            
                            
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
                <this.VisitModal visible={this.state.modalVisible} data={this.state.selectedVisit}/>
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
      }
})