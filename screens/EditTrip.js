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


    

      this.props.navigation.setParams({
        title: this.state.listing.spaceName || "Loading...",
      });

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

    // goToHostProfile = () => {
    //     this.props.ComponentStore.selectedUser[0] = this.state.host ;
    //     this.props.navigation.navigate("ExternalProfile", {
    //         homeState: {
    //             ...this.props.navigation.state.params.homeState,
    //         },
    //     })
    // }

    // goToReserveSpace = () => {
    //     this.props.navigation.navigate("ReserveSpace", {
    //         homeState: {...this.props.navigation.state.params.homeState},
    //     })
    //   }


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


    render(){
        const {width, height} = Dimensions.get("window")
        let vehicleArray = this.props.UserStore.vehicles.map(vehicle => {
            return(
                <RadioButton key ={vehicle.VehicleID} style={{paddingVertical: 6}} id={vehicle.VehicleID} selectItem={() => this.setActiveVehicle(vehicle, false)}>
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
                <ScrollView style={{flex: 1, backgroundColor: 'white'}}>
                   {/* <ScrollView >
                    <View>
                        <ScrollView
                            horizontal={true}
                            pagingEnabled={true}
                            scrollEnabled={true}
                            decelerationRate={0}
                            snapToAlignment="start"
                            snapToInterval={width}
                            onScroll={data =>  this.carouselUpdate(data.nativeEvent.contentOffset.x)}
                            scrollEventThrottle={1}
                            showsHorizontalScrollIndicator={false}
                            // persistentScrollbar={true}
                        >
                        <View>
                        <Image 
                                style={{width: width}}
                                aspectRatio={16/9}
                                source={{uri: this.state.listing.photo}}
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
                                latitude: this.state.listing.region.latitude,
                                longitude: this.state.listing.region.longitude,
                                latitudeDelta: this.state.listing.region.latitudeDelta,
                                longitudeDelta: this.state.listing.region.longitudeDelta,
                                }}
                                pitchEnabled={false} 
                                rotateEnabled={false} 
                                zoomEnabled={false} 
                                scrollEnabled={false}
                                >
                                    <Marker 
                                        coordinate={{
                                        latitude: this.state.listing.region.latitude,
                                        longitude: this.state.listing.region.longitude
                                        }}   
                                    />
                                </MapView>
                            </View>
                        </ScrollView>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 8}}>
                            {this.renderDotsView(2, this.state.currentActivePhoto)}
                        </View>
                    </View>
                    </ScrollView> */}
                    <View style={[styles.contentBox, {marginTop: 16, display: 'flex', flexDirection: 'row'}]}>
                        <View style={{borderRadius: 4, overflow: 'hidden', width: 120}}>
                            {!this.state.visit.visit.isCancelled ? 
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
                            {!this.state.visit.visit.isCancelled ? 
                            <View>
                                <Text numberOfLines={1} ellipsizeMode='tail' style={{flex: 1}}>{this.state.visit.visit.time.start.labelFormatted} - {this.state.visit.visit.time.end.labelFormatted}{this.sameTimezone ? null : ` (${this.state.listing.timezone.timeZoneAbbr})`}</Text>
                                <Text type="medium" onPress={() => console.log("HELLO")} style={{fontSize: 16, color: Colors.hal500, textDecorationLine: 'underline'}}>Cancel {this.isCurrentlyActive ? "Current" : "Upcoming"} Trip</Text>
                            </View>
                            :
                            <Text>Cancelled</Text>}
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
                        <Text type="medium" numberOfLines={1} style={{fontSize: 16, marginBottom: 8}}>Payment</Text>
                      
                  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderColor: Colors.mist900, borderTopWidth: 2, borderBottomWidth: 2, paddingVertical: 8, paddingHorizontal: 16, marginTop: 16 }}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    
                    <Icon
                        iconName="credit-card"
                        iconColor="black"
                        iconSize={32}
                        style={styles.icon}          
                    />
                    
                    <View>
                        <Text style={{fontSize: 12}}>Test</Text>
                        <Text>{`•••• •••• •••• ${this.state.visit.payment.CCV}`}</Text>
                    </View>
                    </View>
                    <View style={{backgroundColor: "rgba(251, 178, 68, 0.3)", borderRadius: 4, paddingHorizontal: 4, }}>
                        <Text type="Medium" style={{fontSize: 14, color: Colors.tango900}}>DEFAULT</Text>
                    </View>
                  </View>
        
                        </View>
                </ScrollView>
       )
        // return(
        //     <View style={{flex: 1, backgroundColor: 'white'}}>
        //         <ScrollView >
        //         <View>
        //             <ScrollView
        //                     horizontal={true}
        //                     pagingEnabled={true}
        //                     scrollEnabled={true}
        //                     decelerationRate={0}
        //                     snapToAlignment="start"
        //                     snapToInterval={width}
        //                     onScroll={data =>  this.carouselUpdate(data.nativeEvent.contentOffset.x)}
        //                     scrollEventThrottle={1}
        //                     showsHorizontalScrollIndicator={false}
        //                     // persistentScrollbar={true}
        //                 >
        //                 <View>
        //                 <Image 
        //                         style={{width: width}}
        //                         aspectRatio={16/9}
        //                         source={{uri: this.state.listing.photo}}
        //                         resizeMode={'cover'}
        //                     /> 
        //                     </View>
        //                     <View>
        //                     <View  style={{ position:'absolute', width: width, aspectRatio: 16/9, zIndex: 9}}/>
        //                         <MapView
        //                         provider={MapView.PROVIDER_GOOGLE}
        //                         mapStyle={NightMap}
        //                         style={{width: width, aspectRatio:16/9}}
        //                         region={{
        //                         latitude: this.state.listing.region.latitude,
        //                         longitude: this.state.listing.region.longitude,
        //                         latitudeDelta: this.state.listing.region.latitudeDelta,
        //                         longitudeDelta: this.state.listing.region.longitudeDelta,
        //                         }}
        //                         pitchEnabled={false} 
        //                         rotateEnabled={false} 
        //                         zoomEnabled={false} 
        //                         scrollEnabled={false}
        //                         >
        //                             <Marker 
        //                                 coordinate={{
        //                                 latitude: this.state.listing.region.latitude,
        //                                 longitude: this.state.listing.region.longitude
        //                                 }}   
        //                             />
        //                         </MapView>
        //                     </View>
        //                 </ScrollView>
                        
        //                 <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 8}}>
        //                     {this.renderDotsView(2, this.state.currentActivePhoto)}
        //                 </View>
        //             </View>

        //             <View style={styles.contentBox}>
        //                 <View style={{width: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.fortune500, paddingVertical: 4, borderRadius: width, marginBottom: 8}}>
        //                             <Text style={{ fontSize: 16, color: Colors.mist300,}}>{this.state.listing.spacePrice}/hr</Text>
        //                 </View>
                    
        //                     <Text  style={{fontSize: 24, flexWrap: 'wrap'}}>{this.state.listing.spaceName}</Text>
        //                     <Text style={{marginBottom: 8}}>No ratings yet</Text>
        //                     <View style={{flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8}}>
        //                         <Icon
        //                             iconName="user"
                                    
        //                             iconColor={Colors.cosmos300}
        //                             iconSize={16}
        //                             style={{marginRight: 8, marginTop: 4}}
        //                         />
        //                         <TouchableWithoutFeedback onPress={() => this.goToHostProfile()}><Text>Hosted by <Text style={{textDecorationLine: 'underline'}}>{this.state.host.firstname} {this.state.host.lastname.charAt(0).toUpperCase()}</Text>.</Text></TouchableWithoutFeedback>
        //                     </View>
                            
        //                     {this.state.listing.spaceBio.split("").length > 0 ? 
        //                     <View style={{flexDirection: 'row'}}>
        //                         <Icon
        //                             iconName="form"
        //                             iconLib="AntDesign"
        //                             iconColor={Colors.cosmos300}
        //                             iconSize={16}
        //                             style={{marginRight: 8, marginTop: 4}}
        //                         />
        //                         <Text style={{flex: 1}}>{this.state.listing.spaceBio}</Text>
        //                     </View>
        //                     : null}
                            
                    
                        

                        
        //                     <View style={{marginTop: 32}}>
        //                         <DayAvailabilityPicker 
        //                             availability={this.state.listing.availability}
        //                             availabilityCallback={() => {}}
        //                             editable={false}
        //                         />
        //                     </View>
                            
                        
        //                 </View>
        //             </ScrollView>
        //             <View style={styles.contentBox}>
        //                 <Button onPress={() => this.goToReserveSpace()} style = {{backgroundColor: Colors.tango700, height: 48}} textStyle={{color: 'white'}}>Reserve Space</Button>
        //             </View>
        //           </View>
        // )
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
})

export default externalSpace;