import React from 'react'
import { View, Text, StyleSheet, TouchableHighlight, Dimensions, TouchableOpacity } from 'react-native';
import { Marker } from 'react-native-maps';

import Color from '../constants/Colors'


const ListingMarker = ({ onPress, listing, ...props}) => {
    const style = [[styles.chip], props.style || {}]
    const allProps = Object.assign({}, props,{style:style})
    return(
            <Marker 
                key={listing.listingID}
                anchor={{x: 0.5, y: 0.5}} // For Android          
                coordinate={{
                    latitude: listing.region.latitude,
                    longitude: listing.region.longitude,
                }} 
                // title={listing.spaceName}
                style={{display: 'flex', alignItems: 'center'}}
                onPress={onPress}
            >
                <View
                    {...allProps}
                >
                    <Text style={{color: "white"}}>{listing.spacePrice}</Text>
                    
                </View>
                <View style={styles.triangle} />
            </Marker>
    )
}

const styles = StyleSheet.create({
    chip:{
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: 50,
        backgroundColor: Color.tango900,
        alignContent: 'center',
      
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: Color.tango900,
        zIndex: 99,
    },
})

export default ListingMarker