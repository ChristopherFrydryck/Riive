/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  LogBox
} from 'react-native';

import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import { observer, Provider } from 'mobx-react/native'
// import UserStore from './stores/userStore'
// import ComponentStore from './stores/componentStore'

// Firebase imports
import * as firebase from 'firebase'
import firebaseConfig from './firebaseConfig'
import 'firebase/firestore';
import 'firebase/auth';

import stripe from 'tipsi-stripe'

stripe.setOptions({
  publishableKey: 'pk_test_lojsrOCvzrsIiGQFXSUquLHX00pzpkST7r',
  // merchantId: 'MERCHANT_ID', // Optional
  androidPayMode: 'test', // Android only
})

if (!firebase.apps.length) {

  // Initlialized FB Vars
  firebase.initializeApp(firebaseConfig);


}

export default class App extends React.Component {
  constructor(props){
    super(props);
    LogBox.ignoreLogs(['Setting a timer'])
    this.state ={
      fontLoaded: false
    }
  }


  async componentDidMount(){
    
    // await Font.loadAsync({
    //   'WorkSans-Thin': require('./assets/fonts/WorkSans-Thin.otf'),
    //   'WorkSans-SemiBold': require('./assets/fonts/WorkSans-SemiBold.otf'),
    //   'WorkSans-Regular': require('./assets/fonts/WorkSans-Regular.otf'),
    //   'WorkSans-Medium': require('./assets/fonts/WorkSans-Medium.otf'),
    //   'WorkSans-Light': require('./assets/fonts/WorkSans-Light.otf'),
    //   'WorkSans-Italic': require('./assets/fonts/WorkSans-Italic.otf'),
    //   'WorkSans-ExtraLight': require('./assets/fonts/WorkSans-ExtraLight.otf'),
    //   'WorkSans-ExtraBold': require('./assets/fonts/WorkSans-ExtraBold.otf'),
    //   'WorkSans-Bold': require('./assets/fonts/WorkSans-Bold.otf'),
    //   'WorkSans-Black': require('./assets/fonts/WorkSans-Black.otf'),
    //   'FontAwesome': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf'),
    //   'Feather': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf'),
    //   'Entypo': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Entypo.ttf'),
    //   'EvilIcons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/EvilIcons.ttf'),
    //   'Ionicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
    //   'AntDesign': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf'),
    //   'Foundation': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Foundation.ttf'),
    //   'MaterialCommunityIcons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
    //   'MaterialIcons.font': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'),

      
      
      
    // });



    this.setState({fontLoaded: true})




    
      
      
  
  }

  render() {
    if (this.state.fontLoaded){
      return (
        
        <Text style={{fontFamily: "Poppins-Regular"}}>Hello World</Text>
        // <Provider {...stores}>
        //   <AuthNavigator initRoute="Home"/>
        // </Provider>
      )
    }else{
      return(
      <View style={{flex: 1, flexDirection:'column', justifyContent:'center'}}> 
        <ActivityIndicator style={{alignSelf:'center'}}/>
      </View>
      )
    }
  }
}


// const App: () => React$Node = () => {
//   return (
//     <>
//       <StatusBar barStyle="dark-content" />
//       <SafeAreaView>
//         <ScrollView
//           contentInsetAdjustmentBehavior="automatic"
//           style={styles.scrollView}>
//           <Header />
//           {global.HermesInternal == null ? null : (
//             <View style={styles.engine}>
//               <Text style={styles.footer}>Engine: Hermes</Text>
//             </View>
//           )}
//           <View style={styles.body}>
//             <View style={styles.sectionContainer}>
//               <Text style={styles.sectionTitle}>Step One</Text>
//               <Text style={styles.sectionDescription}>
//                 Edit <Text style={styles.highlight}>App.js</Text> to change this
//                 screen and then come back to see your edits.
//               </Text>
//             </View>
//             <View style={styles.sectionContainer}>
//               <Text style={styles.sectionTitle}>See Your Changes</Text>
//               <Text style={styles.sectionDescription}>
//                 <ReloadInstructions />
//               </Text>
//             </View>
//             <View style={styles.sectionContainer}>
//               <Text style={styles.sectionTitle}>Debug</Text>
//               <Text style={styles.sectionDescription}>
//                 <DebugInstructions />
//               </Text>
//             </View>
//             <View style={styles.sectionContainer}>
//               <Text style={styles.sectionTitle}>Learn More</Text>
//               <Text style={styles.sectionDescription}>
//                 Read the docs to discover what to do next:
//               </Text>
//             </View>
//             <LearnMoreLinks />
//           </View>
//         </ScrollView>
//       </SafeAreaView>
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   scrollView: {
//     backgroundColor: Colors.lighter,
//   },
//   engine: {
//     position: 'absolute',
//     right: 0,
//   },
//   body: {
//     backgroundColor: Colors.white,
//   },
//   sectionContainer: {
//     marginTop: 32,
//     paddingHorizontal: 24,
//   },
//   sectionTitle: {
//     fontSize: 24,
//     fontWeight: '600',
//     color: Colors.black,
//   },
//   sectionDescription: {
//     marginTop: 8,
//     fontSize: 18,
//     fontWeight: '400',
//     color: Colors.dark,
//   },
//   highlight: {
//     fontWeight: '700',
//   },
//   footer: {
//     color: Colors.dark,
//     fontSize: 12,
//     fontWeight: '600',
//     padding: 4,
//     paddingRight: 12,
//     textAlign: 'right',
//   },
// });

// export default App;
