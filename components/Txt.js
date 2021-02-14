import React from 'react'
import { Text, StyleSheet, ActivityIndicator} from 'react-native'

class Txt extends React.Component{ 

    render(){
        const style = [{ fontFamily: this.props.type ? `Poppins-${this.props.type}` : 'Poppins-Regular'}, this.props.style || {}]
        const allProps = Object.assign({}, this.props,{style:style})
       
          
                return(<Text {...allProps}>{this.props.children}</Text>)
                
           
            
        
    }
}

export default Txt;