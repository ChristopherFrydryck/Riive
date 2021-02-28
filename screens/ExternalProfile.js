import React, {Component} from 'react'
import {SafeAreaView, View, ScrollView, StyleSheet, Dimensions, StatusBar} from 'react-native'
import Button from '../components/Button'
import Text from '../components/Txt'
import Image from '../components/Image'
import ProfilePic from '../components/ProfilePic';
import ExternalSpacesList from '../components/ExternalSpacesList'
import TopBar from '../components/TopBar'
import Icon from '../components/Icon'
import Colors from '../constants/Colors'
import LinearGradient from 'react-native-linear-gradient'

import {Menu, Divider, Provider, Snackbar} from 'react-native-paper'

import * as firebase from 'firebase/app';
import firestore from '@react-native-firebase/firestore';

//MobX Imports
import {inject, observer} from 'mobx-react/native'

@inject("UserStore", "ComponentStore")
@observer
export default class ExternalProfile extends Component{

    

    constructor(props){
        super(props);

        this.state = {
            host: this.props.ComponentStore.selectedUser[0],
            space: this.props.ComponentStore.selectedExternalSpot[0],

            allListings: [],
            avgRating: null,
            numVisits: 0,
        }

    }

    async componentDidMount() {
        await this.getListings();
        await this.getListingStats();
        this._navListener = this.props.navigation.addListener('didFocus', () => {
            StatusBar.setBarStyle('light-content', true);
            Platform.OS === 'android' && StatusBar.setBackgroundColor(Colors.tango900);
          });

  
    }
    
