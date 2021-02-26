import React from 'react'
import {Picker, Platform} from 'react-native'

class DropdownItem extends React.PureComponent{
    render(){
        if(Platform.OS == 'ios'){
                return(
                    {key: this.props.key, label: this.props.label, baseValue: this.props.value}
                )
              
            }else{
                return(
                    <Picker.Item key={this.props.key} label={this.props.label} value={this.props.value} />
                )    
            }
        }
        
}

export default DropdownItem
