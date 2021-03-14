import React, {Component} from 'react'
import {StyleSheet, TouchableOpacity} from 'react-native'

import Text from '../components/Txt'
import Colors from '../constants/Colors'

export default class FilterButton extends Component{
    render(){
        return(
            <TouchableOpacity onPress={() => this.setState(this.props.onPress)} disabled={this.props.disabled ? true : false} style={this.props.searchFilterOpen ? styles.filterButtonOpen : styles.filterButtonClosed}>
                {/* {this.props.searchFilterOpen ?
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'}}>
                    <Text style={{paddingRight: 8}}>Close Filters</Text>
                    <Icon iconSize={24} iconName="arrow-up"/>                
                </View>
                
                : */}
                <Text numberOfLines={2} style={{fontSize: 13, lineHeight: 16}}>{`${this.props.daySearched.dayName}  \n${this.props.timeSearched[0].labelFormatted} to ${this.props.timeSearched[1].labelFormatted}`}</Text>
                {/* } */}
                
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    filterButtonClosed:{
        flex: 0,
        alignItems: 'flex-end',
        borderLeftWidth: 5, 
        borderLeftColor: Colors.tango900, 
        paddingLeft: 8, 
        marginLeft: 8, 
    },
    filterButtonOpen:{
        flex: 1,
        paddingVertical: 8,
    },
})