import React, { useState, useEffect, useRef } from 'react'
import { View, ScrollView } from 'react-native'

import Icon from '../components/Icon'
import Text from '../components/Txt'
import Colors from '../constants/Colors'

import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import config from 'react-native-config';

import { inject, observer } from 'mobx-react/native';

export let AddressInput = ({...props}) => {
    const GooglePlacesRef = useRef();

    const initAddress = {
        line1: "",
        zipCode: "",
        city: "",
        state: "",
        country: ""
    }

    const initRegion = {
        latitude: null,
        longitude: null,
        latitudeDelta: null,
        longitudeDelta: null
    }

    const [searchedAddress, setSearchedAddress] = useState(false)
    const [address, setAddress] =  useState(initAddress)
    const [region, setRegion] =  useState(initRegion)
    const [addressError, setAddressError] = useState("")


    useEffect(() => {
        if(props.defaultValue){
            setSearchedAddress(true)
        }

        GooglePlacesRef?.current?.setAddressText(props.defaultValue || null);
    }, [])


    useEffect(() => {
        if(address.line1){
            props.returnValue({
                address: address,
                region: region
            })
        }else{
            props.returnValue(null)
        }

        
       
    }, [address])


    


    let onSelectAddress = (det) => {
        // console.log(det.formatted_address)
        // console.log(det.geometry.location.lat);
        // console.log(det.address_c omponents)

        
        var number = det.address_components.filter(x => x.types.includes('street_number'))[0]
        var street = det.address_components.filter(x => x.types.includes('route'))[0]
        var city = det.address_components.filter(x => x.types.includes('locality'))[0]
        var county = det.address_components.filter(x => x.types.includes('administrative_area_level_2'))[0]
        var state = det.address_components.filter(x => x.types.includes('administrative_area_level_1'))[0]
        var country = det.address_components.filter(x => x.types.includes('country'))[0]
        var zip = det.address_components.filter(x => x.types.includes('postal_code'))[0]
      
       

        if(number && street && city && county && state){
            GooglePlacesRef?.current?.setAddressText(`${number.long_name} ${street.short_name}, ${city.long_name} ${state.short_name} ${zip.short_name}`);

            let address = {
                line1: `${number.long_name} ${street.short_name}`,
                zipCode: zip.short_name,
                city: city.long_name,
                state: state.short_name,
                country: country.short_name
            }

            let region = {
                latitude: det.geometry.location.lat,
                longitude: det.geometry.location.lng,
                latitudeDelta: .006,
                longitudeDelta: .006
            }
            setSearchedAddress(true)
            setAddressError("")
            setRegion(region)
            setAddress(address)
            
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
        setRegion(initRegion)
      }

    return(
        <View style={{height: 48, zIndex: 999999, overflow: 'visible', flex: 1}}>
            <View style={{position: 'absolute'}}>
                <ScrollView bounces={false} keyboardShouldPersistTaps="handled" horizontal={true} contentContainerStyle={{width: "100%", height: "100%", flexDirection: 'column'}}>
                    <GooglePlacesAutocomplete
                    placeholder='Your Address...'
                    
                    returnKeyType={'search'}
                    ref={GooglePlacesRef}
                    currentLocation={false}
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
                        style={{marginTop: 8, display: searchedAddress ? "flex" : "none"}}
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
                    // GooglePlacesDetailsQuery={{ fields: 'geometry', }}
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
                        borderBottomWidth: 2,
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

// @inject("UserStore", "ComponentStore")
// @observer
// class AddressInput extends React.Component {
//     constructor(props){
//         super(props);

//         this.state = {
//             searchedAddress: false,
//             address: {
//                 line1: this.props.UserStore.address.line1,
//                 line2: this.props.UserStore.address.line2 ? this.props.UserStore.address.line2.split(" ")[1] : "",
//                 line2Prefix: this.props.UserStore.address.line2 ? this.props.UserStore.address.line2.split(" ")[0] : "Apartment",
//                 zipCode: this.props.UserStore.address.postal_code,
//                 city: this.props.UserStore.address.city,
//                 state: this.props.UserStore.address.state,
//                 country: this.props.UserStore.address.country
//               },
//               region:{
//                 latitude: null,
//                 longitude: null,
//                 latitudeDelta: .006,
//                 longitudeDelta: .006
//               },
//               addressError: "",
//         }

//     }

//     componentDidMount = () => {
//         console.log("MOUNTED")
//         this.GooglePlacesRef.current.setAddressText("HELLo")
//     }

//     componentDidUpdate = (prevProps, prevState) => {
//         if(prevState.searchedAddress !== this.state.searchedAddress){
//             console.log("UHHH")
//         }
//     }

    // clearAddress = () => {
    //     this.GooglePlacesRef.setAddressText("")
    //     this.setState({
    //       searchedAddress: false,
    //       region:{
    //         latitude: null,
    //         longitude: null,
    //         latitudeDelta: .006,
    //         longitudeDelta: .006
    //       },
    //       address: {
    //         ...this.state.address,
    //         line1: "",
    //         zipCode: "",
    //         city: "",
    //         state: "",
    //         country: ""
    //       }
    //     })
    //   }


    //   onSelectAddress = async(det) => {
    //     // console.log(det.formatted_address)
    //     // console.log(det.geometry.location.lat);
    //     // console.log(det.address_c omponents)

    //     console.log(det)
      
        
    //     var number = det.address_components.filter(x => x.types.includes('street_number'))[0]
    //     var street = det.address_components.filter(x => x.types.includes('route'))[0]
    //     var city = det.address_components.filter(x => x.types.includes('locality'))[0]
    //     var county = det.address_components.filter(x => x.types.includes('administrative_area_level_2'))[0]
    //     var state = det.address_components.filter(x => x.types.includes('administrative_area_level_1'))[0]
    //     var country = det.address_components.filter(x => x.types.includes('country'))[0]
    //     var zip = det.address_components.filter(x => x.types.includes('postal_code'))[0]
      
    //     if(number && street && city && county && state){
    //     //   console.log(number)
    //     //   console.log(street)
    //     //   console.log(city)
    //     //   console.log(county)
    //     //   console.log(state)
    //     //   console.log(country)
    //     //   console.log(zip)
    //       this.setState({
    //         searchedAddress: true,
    //         addressError: "",
    //         region:{
    //             latitude: det.geometry.location.lat,
    //             longitude: det.geometry.location.lng,
    //             latitudeDelta: .006,
    //             longitudeDelta: .006
    //           },
    //         address:{
    //           ...this.state.address,
    //           line1: `${number.long_name} ${street.short_name}`,
    //           zipCode: zip.short_name,
    //           city: city.long_name,
    //           state: state.short_name,
    //           country: country.short_name
    //         }
    //       })

          
      
          
         
    //     }else{ 
    //       this.clearAddress();
    //       return null
    //     }
    //   }

//     render(){
//         return(
            // <ScrollView horizontal={true} contentContainerStyle={{flexGrow: 1, width: '100%', height: '100%', flexDirection: 'column'}} >
            // <GooglePlacesAutocomplete
            // placeholder='Your Address...'
            
            // returnKeyType={'search'}
            // ref={(instance) => { this.GooglePlacesRef = instance }}
            // currentLocation={false}
            // minLength={2}
            // autoFocus={false}
            // listViewDisplayed={false}
            // fetchDetails={true}
            // onPress={(data, details = null) => this.onSelectAddress(details)}
            // textInputProps={{
            //   clearButtonMode: 'never',
            //   placeholderTextColor: Colors.mist900,
            // }}
            // renderRightButton={() => 
            //   <Icon 
            //     iconName="x"
            //     iconColor={Colors.cosmos500}
            //     iconSize={24}
            //     onPress={() => this.clearAddress()}
            //     style={{marginTop: 8, display: this.state.searchedAddress ? "flex" : "none"}}
            //   />
            // }
            // query={{
            //   key: config.GOOGLE_API_KEY,
            //   language: 'en'
            // }}
            // GooglePlacesSearchQuery={{
            //   rankby: 'distance',
            //   types: 'address',
            //   components: "country:us"
            // }}
            // // GooglePlacesDetailsQuery={{ fields: 'geometry', }}
            // nearbyPlacesAPI={'GoogleReverseGeocoding'}
            // debounce={200}
            // predefinedPlacesAlwaysVisible={true}
            // enablePoweredByContainer={false}
            
            
            // styles={{
            //   container: {
            //     border: 'none',
            //     marginBottom: 8,
            //   },
            //   textInputContainer: {
            //     width: '100%',
            //     display: 'flex',
            //     alignSelf: 'center',
            //     backgroundColor: "white",
            //     marginTop: -6,
            //     borderColor: '#adadad',
            //     borderBottomWidth: 2,
            //     borderTopWidth: 0,
            //     backgroundColor: "none"
            //   },
            //   textInput: {
            //     paddingRight: 0,
            //     paddingLeft: 0,
            //     paddingBottom: 0,
            //     color: Colors.apollo900,
            //     backgroundColor: null,
            //     fontSize: 18,
            //     width: '100%'
            //   },
            //   description: {
            //     fontWeight: 'bold'
            //   },
            //   predefinedPlacesDescription: {
            //     color: '#1faadb'
            //   },
              
            // }}
            // />
            // </ScrollView>
//         )
//     }
// }