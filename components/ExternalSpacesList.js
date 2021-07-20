import React from 'react'
import { View, StyleSheet, TouchableOpacity, Dimensions, FlatList, Animated } from 'react-native';
import Text from './Txt'
import Colors from '../constants/Colors'
import Icon from '../components/Icon'
import Image from '../components/Image'
import { withNavigation } from 'react-navigation';

import { inject, observer } from 'mobx-react/native';

//For Shimmer
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient'
import Svg, {Circle, Rect} from 'react-native-svg'

// Firebase imports
import * as firebase from 'firebase/app';
import firestore from '@react-native-firebase/firestore';





@inject("UserStore", "ComponentStore")
@observer
class ExternalSpacesList extends React.Component{

    constructor(props){
        
        super(props);
        
        this.state = {
            data: this.props.listings,
            activeTimeFadeAnimation: new Animated.Value(0),
        }
        
    }

    async componentDidMount(){
        await this.getListings();
        

        // this.setState({data: this.props.listings})
        this.props.ComponentStore.spotsLoaded = true;
        this.fadeAnimation();
        

        
    }

    // componentDidUpdate(prevProps){
    //     if(prevProps.listings !== this.props.listings){
    //         this.setState({          
    //             data: this.props.listings
    //         });
    //     }
    // }


    getListings = () => {
        const { data } = this.state;
        const db = firestore();

        
        
        // if(doc.exists){

            if(data.length > 0 && data.length <= 10){
                db.collection("listings").where(firestore.FieldPath.documentId(), "in", data).get().then((qs) => {
                    let listingsData = [];
                    for(let i = 0; i < qs.docs.length; i++){
                        listingsData.push(qs.docs[i].data())
                    }
                    return listingsData;
                }).then((listings) => {
                    this.setState({data: listings})
                })
            }else{
                let allArrs = [];
                var listingsData = [];
                while(data.length > 0){
                    allArrs.push(data.splice(0, 10))
                }
                for(let i = 0; i < allArrs.length; i++){
                    db.collection('listings').where(firestore.FieldPath.documentId(), "in", allArrs[i]).get().then((qs) => {
                    for(let i = 0; i < qs.docs.length; i++){
                        listingsData.push(qs.docs[i].data())
                    }
                        return listingsData
                    }).then((listingsData) => {
                        this.setState({data: listingsData})
                    })
                }
            }
        // }
         
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

    selectSpace = (spot) => {
            // console.log(spot.listingID)
            this.props.ComponentStore.selectedExternalSpot = []
            this.props.ComponentStore.selectedExternalSpot.push({
                ...spot
            })
           
            this.props.navigation.navigate("ExternalSpace", {
                homeState: {
                    ...this.props.searchParams,
                    selectedSpace : spot,
                }
            })


    }

    scrollToIndex = (listingID) => {
        if(this.state.data[0].listingID){
           var orderedData = this.state.data.slice().sort((a, b) => b.created - a.created)
           let indexPosition = orderedData.map(x => x.listingID).indexOf(listingID)
           if(indexPosition != -1){
            this.spacesRef.scrollToIndex({animated: false, index: indexPosition, viewOffset: 0})
           }else{
            this.spacesRef.scrollToIndex({animated: false, index: 0, viewOffset: 0})
           }

    
        }
    }

   

    renderSpaceCard = (spot, index) => {
        var dayToday = new Date().getDay()
        var hourToday = new Date().getHours()
        
        // Check if we have data
        if(this.state.data[0].listingID){
            var orderedData = this.state.data.slice().sort((a, b) => b.created - a.created)
          
            let currentActive = orderedData[index].availability[dayToday].data.filter((x) => parseInt(x.start.substring(0,2)) <= hourToday && parseInt(x.end.substring(0,2)) >= hourToday);

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
            
            return(
                <TouchableOpacity
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
                    {currentActive[0].available ? 
                        <View style={{flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 12, left: 0, backgroundColor: 'white', paddingVertical: 4, paddingHorizontal: 8, borderTopRightRadius: 4, borderBottomRightRadius: 4}}>
                            <Animated.View style={{opacity: this.state.activeTimeFadeAnimation, width: 8, height: 8, backgroundColor: Colors.fortune500, borderRadius: Dimensions.get("window").width/2, marginRight: 8}}/>
                            <Text style={{color: Colors.fortune500}}>Available Now</Text>
                        </View>
                        : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap', padding: 8}}>
                    <View style={{flexDirection: "column"}}>
                        <View style={{ width: 95, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.fortune500, paddingVertical: 4, paddingHorizontal: 4, borderRadius: Dimensions.get("window").width / 2, marginBottom: 8, marginTop: -30}}>
                            <Text style={{ fontSize: 14, color: Colors.mist300,}}>{spot.spacePrice}/hr</Text>
                        </View>
                        <Text style={{fontSize: 16, paddingRight: 24}} numberOfLines={1}>{spot.spaceName}</Text>
                    </View>
                    <View style={{position:"absolute", right:0}}>
                        <Icon 
                            iconName="chevron-right"
                            iconColor={Colors.mist900}
                            iconSize={28}
                        />
                    </View>

                </View>
            
            
            </TouchableOpacity> 
            )
        }else{
            return(
            <View style={[styles.container, {flexDirection: 'row', justifyContent: 'space-evenly', marginLeft: 16}]}>
                    <SvgAnimatedLinearGradient width={Dimensions.get('window').width} height="160">
                        <Rect x="0" width={Dimensions.get('window').width * .75} height="160" rx="4" ry="4" />
                        <Rect x={Dimensions.get('window').width * .75 + 16} width={Dimensions.get('window').width * .75} height="160" rx="4" ry="4" />
                    </SvgAnimatedLinearGradient>
                </View>
            )
        }
        // let currentActive = orderedData[index].availability[dayToday].data.filter((x) => parseInt(x.start.substring(0,2)) <= hourToday && parseInt(x.end.substring(0,2)) >= hourToday)


       
    }

    render(){
        let {spotsLoaded} =  this.props.ComponentStore;
        var dayToday = new Date().getDay()
        var hourToday = new Date().getHours()
        var orderedData = this.state.data.slice().sort((a, b) => b.created - a.created)
        var {width} = Dimensions.get('window');
        
        

        // console.log((16 * (orderedData.length - 2) + 48)/orderedData.length)

        if(this.state.data.length == 1){
        return(
        <View style={styles.container}>
                        
            {this.renderSpaceCard(this.state.data[0], 0)} 
               
        </View>
            
        )}else if(this.state.data.length > 1){
   

           
            return(
            <View style={styles.container}>
                <FlatList
                    ref={(ref) => { this.spacesRef = ref; }}
                    data={orderedData}
                    renderItem={({item, index}) => this.renderSpaceCard(item, index)}
                    keyExtractor={(item, index) => index.toString()}
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

export default withNavigation(ExternalSpacesList);