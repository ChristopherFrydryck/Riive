import React from 'react'
import {View, Text, StyleSheet, Dimensions} from 'react-native'

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import Foundation from 'react-native-vector-icons/Foundation'
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import AntDesign from 'react-native-vector-icons/AntDesign'
import Feather from 'react-native-vector-icons/Feather'
import Entypo from 'react-native-vector-icons/Entypo'


const Icon = ({iconLib, iconColor, iconName, iconSize, onPress, alignSelf, justifySelf, ...props }) => {
    const style = [styles.icon,  props.style || {}]
    const allProps = Object.assign({}, props,{style:style})  

    if(iconLib == "Ionicons"){
        return(
            <Ionicons {...allProps}   name={iconName} size={iconSize} color={iconColor} onPress={onPress} alignSelf={alignSelf} justifySelf={justifySelf} />
        )
    }else if(iconLib == "AntDesign"){
        return(
            <AntDesign {...allProps}   name={iconName} size={iconSize} color={iconColor} onPress={onPress} alignSelf={alignSelf} justifySelf={justifySelf} />
        )
    }else if(iconLib == "FontAwesome"){
        return(
            <FontAwesome {...allProps}   name={iconName} size={iconSize} color={iconColor} onPress={onPress} alignSelf={alignSelf} justifySelf={justifySelf} />
        )
    }else if(iconLib == "FontAwesome5"){
        return(
            <FontAwesome5 {...allProps}   name={iconName} size={iconSize} color={iconColor} onPress={onPress} alignSelf={alignSelf} justifySelf={justifySelf} />
        )
    }else if(iconLib == "MaterialCommunityIcons"){
        return(
            <MaterialCommunityIcons {...allProps}   name={iconName} size={iconSize} color={iconColor} onPress={onPress} alignSelf={alignSelf} justifySelf={justifySelf} />
        )
    }else if(iconLib == "MaterialIcons"){
        return(
            <MaterialIcons {...allProps}  name={iconName} size={iconSize} color={iconColor} onPress={onPress} alignSelf={alignSelf} justifySelf={justifySelf} />
        )
    }else if(iconLib == "Entypo"){
        return(
            <Entypo {...allProps}   name={iconName} size={iconSize} color={iconColor} onPress={onPress} alignSelf={alignSelf} justifySelf={justifySelf} />
        )
    }else if(iconLib == "EvilIcons"){
        return(
            <EvilIcons {...allProps}  name={iconName} size={iconSize} color={iconColor} onPress={onPress} alignSelf={alignSelf} justifySelf={justifySelf} />
        )
    }else if(iconLib == "Foundation"){
        return(
            <Foundation {...allProps} name={iconName} size={iconSize} color={iconColor} onPress={onPress} alignSelf={alignSelf} justifySelf={justifySelf} />
        )
    }else{
        return(
            <Feather {...allProps} name={iconName} size={iconSize} color={iconColor} onPress={onPress} alignSelf={alignSelf} justifySelf={justifySelf} />
        )
    }
}

const styles = StyleSheet.create({
    icon: {
        display: 'flex',
    }
})

export default Icon;