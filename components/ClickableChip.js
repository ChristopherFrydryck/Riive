import React from 'react'
import { View, StyleSheet, TouchableHighlight, Dimensions, TouchableOpacity } from 'react-native';
import Text from '../components/Txt'
import FloatingCircles from './FloatingCircles';



const ClickableChip = ({ onPress, bgColor, textColor, ...props}) => {
    const style = [[styles.chip, {backgroundColor: bgColor}], props.style || {}]
    const allProps = Object.assign({}, props,{style:style})

    return(
        <View>
            <TouchableOpacity onPress={onPress} {...allProps}>
                {props.children ? 
                    <Text type="Medium" style={{alignSelf: "center", color: textColor}}>{props.children}</Text>
                : 
                    <View style={{flex: 1, alignItems: 'center'}}>
                        <FloatingCircles color={textColor || "white"} />
                    </View>
                }
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    chip:{
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: 50,
        alignContent: 'center',
      
    }
})

export default ClickableChip