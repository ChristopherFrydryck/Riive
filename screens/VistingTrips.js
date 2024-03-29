import React, {Component} from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, RefreshControl, SectionList, ActivityIndicator, Modal, SafeAreaView, Linking, TouchableOpacity, Animated, Easing} from 'react-native'


import Button from '../components/Button'
import Text from '../components/Txt'
import Icon from '../components/Icon'
import Image from '../components/Image'
import Colors from '../constants/Colors'

import MapView, {Marker} from 'react-native-maps';
import Clipboard from '@react-native-clipboard/clipboard';
import DayMap from '../constants/DayMap'
import NightMap from '../constants/NightMap'

import checkUserStatus from '../functions/in-app/checkUserStatus';

// import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
// import 'firebase/auth';
// import 'firebase/firestore';

//MobX Imports
import {inject, observer} from 'mobx-react'


@inject("UserStore", "ComponentStore")
@observer
export default class VisitingTrips extends Component{

   constructor(props){
        super(props);
        this.state = {
            isRefreshing: false,
            visits: [],
            lastRenderedItem: null,
            selectedVisit: null,
            modalVisible: false,
            slideUpAnimation: new Animated.Value(-100),

            // secitonlist stuff
            
        }
        // this._visits = [];
        this.scrollingList = false
        this.VisitModal = this.VisitModal.bind(this)
   }

