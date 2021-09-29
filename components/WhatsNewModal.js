import React, { Component, Children } from 'react'
import {View, StyleSheet, Dimensions, Modal, Button, Animated} from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

import Text from '../components/Txt'
import Icon from '../components/Icon'
import Image from '../components/Image'

import Colors from '../constants/Colors'


class Item extends Component{
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

class NewModal extends Component{
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
    
        console.log(newIndex)
        
    
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
            // <Modal style={{zIndex: 99999, elevation: 99999}} visible={this.props.visible} transparent={true}>
            //     <View style={{height: Dimensions.get('window').height, width:  Dimensions.get('window').width, backgroundColor: 'rgba(176, 176, 176, 0.33)', justifyContent: 'center'}}>
            //         <View style={{backgroundColor: 'white', borderRadius: 8, marginHorizontal: 8, paddingHorizontal: 16, paddingVertical: 16, height: Dimensions.get('window').height*(.7)}}>
            //             <ScrollView contentContainerStyle={{flex: 1, flexDirection: "column", backgroundColor: 'orange'}} alwaysBounceVertical={false} >
            //                 <View>
            //                     <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', paddingBottom: 8}}>
            //                         <Text numberOfLines={1} type="Medium" style={{fontSize: 28}}>{this.props.title || "What's New"}</Text>
            //                         <Icon 
            //                             iconName="x"
            //                             iconColor={Colors.cosmos500}
            //                             iconSize={28}
            //                             onPress={this.props.closeModal}
            //                             style={{flex: 0}}
            //                         />
            //                     </View>
            //                 </View>
                 
            //                 {this.props.children}
                            
            //             </ScrollView>
                        
            //         </View>

                    
            //     </View>
                
            // </Modal>
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
                
                  


                </View>
            </Modal>
            
        )
    }
}





export default NewModal

// style={{height: Dimensions.get('window').height, width:  Dimensions.get('window').width, position: 'absolute', zIndex: 99999999, backgroundColor: 'rgba(176, 176, 176, 0.33)'}}