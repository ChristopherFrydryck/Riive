import React, { Component } from 'react';
import { Platform, Animated, Dimensions, StatusBar, SafeAreaView, ScrollView, View, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import Colors from '../constants/Colors'

import MapView, {Marker} from 'react-native-maps';
import DayMap from '../constants/DayMap'
import NightMap from '../constants/NightMap'

import Button from '../components/Button'
import Text from '../components/Txt'
import Icon from '../components/Icon'




//MobX Imports
import {inject, observer} from 'mobx-react/native'


@inject("UserStore", "ComponentStore")
@observer
class ReservationConfirmed extends Component {

    static navigationOptions = {
        headerShown: false,
    }
    constructor(props){
        super(props);
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

    render(){
        const {width, height} = Dimensions.get("window")
        const { region, searchedAddress, searchInputValue, daySearched, timeSearched, locationDifferenceWalking, tripID, selectedSpace, cost } = this.props.navigation.state.params.homeState;
        
        return(
            <SafeAreaView style={styles.container}>
                
                <ScrollView 
                     bounces={false}
                     stickyHeaderIndices={[0]}
                    //  contentContainerStyle={{flex: 1}}
                >
                    <View style={{flex: 0, flexDirection: 'row', zIndex: -1, paddingTop: 16,}}>
                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 80}}>
                            <Icon 
                                iconName="checkcircleo"
                                iconLib="AntDesign"
                                iconColor={Colors.fortune700}
                                iconSize={48}
                                // onPress={() => this.editAccountModal(!this.state.editAccountModalVisible)}
                                
                            />
                            { daySearched.dayValue === new Date().getDay() ?
                            <Text style={{fontSize: 28, fontWeight: '500', paddingLeft: 16, color: Colors.fortune700, lineHeight: 32}}>See you at {timeSearched[0].labelFormatted}, {this.props.UserStore.firstname}.</Text>
                            : <Text style={{fontSize: 28, fontWeight: '500', paddingLeft: 16, color: Colors.fortune700, lineHeight: 32}}>See you on {daySearched.dayName}, {this.props.UserStore.firstname}.</Text>}    
                        </View>
                        <Text style={{fontSize: 16, textAlign: 'center', marginVertical: 16, paddingHorizontal: 24}}>We have emailed you a reciept at {this.props.UserStore.email}.</Text>
                    </View>
                    <View style={{backgroundColor: 'white', flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 32, paddingTop: 24, zIndex: 99,}}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <Text style={{fontSize: 24}}>Your Order</Text>
                            {daySearched.dayValue === new Date().getDay() ?
                                <Text>Today, {daySearched.monthNameAbbr} {daySearched.dateName} {daySearched.year}</Text>
                            :
                                <Text>{daySearched.dayName}, {daySearched.monthNameAbbr} {daySearched.dateName} {daySearched.year}</Text>
                            }
                            
                        </View>
                        <View>
                            <Text style={{color: Colors.cosmos300, opacity: .7}}>{tripID}</Text>
                        </View>
                        <View style={{flexDirection: 'row', alignItems: "flex-end", justifyContent: 'space-between', marginTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.mist900}}>
                            <View style={{flexDirection: 'column', alignItems: 'flex-start', flex: 3}}>
                                
                                <Text type="light" numberOfLines={1} style={{fontSize: 18}}>Arrival</Text>
                                <Text type="regular" numberOfLines={1} style={{fontSize: 24, color: Colors.tango700}}>{timeSearched[0].labelFormatted}</Text>
                            </View>
                            <Icon 
                                iconName="arrow-right"
                                iconColor={Colors.tango700}
                                iconSize={24}
                                iconLib="MaterialCommunityIcons"
                                style={{flex: 1}}
                            />
                            <View style={{flexDirection: 'column', alignItems: 'center', flex: 3}}>
                                <Text type="light" numberOfLines={1} style={{fontSize: 18}}>Departure</Text>
                                <Text type="regular" numberOfLines={1} style={{fontSize: 24, color: Colors.tango700}}>{timeSearched[1].labelFormatted}</Text>
                            </View>
                        </View>
                        <View style={{paddingVertical: 16, borderBottomColor: Colors.mist900, borderBottomWidth: 1, flexDirection: 'row'}}>
                            <MapView
                                provider={MapView.PROVIDER_GOOGLE}
                                mapStyle={NightMap}
                                style={{width: 100, height: 100, flex: 1, aspectRatio: 1/1,  marginRight: 16}}
                                region={{
                                    latitude: selectedSpace.region.latitude,
                                    longitude: selectedSpace.region.longitude,
                                    latitudeDelta: .25,
                                    longitudeDelta: .25,
                                    }}
                                pitchEnabled={false} 
                                rotateEnabled={false} 
                                zoomEnabled={false} 
                                scrollEnabled={false}
                            />
                            <View style={{flex: 2, justifyContent: 'space-between'}}>
                                <Text>{selectedSpace.address.full}</Text>
                                <Button onPress={() => this.openGps(selectedSpace.region.latitude, selectedSpace.region.longitude, selectedSpace.address.full)} style = {{backgroundColor: 'rgba(255, 193, 76, 0.3)', height: 48}} textStyle={{color: Colors.tango900, fontWeight: "500"}}>Get Directions</Button>
                            </View>
                        </View>
                        <View style={{paddingVertical: 16, borderBottomColor: Colors.mist900, borderBottomWidth: 1, flexDirection: 'column'}}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                                <Text>Parking Fare</Text>
                                <Text>{cost.price}</Text>
                            </View>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                                <Text>Service Fee</Text>
                                <Text>{cost.serviceFeeCents === 0 ? "Free" : cost.serviceFee}</Text>
                            </View>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                                <Text>Processing Fee</Text>
                                <Text>{cost.processingFeeCents === 0 ? "Free" : cost.processingFee}</Text>
                            </View>
                        </View>
                        <View style={{paddingVertical: 16, flexDirection: 'column'}}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                                <Text type="medium" numberOfLines={1} style={{fontSize: 24}}>Total (USD)</Text>
                                <Text type="medium" numberOfLines={1} style={{fontSize: 24}}>{cost.total}</Text>
                            </View>
                            <Text style={{fontSize: 12, lineHeight: Platform.OS === 'ios' ? 16 : 18}}>For more information in regards to our return policy or currency conversion, please visit our <Text style={{fontSize: 12, color: Colors.tango900}} onPress={() => this.props.navigation.navigate("TOS")}>Terms of Service</Text>. If you have a question, or you do not recall booking this parking experience, please contact us at support@riive.net.</Text>
                        </View>
                        <View style={{flexDirection: 'row'}}>
                            <Button onPress={() =>  this.props.navigation.navigate("Home")} style = {{flex: 1, height: 48, backgroundColor: Colors.tango900}} textStyle={{color: "white", fontWeight: "500"}}>Return to Map</Button>
                        </View>
                    </View>          
                </ScrollView>
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.mist500,
        flex: 1,
    }
})

export default ReservationConfirmed;