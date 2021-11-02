import React, { useState, useEffect, useRef } from 'react'
import { View, ScrollView } from 'react-native'

import Icon from '../components/Icon'
import Text from '../components/Txt'
import Colors from '../constants/Colors'

import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import config from 'react-native-config';

navigator.geolocation = require('@react-native-community/geolocation');

let AddressInput = ({...props}) => {
    const GooglePlacesRef = useRef();

    const initAddress = {
        full: null,
        line1: null,
        zip: null,
        city: null,
        state: null,
        state_abbr: null,
        country: null,
        country_abbr: null,
        county: null,
    }

    const initRegion = {
        latitude: null,
        longitude: null,
        latitudeDelta: null,
        longitudeDelta: null
    }

    const [searchedAddress, setSearchedAddress] = useState(false)
    const [address, setAddress] =  useState(initAddress)
    const [utc_offset, setUTCOffset] = useState(null)
    const [region, setRegion] =  useState(initRegion)
    const [addressError, setAddressError] = useState("")


    useEffect(() => {
        if(props.defaultValue){
            setSearchedAddress(true)
        }

        GooglePlacesRef?.current?.setAddressText(props.defaultValue || "");
    }, [])


    useEffect(() => {
        if(address.line1){
            props.returnValue({
                address: address,
                region: region,
                utc_offset: utc_offset
            })
        }

        
       
    }, [address])


    


    let onSelectAddress = (det) => {
        // console.log(det.formatted_address)
        // console.log(det.geometry.location.lat);
        // console.log(det.address_c omponents)

        console.log(det.description)
        var number = det.address_components.filter(x => x.types.includes('street_number'))[0]
        var street = det.address_components.filter(x => x.types.includes('route'))[0]
        var city = det.address_components.filter(x => x.types.includes('locality'))[0]
        var county = det.address_components.filter(x => x.types.includes('administrative_area_level_2'))[0]
        var state = det.address_components.filter(x => x.types.includes('administrative_area_level_1'))[0]
        var country = det.address_components.filter(x => x.types.includes('country'))[0]
        var zip = det.address_components.filter(x => x.types.includes('postal_code'))[0]
    
       

        if(number && street && city && county && state){
            GooglePlacesRef?.current?.setAddressText(`${number.long_name} ${street.short_name}, ${city.long_name} ${state.short_name} ${zip.short_name}`);

            let addressVal = {
                ...address,
                full: det.formatted_address,
                line1: `${number.long_name} ${street.short_name}`,
                zip: zip.long_name,
                city: city.long_name,
                state: state.long_name,
                state_abbr: state.short_name,
                country: country.long_name,
                country_abbr: country.short_name,
                county: county.long_name,
            }

            let region = {
                latitude: det.geometry.location.lat,
                longitude: det.geometry.location.lng,
                latitudeDelta: .006,
                longitudeDelta: .006
            }
            setSearchedAddress(true)
            setUTCOffset(det.utc_offset)
            setAddressError("")
            setRegion(region)
            setAddress(addressVal)
            
            return address
            
         
        }else{ 
          setAddressError("Select a valid address")
          clearAddress();
          return null
        }
      }

    let clearAddress = () => {
        GooglePlacesRef?.current?.setAddressText("")

        setSearchedAddress(false)
        setAddress(initAddress)
        setUTCOffset(null)
        setRegion(initRegion)
      }

    return(
        <View style={{height: 48, zIndex: 999999, overflow: 'visible', flex: 1}}>
            <View style={{position: 'absolute'}}>
                <ScrollView bounces={false} keyboardShouldPersistTaps="handled" horizontal={true} contentContainerStyle={{width: "100%", height: "100%", flexDirection: 'column'}}>
                    <GooglePlacesAutocomplete
                    placeholder={props.placeholder || 'Your Address...'}
                    
                    returnKeyType={'search'}
                    ref={GooglePlacesRef}
                    currentLocation={props.currentLocation || false}
                    minLength={2}
                    autoFocus={false}
                    listViewDisplayed={false}
                    fetchDetails={true}
                    onPress={(data, details = null) => {
                        onSelectAddress(details)
                    }}
                    textInputProps={{
                    clearButtonMode: 'never',
                    placeholderTextColor: Colors.mist900,
                    }}
                    renderRightButton={() => 
                    <Icon 
                        iconName="x"
                        iconColor={Colors.cosmos500}
                        iconSize={24}
                        onPress={() => clearAddress()}
                        style={{marginTop: 12, display: searchedAddress ? "flex" : "none"}}
                    />
                    }
                    query={{
                    key: config.GOOGLE_API_KEY,
                    language: 'en'
                    }}
                    GooglePlacesSearchQuery={{
                    rankby: 'distance',
                    types: 'address',
                    components: "country:us"
                    }}
                    nearbyPlacesAPI={'GoogleReverseGeocoding'}
                    debounce={200}
                    predefinedPlacesAlwaysVisible={true}
                    enablePoweredByContainer={false}
                    
                    
                    styles={{
                    container: {
                        border: 'none',
                        marginBottom: 8,
                    },
                    textInputContainer: {
                        width: '100%',
                        display: 'flex',
                        alignSelf: 'center',
                        backgroundColor: "white",
                        marginTop: -12,
                        borderColor: '#adadad',
                        borderBottomWidth: props.bottomBorder === false ? 0 : 2,
                        borderTopWidth: 0,
                        backgroundColor: "none",
                
                    },
                    textInput: {
                        paddingRight: 0,
                        paddingLeft: 0,
                        paddingBottom: 0,
                        color: Colors.apollo900,
                        backgroundColor: null,
                        fontSize: 18,
                        width: '100%',
                    },
                    listView:{
                        backgroundColor: 'white',

                    },
                    row:{
                        backgroundColor: 'none',
                    },
                    description: {
                        fontWeight: 'bold',
                    },
                    predefinedPlacesDescription: {
                        color: '#1faadb',
                    },
                    
                    
                    
                    }}
                    />
                    <Text style={{
                        paddingBottom: 0,
                        marginTop: -10,
                        color: 'red',
                        fontSize: 14,
                        fontWeight: '400',
                        width: 'auto'}}
                    >{addressError}</Text>
                </ScrollView>
             </View>
        </View>
    )
}

export default AddressInput