import React, { PureComponent, Children } from 'react'
import {View, StyleSheet, Dimensions, Modal, Button, Animated, Platform, Vibration} from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

import Text from '../components/Txt'
import Icon from '../components/Icon'
import Image from '../components/Image'

import Colors from '../constants/Colors'
import { version } from '../package.json'

import storage from '@react-native-firebase/storage'
import firestore from '@react-native-firebase/firestore'
import auth, { firebase } from '@react-native-firebase/auth';

import config from 'react-native-config'


class Item extends PureComponent{
    render(){
        return (
            <ScrollView style={{maxWidth: '100%'}}>
                {this.props.image ?
                    <Image 
                        style={{paddingBottom: 8}}
                        aspectRatio={16/9}
                        source={{uri: this.props.image}}
                        resizeMode={'cover'}
                    /> 
                    : null
                }
                        <View>
                            {this.props.children}
                        </View>
                        

                        </ScrollView>
        );
    }
    
}

export class WhatsNewModal extends PureComponent{
    static Item = Item

    constructor(props){
        super(props);

        this.state = {
            currentActivePhoto: 0,
        }
    }

   

    carouselUpdate = (xVal) => {
        const {width} = Dimensions.get('window')
    
        let newIndex = Math.round(xVal/width)
    
        // console.log(newIndex)
        
    
        this.setState({currentActivePhoto: newIndex})
    }
    
    renderDotsView = (numItems, position) =>{
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

    render(){
    
        let {width, height} = Dimensions.get("window")
        return(
            <Modal style={{zIndex: 99999, elevation: 99999}} visible={this.props.visible} transparent={true}>
                <View style={{height: Dimensions.get('window').height, width:  Dimensions.get('window').width, backgroundColor: 'rgba(176, 176, 176, 0.33)', justifyContent: 'center'}}>
                    <View style={{backgroundColor: 'white', borderRadius: 8, marginHorizontal: 8, paddingHorizontal: 16, paddingVertical: 16, height: Dimensions.get('window').height*(.7)}}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', paddingBottom: 8}}>
                                   <Text numberOfLines={1} type="Medium" style={{fontSize: 28}}>{this.props.title || "What's New"}</Text>
                                   <Icon 
                                        iconName="x"
                                        iconColor={Colors.cosmos500}
                                        iconSize={28}
                                        onPress={this.props.closeModal}
                                        style={{flex: 0}}
                                    />
                                </View>
                                {this.props.children.length > 1 ?
                                <View style={{flex: 1}}>
                                    <ScrollView 
                                        horizontal={true}
                                        pagingEnabled={true}
                                        scrollEnabled={true}
                                        decelerationRate={0}
                                        snapToAlignment="start"
                                        snapToInterval={width - 48}
                                        onScroll={data =>  this.carouselUpdate(data.nativeEvent.contentOffset.x)}
                                        scrollEventThrottle={1}
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={{ width: (width-48) * this.props.children.length }}
                                    >   
                                        {this.props.children}
                                    </ScrollView>
                                    <View style={{ flex: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16,}}>
                                        {this.renderDotsView(this.props.children.length, this.state.currentActivePhoto)}
                                    </View>
                                </View>
                                : this.props.children}
                    </View>
                </View>
            </Modal>
            
        )
    }
}

export let checkWhatsNew = (versionsUsed) => {
     const storageRef = storage().ref().child("dev-team/changelog.json")

        return storageRef.getDownloadURL().then((url) => {
            let details = fetch(url)
            return details
        }, (err) => {
            return err
        }).then((res) => {
            return res.json()
        }).then(async (res) => {

            // let currentVersionMajor = parseInt(version.split('.')[0]);
            // let currentVersionMinor = parseInt(version.split('.')[1]);
            // let currentVersionPatch = parseInt(version.split('.')[2]);

            let userVersionMajor = parseInt(versionsUsed[versionsUsed.length - 1].major);
            let userVersionMinor = parseInt(versionsUsed[versionsUsed.length - 1].minor);
            let userVersionPatch = parseInt(versionsUsed[versionsUsed.length - 1].patch);

            var V = res.versions.filter(x => x.release == version)[0]

            var versionsBetween = res.versions.filter(verz => verz.isReleased == true && verz.major >= userVersionMajor && verz.minor >= userVersionMinor && verz.patch > userVersionPatch)

            console.log(versionsBetween.map(x => x.release))

            for(let i = 0; i < versionsBetween.length; i++){
                    if(i + 1 == versionsBetween.length){
                        await addVersionToUserDB(versionsBetween[i].release);
                    }

         

            
                const settings = {
                    method: 'POST',
                    headers: {
                        Accept: 
                            'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            user_id: auth().currentUser.uid,
                            major: parseInt(versionsBetween[i].major),
                            minor: parseInt(versionsBetween[i].minor),
                            patch: parseInt(versionsBetween[i].patch),
                    })
                }
                        
                    await fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/newVersionUpdate`, settings).then(response => {
                          return response
                    }).then(response => {

                          if(response.status == 200){
                            return response
                          }else{
                            throw response
                          }      
                    }).catch(e => {
                        // console.warn(e)
                        throw e
                    })
            }
                    
                return versionsBetween.length > 0 ? versionsBetween[versionsBetween.length - 1] : null

        }).catch(e => {
            console.error(e)
        })
        
  }

export let addVersionToUserDB = (version) => {
    const db = firestore()
     const user = db.collection('users').doc(auth().currentUser.uid)

     user.update({
         versions: firebase.firestore.FieldValue.arrayUnion({
            code: version,
            dateAdded: new Date(),
            major: parseInt(version.split(".")[0]),
            minor: parseInt(version.split(".")[1]),
            patch: parseInt(version.split(".")[2])
         })
     })
  }