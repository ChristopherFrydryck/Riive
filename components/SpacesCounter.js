import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from './Txt'
import Icon from './Icon'


const spacesCounter = ({onPress, iconLib, iconStyle, iconName, iconColor, iconSize, type, ...props}) => {
// ({ onPress, children}) => {
    const style = [styles.button,  props.style || {}]
  const allProps = Object.assign({}, props,{style:style})  
  const textStyle = [styles.text, props.textStyle || {}]
  const textProps = Object.assign({}, props,{style:textStyle})


        
            return(
                // <TouchableOpacity {...allProps} onPress={onPress}>
                //     <View style={{flexDirection: 'row', alignItems: 'center'}}>
                //         <Icon 
                //             iconLib={iconLib}
                //             iconName={iconName}
                //             iconColor={iconColor}
                //             iconSize={iconSize}
                //             style={iconStyle}
                                
                //                 />
                //         <Text {...textProps} type={type}>{props.children}</Text>
                //     </View>
                // </TouchableOpacity>
                <View style={{flexDirection: 'row', alignItems: "center"}}>
                    <Text>Hello</Text>
                    <Text>{props.value}</Text>
                    <Text>Hello</Text>
                </View>
            )
        }
        



const styles = StyleSheet.create ({
    button: {
        marginTop: 10,
        padding: 12,
        width: '100%',
        borderRadius: 4,
        alignItems: 'center',
        alignContent: "center",
        justifyContent: 'center',
        flexDirection: "row"
    },
    text: {
        
        fontSize: 18
    }
})

export default spacesCounter