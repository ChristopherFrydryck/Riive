import React from 'react'
import { View, StyleSheet, TouchableOpacity, Dimensions, FlatList, Animated } from 'react-native';
import Text from './Txt'
import Colors from '../constants/Colors'
import Icon from '../components/Icon'
import Image from '../components/Image'


import { withNavigation } from 'react-navigation';

import { inject, observer } from 'mobx-react';

//For Shimmer
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient'
import Svg, {Circle, Rect} from 'react-native-svg'

// Firebase imports
import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging'
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage'
import 'firebase/firestore';
import 'firebase/auth';




@inject("UserStore", "ComponentStore")
@observer
class SpacesList extends React.Component{

    constructor(props){
        super(props);
        this.state = {
            data: this.props.UserStore.listings,
            activeTimeFadeAnimation: new Animated.Value(0),
            refresh: true,
        }
    }

    async componentDidMount(){
        this.setState({data: this.props.UserStore.listings})
        this.props.ComponentStore.spotsLoaded = true;
        this.fadeAnimation();

        this._navListener = this.props.navigation.addListener('didFocus', () => {
            // Updates component on every focus of it.
            this.forceUpdate();
        })

        
    }

    componentDidUpdate(prevProps){
        console.log(`Prevprops: ${prevProps.listings.length}, current props: ${this.props.listings.length}`)
        if(prevProps.listings !== this.props.listings){
            console.log("TRUE")
            // this.setState({          
            //     data: this.props.UserStore.listings
            // });
           
        }
    }

 

    fadeAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(          // Animate over time
                    this.state.activeTimeFadeAnimation, // The animated value to drive
                    {
                        toValue: 1,           // Animate to opacity: 1 (opaque)
                        duration: 1000,       // 2000ms
                    }),
                    Animated.timing(          // Animate over time
                        this.state.activeTimeFadeAnimation, // The animated value to drive
                        {
                            toValue: 0,           // Animate to opacity: 1 (opaque)
                            duration: 1000,       // 2000ms
                        }),
            ]) 
        ).start();                  
    }

    selectSpace = async(spot) => {

            this.props.ComponentStore.selectedSpot = [];
            this.props.ComponentStore.selectedSpot.push({
                listingID: spot.listingID,
                address: spot.address,
                region: spot.region,
                photo: spot.photo,
                spaceName: spot.spaceName,
                spaceBio: spot.spaceBio,
                spacePrice: spot.spacePrice,
                spacePriceCents: spot.spacePriceCents,
                numSpaces: spot.numSpaces,
                availability: spot.availability,

                // Integrated version 1.0.0
                hidden: spot.hidden,
                toBeDeleted: spot.toBeDeleted,
                deleteDate: spot.deleteDate,
                visits: spot.visits,
            })
            // console.log(this.props.ComponentStore.selectedSpot[0].spaceName)
            this.props.navigation.navigate("EditSpace")
         
           
       
        
        
    }

    renderSpaceCard = (spot, index) => {
        var dayToday = new Date().getDay()
        var hourToday = new Date().getHours()
        var currentDate = new Date().getTime()
        var orderedData = this.state.data.slice().sort((a, b) => b.created - a.created).filter(x => x.deleteDate > currentDate || !x.deleteDate)

        
        
        let currentActive = orderedData[index].availability[dayToday].data.filter((x) => parseInt(x.start.substring(0,2)) <= hourToday && parseInt(x.end.substring(0,2)) >= hourToday)

        // console.log(`${spot.spaceName} is hidden? ${spot.hidden}`)

       let cardStyle
       if(orderedData.length > 1){
            if(index === 0){
                cardStyle = [styles.li, styles.li_first]
            }else if(index === orderedData.length - 1){
                cardStyle = [styles.li, styles.li_last]
            }else{
                cardStyle = styles.li
            }
       }else{
           cardStyle = styles.li_single
       }


       if(spot.deleteDate){
            var deleteDate = new Date(spot.deleteDate);
            // Add 8 days to date
            // deleteDate.setDate(deleteDate.getDate() + 8);
       }
    //    console.log(`${spot.spaceName} is set to be deleted on ${deleteDate}`)
       
       
        return(
        <TouchableOpacity
        // disabled={spot.toBeDeleted}
        key={spot.listingID}
        style={cardStyle}
        onPress = {() => this.selectSpace(spot)}
        >
        <View style={styles.image}>
            <Image 
                aspectRatio={21/9}
                source={{uri: spot.photo}}
                resizeMode={'cover'}
            /> 
            {currentActive[0].available && !spot.hidden  && !spot.toBeDeleted ? 
                <View style={{flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 12, left: 0, backgroundColor: 'white', paddingVertical: 4, paddingHorizontal: 8, borderTopRightRadius: 4, borderBottomRightRadius: 4}}>
                    <Animated.View style={{opacity: this.state.activeTimeFadeAnimation, width: 8, height: 8, backgroundColor: Colors.fortune500, borderRadius: Dimensions.get("window").width/2, marginRight: 8}}/>
                    <Text style={{color: Colors.fortune500}}>Available Now</Text>
                </View>
                : 
                spot.toBeDeleted ?
                <View style={{flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 12, left: 0, backgroundColor: 'white', paddingVertical: 4, paddingHorizontal: 8, borderTopRightRadius: 4, borderBottomRightRadius: 4}}>
                    <Icon 
                        iconName="delete"
                        iconLib="MaterialCommunityIcons"
                        iconColor={Colors.hal500}
                        iconSize={15}
                    />
                    <Text style={{color: Colors.hal500, marginLeft: 4}}>Deleting on {String(deleteDate).split(" ")[1] + " " + String(deleteDate).split(" ")[2]}</Text>
                </View>
                :
                spot.hidden ? 
                    <View style={{flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 12, left: 0, backgroundColor: 'white', paddingVertical: 4, paddingHorizontal: 8, borderTopRightRadius: 4, borderBottomRightRadius: 4}}>
                        <Icon 
                            iconName="pause"
                            iconLib="Ionicons"
                            iconColor={Colors.tango900}
                            iconSize={15}
                        />
                        <Text style={{color: Colors.tango900, marginLeft: 4}}>Paused</Text>
                    </View>
                : null }
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap', padding: 8}}>
            {/* <Icon
                iconName="navigation"
                iconColor={Colors.apollo500}
                iconSize={28}
                style={{marginRight: 8}}
                
            /> */}
            <View style={{flexDirection: "column"}}>
            {spot.spaceName.length <= 28 ?
            <Text style={{fontSize: 16}}>{spot.spaceName}</Text>
            : <Text style={{fontSize: 16}}>{spot.spaceName.substring(0, 28) + "..."}</Text>}
            {spot.address.full.length <= 28 ?
            <Text style={{fontSize: 16}}>{spot.address.full}</Text>
            : <Text style={{fontSize: 16}}>{spot.address.full.substring(0, 28) + "..."}</Text>}
            </View>
            {spot.toBeDeleted ? null :
            <View style={{position:"absolute", right:0}}>
                
                <Icon 
                    iconName="chevron-right"
                    iconColor={Colors.mist900}
                    iconSize={28}
                />
            </View>
             }
        </View>
       
       
    </TouchableOpacity> 
        )
    }

    render(){

        let {spotsLoaded} =  this.props.ComponentStore;
        var dayToday = new Date().getDay()
        var hourToday = new Date().getHours()
        var currentDate = new Date().getTime()
        var orderedData = this.state.data.slice().sort((a, b) => b.created - a.created).filter(x => x.deleteDate > currentDate || !x.deleteDate)
        var {width} = Dimensions.get('window');


        if(spotsLoaded && orderedData.length == 1){
        return(
        <View style={styles.container}>
                        
            {this.renderSpaceCard(this.state.data[0], 0)} 
               
        </View>
            
        )}else if(spotsLoaded && orderedData.length > 1){
   

           
            return(
            <View style={styles.container}>
                <FlatList
                    data={orderedData}
                    renderItem={({item, index}) => this.renderSpaceCard(item, index)}
                    keyExtractor={item => item.listingID}
                    horizontal={true}
                    snapToAlignment={"center"}
                    snapToOffsets={[...Array(orderedData.length)].map((x, i) => i * (width*.75) - 40 + 16*i)}
                    decelerationRate={"fast"}
                    bounces={true}
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                />
            </View>
            )
        }else if(!spotsLoaded && orderedData.length > 1){
            return(
                <View style={[styles.container, {flexDirection: 'row', justifyContent: 'space-evenly', marginLeft: 16}]}>
                    <SvgAnimatedLinearGradient width={Dimensions.get('window').width} height="160">
                        <Rect x="0" width={Dimensions.get('window').width * .75} height="160" rx="4" ry="4" />
                        <Rect x={Dimensions.get('window').width * .75 + 16} width={Dimensions.get('window').width * .75} height="160" rx="4" ry="4" />
                    </SvgAnimatedLinearGradient>
                </View>
            )
        }else{
            return(
              null
            )
        }
    
    }
}



const styles = StyleSheet.create({
    container:{
        marginTop: 8,
    },
    image: {
        overflow: 'hidden',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
       
    },
    li_single:{
        width: Dimensions.get("window").width *.95,
        marginLeft: 8,
        marginRight: 8,
        backgroundColor: 'white',
        shadowColor: '#000', 
          shadowOpacity: 0.6, 
          shadowOffset:{width: 2, height: 2}, 
          shadowRadius: 3, 
          elevation: 12,
          borderRadius: 4,
          marginVertical: 8
    },
    li: {
        width: Dimensions.get("window").width * .75,
        marginLeft: 8,
        marginRight: 8,
        backgroundColor: 'white',
        shadowColor: '#000', 
          shadowOpacity: 0.6, 
          shadowOffset:{width: 2, height: 2}, 
          shadowRadius: 3, 
          elevation: 12,
          borderRadius: 4,
          marginVertical: 8
        
       
    },
    li_first: {
        marginLeft: 16,
    },
    li_last: {
        marginRight: 16,
    }
})

export default withNavigation(SpacesList);