    getListings = () => {
        const { host } = this.state
        const data = host.listings;
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
                    this.setState({allListings: listings})
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
                        this.setState({allListings: listingsData})
                    })
                }
            }
        // }
         
    }

    getListingStats = () => {
        let {allListings, avgRating} = this.state;
        let numVisits = 0
        let ratingTotal = 0;
        let ratingCount = 0;
        let finalRating = null;

        for(let i = 0; i < allListings.length; i++){
            numVisits += allListings[i].visits.length;
            if(allListings[i].ratings){
                for(let j = 0; j < ratings.length; j++){
                    ratingTotal += ratings[j]
                    ratingCount ++;
                }
            }

        }
        if(ratingCount > 0){
            finalRating = ratingTotal / ratingCount
        }

        this.setState({numVisits: numVisits, avgRating: finalRating})
    }


    componentWillUnmount() {
        this.props.ComponentStore.selectedUser.clear();
    }

    render(){
        let { host, space, allListings, numVisits, avgRating} = this.state;
        //  
        
        if(host && allListings){
            return(
            <View style={{flex: 1, backgroundColor: 'white'}}>
                <Provider>
                <SafeAreaView style={{ flexDirection: "column", backgroundColor: Colors.tango900}} />
                    <View style={{flex: 1}}>
                    <LinearGradient
                        colors={['#FF8708', '#FFB33D']}
                        style={styles.headerBox}
                    >
                    <TopBar style={{zIndex: 9999}}>
                            <Icon 
                                iconName="arrow-left"
                                iconColor="#FFFFFF"
                                iconSize={28}
                                onPress={() => this.props.navigation.goBack(null)}
                            />
                            <View style={{marginLeft: 'auto'}}>
                                <Menu
                                    visible={this.state.menuVisible}
                                    onDismiss={() => this.setState({menuVisible: false})}
                                    style={{marginLeft: 'auto'}}
                                    anchor={
                                        <Icon 
                                            iconName="more-vertical"
                                            iconColor="#FFFFFF"
                                            iconSize={24}
                                            onPress={() => this.setState({menuVisible: true})}
                                            style={{paddingLeft: 30, marginLeft: "auto"}}
                                        /> 
                                    }
                                >
                                    <Menu.Item onPress={() => {}} title="Block User" />
                                    <Menu.Item onPress={() => {}} title="Report User" />
                                </Menu>
                            </View>
                            
                            {/* <Icon 
                                iconName="more-vertical"
                                iconColor="#FFFFFF"
                                iconSize={24}
                                onPress={() => alert("pressed 2!")}
                                style={{marginLeft: "auto"}}
                            /> */}
                        </TopBar>
                        </LinearGradient>
                        <View style={{ flex: 0, paddingHorizontal: 16}}>
                            <View style={{flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start'}}>
                            <ProfilePic 
                                source={{uri: host.photo}}
                                style={{marginTop: -32}}
                                imgWidth={80}
                                imgHeight={80}
                                initals={host.firstname.charAt(0).toUpperCase() + "" + host.lastname.charAt(0).toUpperCase()}
                                fontSize={24}
                                fontColor="#1D2951"
                                alt="Your profile picture"
                            />
                                <View style={{flex: 1, marginLeft: 16, marginTop: -32,}}>
                                    <Text style = {{fontSize: 20, color: 'white'}} type="semiBold">{host.firstname} {host.lastname.charAt(0).toUpperCase()}.</Text>
                                    <Text style={{fontSize: 14, marginTop: 8}} numberOfLines={2} elipsizeMode="tail" >Hosting {space.spaceName} {host.listings.length - 1 > 1 ?`and ${host.listings.length - 1} others.` : host.listings.length - 1  == 1 ?  `and ${host.listings.length - 1} other.`: "."}</Text>
                                </View>
                            </View>
                            

                        {/* <Button onPress={() => this.props.navigation.goBack()}>Go Back</Button> */}
                        {/* <Button onPress={() => this.props.navigation.navigate('Profile')}>Go to Profile</Button> */}
                        </View>
                        <ScrollView style={{paddingTop: 8, marginTop: 16}}>
                            <View style={styles.container}>
                                <View style={{ backgroundColor: Colors.mist300, shadowColor: '#000', shadowOpacity: 0.6, shadowOffset:{width: 0, height: 0}, shadowRadius: 3, elevation: 12, height: 80, width: Dimensions.get("window").width - 32, padding: 16, flexDirection: 'row', justifyContent: 'space-around'}}>
                                    <View style={{flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                                        <Text type="bold" style={{fontSize: 24}}>{numVisits}</Text>
                                        <Text type="light" style={{fontSize: 16}}>Visitors</Text>
                                    </View>
                                    {avgRating ?
                                    <View style={{flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                                        <Text type="bold" style={{fontSize: 24}}>{avgRating}</Text>
                                        <Text type={"light"} style={{fontSize: 16}}>Total Rating</Text>
                                    </View>
                                    : null}
                                    <View style={{flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                                        <Text type="bold" style={{fontSize: 24}}>200</Text>
                                        <Text type="light" style={{fontSize: 16}}>Visitors</Text>
                                    </View>
                                </View>
                            </View>
                        
                            <View style={[styles.container, {marginTop: 8}]}>
                                {host.listings.length == 0 || host.listings.length <= 1 ? <Text style={styles.categoryTitle}>Hosted Space</Text> : <Text style={{fontSize: 20, marginRight: 'auto'}}>Hosted Spaces</Text>}
                            </View>
                            <ExternalSpacesList searchParams={this.props.navigation.state.params.homeState} listings={host.listings}/>
                        </ScrollView>
                    </View>
  
                </Provider>
                </View>
            )
        }else{
            return(
                <Text>Loading...</Text>
            )
        }
    }
}
const styles = StyleSheet.create({
    container:{
        paddingHorizontal: 16
    },
    categoryTitle: {
        fontSize: 20, 
        marginRight: 'auto'
    },
    headerBox: {
        // position: 'absolute',
        height: Dimensions.get("window").height /9,
        paddingBottom: 20,
        width: Dimensions.get('window').width,
        // borderWidth: 1,
        // borderBottomRightRadius: 20,
        // borderBottomLeftRadius: 20,
        position: "relative",
        
    },
})