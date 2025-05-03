// toastConfig.js
import { BaseToast } from 'react-native-toast-message';
import { Dimensions } from 'react-native';


const { width, height } = Dimensions.get('window'); // Get screen width and height


export const toastConfig = {
  // Custom info toast (this could be the default one)
  info: (props) => (
    <BaseToast
      {...props}
      style={{
        position: 'absolute',                  // Ensure absolute positioning
        top: height / 2 - 50,                   // Center vertically based on screen height
        left: width / 2 - 170,                  // Center horizontally based on screen width
        borderLeftColor: '#5fc9c9',            // Customize left border color
        backgroundColor: '#fff',            // Customize background color
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingVertical: 10,                   // Customize padding to control the toast size
      }}
      text1Style={{
        fontSize: 20,
        fontWeight: '600',
        color: '#333',                         // Text color to make it visible on light background
      }}
    />
  ),

  // Custom error toast
  error: (props) => (
    <BaseToast
      {...props}
      style={{
        position: 'absolute',                  // Ensure absolute positioning
        top: height / 2 - 50,                   // Center vertically based on screen height
        left: width / 2 - 170,   
        borderLeftColor: '#ff4d4d',
        backgroundColor: '#333',
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}
    />
  ),
  
  // Custom success toast
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        position: 'absolute',                  // Ensure absolute positioning
        top: height / 2 - 50,                   // Center vertically based on screen height
        left: width / 2 - 170,   
        borderLeftColor: '#5fc9c9',
        backgroundColor: '#fff',
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: '600', color: '#333' }}
    />
  ),
};