   componentDidMount(){
        // Set Status Bar page info here!
    this._navListener = this.props.navigation.addListener('didFocus', () => {
            checkUserStatus(auth().currentUser.uid);
            StatusBar.setBarStyle('dark-content', true);
            Platform.OS === 'android' && StatusBar.setBackgroundColor('white');   
            this.updateVisits();  
            
        });

       
        

    

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


    
            var spaceVisits = db.collection("trips").where("visitorID", "==", this.props.UserStore.userID).orderBy("endTimeUnix", "desc").limit(6)
            
            // spaceVisits = spaceVisits.orderBy("isCancelled", "asc")

            var visits = [];
            

            spaceVisits.get().then( async(spaceData) => {
         
                // spaceData.docs.forEach(x => console.log(x.data().isCancelled))
                // spaceData.docs.sort((a, b) => a.data().isCancelled - b.data().isCancelled)

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
                            // Sorts visits by showing non cancelled trips first
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
            

                var spaceVisits = db.collection("trips").where("visitorID", "==", this.props.UserStore.userID).orderBy("endTimeUnix", "desc").limit(20)

                var visits = this.state.visits;

                    spaceVisits.startAfter(this.state.lastRenderedItem).get().then( async(nextData) => {
                        // nextData.docs.sort((a, b) => a.data().isCancelled - b.data().isCancelled)
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
                                    // Sorts visits by showing non cancelled trips first
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
        const hostName = `${visit.hostName.split(" ")[0]} ${visit.hostName.split(" ")[1].slice(0,1)}.`

        return(

            <TouchableOpacity style={styles.visitCard} onPress={() => this.setState({selectedVisit: data, modalVisible: true})}>
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <View style={{borderRadius: 4, overflow: 'hidden'}}>
                        {!isCancelled ? 
                            <View style={{position: 'absolute', zIndex: 9, backgroundColor: 'white', top: 4, left: 4, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4}}>
                                <Text>{visit.price.discount ? (Math.max(0,(visit.price.totalCents - visit.price.discountTotalCents - (visit.price.riiveCreditTotalCents || 0))) * .01).toLocaleString("en-US", {style:"currency", currency:"USD"}) : (Math.max(0, (visit.price.totalCents - (visit.price.riiveCreditTotalCents || 0))) * .01).toLocaleString("en-US", {style:"currency", currency:"USD"})}</Text>
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
                      <Text type="Medium" numberOfLines={1} ellipsizeMode='tail' style={{color: Colors.hal500}}>Cancelled by {visit.cancelledBy === 'host' ? 'host' : 'you'}</Text>
                    : 
                      <Text numberOfLines={1} ellipsizeMode='tail' style={{color: Colors.cosmos700}}>Hosted by {hostName}</Text>
                    }
                    {isCancelled ? 
                        <Text numberOfLines={1} ellipsizeMode='tail' style={{color: "#adadad", textDecorationLine: "line-through"}}>{visit.visit.time.start.labelFormatted} - {visit.visit.time.end.labelFormatted}</Text> : 
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
                    iconName="parking"
                    iconLib="FontAwesome5"
                    iconColor={Colors.cosmos500}
                    iconSize={120}
                    style={{marginBottom: 32}}
                />
                <Text type="Medium" style={{fontSize: 24, textAlign: 'center', color: Colors.cosmos500}} >You have no booked trips.</Text>
                <Text type="Regular" style={{marginTop: 8, fontSize: 16, textAlign: 'center', color: Colors.cosmos500}}>Pull down to refresh and see any trips you have planned.</Text>
            </View>
        )
    }

    openGps = (lat, lng, fullAddress) => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${lat},${lng}`;
        const label = fullAddress;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        })

        Linking.openURL(url);
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

    slideBottomPill = () => {
            clearTimeout(this.pillTimeout)
   
            Animated.timing(this.state.slideUpAnimation, {
                toValue: 40,
                duration: 250,
                easing: Easing.elastic(1),
                useNativeDriver: false,
            }).start();

            this.pillTimeout = setTimeout(() => {
                Animated.timing(this.state.slideUpAnimation, {
                toValue: -100,
                duration: 250,
                easing: Easing.elastic(1),
                useNativeDriver: false,
            }).start();}, 2000)
      }

    VisitModal(props) {
        const {data, visible} = props;
        
        if(data){
            // console.log(data.visit)
            var date = new Date()
            var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            let today = date.getDate();
            let month = months[date.getMonth()]
            let year = date.getFullYear();

            const isToday = data.visit.visit.day.dateName === today && data.visit.visit.day.year === year && data.visit.visit.day.monthName === month;

            let sameTimezone = false;

            // Check if space is in same timezone as current device
            if(data.listing.timezone.offsetValue + new Date().getTimezoneOffset()/60 === 0){
                sameTimezone = true;
            }

            const hostName = `${data.visit.hostName.split(" ")[0]} ${data.visit.hostName.split(" ")[1].slice(0,1)}.`


            return(
                <Modal 
                    animationType="slide"
                    visible={visible}
                    onRequestClose={() => this.setState({modalVisible: false, selectedVisit: null})}
                >
                    <SafeAreaView style={{flex: 1, paddingBottom: 16}}>
                        <View style={{flex: 0}}>
                            <View style={{flexGrow: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: Platform.OS === 'ios' ? 0 : 16}}>
                                <Text numberOfLines={1}  ellipsizeMode='tail' style={{ fontSize: 18}}>{data.listing.spaceName}</Text>
                                <Text type="Regular" numberOfLines={1} ellipsizeMode='tail' style={{paddingBottom: 8}}>Hosted by {hostName}</Text>
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
                                    source={{uri: data.listing.photo}}
                                    resizeMode={'cover'}
                            /> 
                            <View style={{paddingHorizontal: 16}}>
                                
                                <Text numberOfLines={1} style={{textAlign: 'center', fontSize: 18, marginTop: 8, paddingBottom: 4}}>{isToday ? `Today, ${data.visit.visit.day.monthName} ${data.visit.visit.day.dateName} ${data.visit.visit.day.year}` : `${data.visit.visit.day.dayName}, ${data.visit.visit.day.monthName} ${data.visit.visit.day.dateName} ${data.visit.visit.day.year}`}</Text>
                                {data.visit.isCancelled ? 
                                    <View style={{paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.mist900, marginBottom: 8}}>
                                        <Text type="Regular" numberOfLines={1} style={{fontSize: 22, color: Colors.hal500, textAlign: 'center'}}>Trip Cancelled</Text>
                                    </View>
                                :
                                <View>
                                    <Text numberOfLines={1} style={{textAlign: "center", paddingBottom: 8, color: Colors.cosmos300}}>Driving {data.visit.vehicle.Year} {data.visit.vehicle.Make} {data.visit.vehicle.Model} ({data.visit.vehicle.LicensePlate})</Text>
                                    <View style={{flexDirection: 'row', alignItems: "flex-end", justifyContent: 'space-between', marginTop: 0, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.mist900}}>
                                        <View style={{flexDirection: 'column', alignItems: 'center', flex: 3}}>
                                            <Text type="Light" numberOfLines={1} style={{fontSize: 18}}>Arrival</Text>
                                            <Text type="Regular" numberOfLines={1} style={{fontSize: 22, color: Colors.tango700}}>{data.visit.visit.time.start.labelFormatted} {sameTimezone ? null : data.listing.timezone.timeZoneAbbr}</Text>
                                        </View>
                                        <Icon 
                                            iconName="arrow-right"
                                            iconColor={Colors.tango700}
                                            iconSize={24}
                                            iconLib="MaterialCommunityIcons"
                                            style={{flex: 1, paddingBottom: 4, textAlign: 'center'}}
                                        />
                                        <View style={{flexDirection: 'column', alignItems: 'center', flex: 3}}>
                                            <Text  type="Light" numberOfLines={1} style={{fontSize: 18}}>Departure</Text>
                                            <Text type="Regular" numberOfLines={1} style={{fontSize: 22, color: Colors.tango700}}>{data.visit.visit.time.end.labelFormatted} {sameTimezone ? null : data.listing.timezone.timeZoneAbbr}</Text>
                                        </View>
                                    </View>
                                </View>
                                }
                                {data.visit.isCancelled ? null :
                                <View>
                                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 8, marginBottom: 8}}>
                                        <Text style={{flex: 1, fontSize: 18, paddingRight: 8}} numberOfLines={1} ellipsizeMode='tail'>Listing Details</Text>
                                        {/* <Text style={{flex: 0, color: Colors.cosmos300, fontSize: 11}}>{data.visit.tripID}</Text> */}
                                </View>
                                {data.listing.spaceBio ? <Text style={{color: Colors.cosmos500, lineHeight: Platform.OS === 'ios' ? 18 : 20}}>{data.listing.spaceBio}</Text> : null}
                                <View style={{paddingVertical: 16, borderBottomColor: Colors.mist900, borderBottomWidth: 1, flexDirection: 'row'}}>
                                    <MapView
                                        provider={MapView.PROVIDER_GOOGLE}
                                        mapStyle={NightMap}
                                        style={{width: 100, height: 100, flex: 1, aspectRatio: 1/1,  marginRight: 16}}
                                        region={{
                                            latitude: data.listing.region.latitude,
                                            longitude: data.listing.region.longitude,
                                            latitudeDelta: .25,
                                            longitudeDelta: .25,
                                            }}
                                        pitchEnabled={false} 
                                        rotateEnabled={false} 
                                        zoomEnabled={false} 
                                        scrollEnabled={false}
                                    />
                                    <View style={{flex: 2, justifyContent: 'space-between'}}>
                                        <TouchableOpacity 
                                            onPress={()=> {
                                                Clipboard.setString(data.listing.address.full)
                                                this.slideBottomPill()
                                            }} 
                                            style={{flexDirection: 'row', paddingRight: 16,}}
                                        >
                                            <Text style={{paddingRight: 8}} numberOfLines={2}>{data.listing.address.full} {data.listing.address.box ? `APT ${data.listing.address.box}` : ""}</Text>
                                            <Icon iconName="copy" iconColor={Colors.cosmos300} iconSize={16} />
                                        </TouchableOpacity>
                                        
                                        <Button onPress={() => this.openGps(data.listing.region.latitude, data.listing.region.longitude, data.listing.address.full)} style = {{backgroundColor: 'rgba(255, 193, 76, 0.3)', height: 48}} textStyle={{color: Colors.tango900, fontWeight: "500"}}>Get Directions</Button>
                                    </View>
                                </View>
                                </View>}
                                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 8}}>
                                        <Text style={{flex: 1, fontSize: 18, paddingRight: 8}} numberOfLines={1} ellipsizeMode='tail'>Payment Details</Text>
                                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                            <Text style={{fontSize: 14, color: Colors.cosmos300}}>{data.visit.payment.Number}</Text>
                                            <Icon 
                                                iconName={data.visit.payment.CardType !== '' ? 'cc-' + data.visit.payment.CardType : 'credit-card'}
                                                iconLib="FontAwesome"
                                                iconColor={Colors.cosmos300}
                                                iconSize={24}
                                                style={{ marginLeft: 4}}
                                            />
                                        </View>
                                        
                                </View>
                                <View style={{paddingVertical: 16, borderBottomColor: Colors.mist900, borderBottomWidth: 1, flexDirection: 'column'}}>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                                        <Text>Parking Fare</Text>
                                        {data.visit.isCancelled ? 
                                        <View>
                                            {data.visit.refundFull ? 
                                                <Text>{data.visit.price.price}</Text>
                                                :
                                                <View style={{flexDirection: 'row'}}>
                                                    <Text style={{textDecorationLine: 'line-through', marginRight: 8}}>{data.visit.price.price}</Text>
                                                    <Text>{((data.visit.refundAmtCents - data.visit.price.serviceFeeCents)/100).toLocaleString("en-US", {style:"currency", currency:"USD"})}</Text>
                                                </View>
                                            }
                                        </View>
                                            
                                        :
                                            <Text>{data.visit.price.price}</Text>
                                        }   
                                       
                                    </View>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                                        <Text>Service Fee {data.visit.price.serviceFeeCents !== 0 && data.visit.isCancelled && data.visit.cancelledBy === 'host' ? <Text style={{fontSize: 12}}>(charged to host)</Text> : null }</Text>
                                        <Text style={data.visit.isCancelled ? data.visit.refundServiceFee ? null : {textDecorationLine: 'line-through'}: null}>{data.visit.price.serviceFeeCents === 0 ? "Free" : data.visit.price.serviceFee}</Text>
                                    </View>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                                        <Text>Processing Fee {data.visit.price.processingFeeCents !== 0 && data.visit.isCancelled && data.visit.cancelledBy === 'host' ? <Text style={{fontSize: 12}}>(charged to host)</Text> : null }</Text>
                                        <Text style={data.visit.isCancelled && data.visit.cancelledBy !== 'host' ? {textDecorationLine: 'line-through'} : null}>{data.visit.price.processingFeeCents === 0 ? "Free" : data.visit.price.processingFee}</Text>
                                    </View>
                                    {data.visit.price.discount ? 
                                        <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                                            <Text>Discount</Text>
                                            <Text style={{color: Colors.hal500}}>- {data.visit.price.discountTotal}</Text>
                                        </View>
                                    : null}
                                    {data.visit.price.riiveCreditApplied ? 
                                        <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                                            <Text>Riive Credit</Text>
                                            <Text style={{color: Colors.hal500}}>- {data.visit.price.riiveCreditTotal}</Text>
                                        </View>
                                    : null}
                                </View>
                                <View style={{paddingVertical: 16, flexDirection: 'column'}}>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                                        <Text type="Medium" numberOfLines={1} style={{fontSize: 24}}>{data.visit.isCancelled ? "Refunded (USD)" : "Total (USD)"}</Text>
                                        <View>
                                            {data.visit.isCancelled ?
                                                <Text type="Medium" numberOfLines={1} style={{fontSize: 24}}>{data.visit.refundAmt || "--"}</Text>
                                             :
                                                 <Text type="medium" numberOfLines={1} style={{fontSize: 24}}>{data.visit.price.discountTotalCents ? (Math.max(0,(data.visit.price.totalCents - data.visit.price.discountTotalCents - (data.visit.price.riiveCreditTotalCents || 0))) * .01).toLocaleString("en-US", {style:"currency", currency:"USD"}): (Math.max(0,(data.visit.price.totalCents - (data.visit.price.riiveCreditTotalCents || 0))) * .01).toLocaleString("en-US", {style:"currency", currency:"USD"})}</Text>
                                            }
                                        </View>
                                       
                                    </View>
                                    
                                </View>
                                {data.isInPast ? 
                                <View style={{flexDirection: 'row'}}>
                                    <Button onPress={() =>  {
                                        this.setState({modalVisible: false})
                                        this.props.navigation.navigate("EditTrip", {visit: data.visit, listing: data.listing})
                                    }} style = {{flex: 1, height: 48, backgroundColor: Colors.tango900}} textStyle={{color: "white", fontWeight: "500"}}>View Trip Details</Button>
                                </View>
                                : 
                                <View style={{flexDirection: 'row'}}>
                                    <Button onPress={() =>  {
                                        this.setState({modalVisible: false})
                                        this.props.navigation.navigate("EditTrip", {visit: data.visit, listing: data.listing})
                                    }} style = {{flex: 1, height: 48, backgroundColor: Colors.tango900}} textStyle={{color: "white", fontWeight: "500"}}>Edit Trip Details</Button>
                                </View>
                                }
                                <Text style={{fontSize: 12, lineHeight: Platform.OS === 'ios' ? 16 : 18, marginTop: 16}}>For more information in regards to our return policy or currency conversion, please visit our <Text style={{fontSize: 12, color: Colors.tango900}} onPress={() => this.pressedTOS()}>Terms of Service</Text>. If you have a question, or you do not recall booking this parking experience, please contact us at support@riive.net.</Text>
                            </View>
                            
                            
                            
                        </ScrollView>
                        <Animated.View style={[styles.searchToastPill, {bottom: this.state.slideUpAnimation}]}>
                        {/* <ActivityIndicator /> */}
                       
                            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                                {/* <ActivityIndicator color="white"/> */}
                                <Text style={{color: Colors.cosmos900, paddingLeft: 8}}>Copied Address</Text>
                            </View>  
                    </Animated.View>
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
      },
      searchToastPill: {
        height: 40, 
        backgroundColor: Colors.mist300, 
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
})