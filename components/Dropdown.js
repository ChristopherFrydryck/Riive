import React from 'react'
import {View, Picker, StyleSheet, Platform, Dimensions, SafeAreaView} from 'react-native'
import Text from './Txt'
import ModalSelector from 'react-native-modal-selector'
import Icon from './Icon'
import Color from '../constants/Colors'
import Colors from '../constants/Colors'


class Dropdown extends React.PureComponent{

    render(){

        const style = this.props.enabled ? [styles.dd, this.props.style || {}] : [styles.dd_disabled, this.props.style || {}]
        const allProps = Object.assign({}, this.props,{style:style})
        const {height} = Dimensions.get('window');

   
        return(
            <View style={{flex: this.props.flex}}>
                <SafeAreaView />
                <View style={styles.container}>
                    <Text style={this.props.enabled ? styles.label : styles.label_disabled}>{this.props.label}</Text>
                    <ModalSelector
                        animationType={'fade'}
                        disabled = {!this.props.enabled}
                        accessible={true}
                        supportedOrientations={['portrait']}
                        scrollViewAccessibilityLabel={'Scrollable options'}
                        cancelButtonAccessibilityLabel={'Cancel Button'}
                        onChange={this.props.onValueChange}
                        onModalClose={this.props.onClose ? this.props.onClose : () => {}}
                        overlayStyle={{paddingTop: '15%'}}
                        data={this.props.children}
                    >
                    <View style={{flexDirection: "row", justifyContent: "space-between"}}>
                        <Text style={this.props.enabled ? styles.result : styles.result_disabled}>{this.props.selectedValue}</Text>
                        <Icon 
                            iconName="caretdown"
                            iconLib="AntDesign"
                            iconColor={Colors.cosmos300}
                            iconSize={10}
                            style={{alignSelf: "center", marginRight: 16}}
                        />
                    </View>   
                    </ModalSelector>
                </View>
                <Text style={styles.error}>{this.props.error}</Text>
            </View>
        )
   
    }
}

// // CONVERTED TO PURE COMPONENT
// class Dropdown extends React.PureComponent {
//     render(){
//         return(
//             <dropdown {...all}>
//                 {this.props.children}
//             </dropdown>
//         )
//     }

// }

const styles = StyleSheet.create({
    container:{
        marginTop: 11,
        borderColor: '#adadad',
        borderBottomWidth: 2
    },
    label: {
        paddingTop: 5,
        paddingBottom: 0,
        paddingTop: 0,
        color: '#333',
        fontSize: 14,
        fontWeight: '400',
        width: 'auto'
    },
    label_disabled: {
        paddingTop: 5,
        paddingBottom: 0,
        paddingTop: 0,
        color: Color.mist900,
        fontSize: 14,
        fontWeight: '400',
        width: 'auto'
    },
    result: {
        // paddingTop: 5,
        paddingBottom: 0,
        paddingTop: 0,
        color: '#333',
        fontSize: 16,
        fontWeight: '400',
        width: 'auto'
    },
    result_disabled: {
        // paddingTop: 5,
        paddingBottom: 0,
        paddingTop: 0,
        color: Color.mist900,
        fontSize: 16,
        fontWeight: '400',
        width: 'auto'
    },
    dd:{
        color: Color.cosmos900,
        // height: 28
    },
    dd_disabled:{
        color: Color.mist900
    },
    error:{
        paddingTop: 3,
        paddingBottom: 0,
        color: 'red',
        fontSize: 14,
        fontWeight: '400',
        width: 'auto'
    }
})


Dropdown.defaultProps = {
    enabled: true
  };

  

export default Dropdown