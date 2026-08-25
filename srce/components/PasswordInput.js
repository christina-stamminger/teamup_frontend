import React, { useState, useCallback } from "react";
import {
  TextInput,
  View,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";

import {
  Eye,
  EyeOff,
} from "lucide-react-native";


const PasswordInput = React.forwardRef(
  (
    {
      value,
      onChangeText,
      onNativeChange,
      placeholder = "Passwort",
      style,
      onBlur,
      onEndEditing,
      allowToggle = true,
      ...props
    },
    ref
  ) => {

    const [secure, setSecure] =
      useState(true);


    const toggleSecure =
      useCallback(() => {
        setSecure(
          prev => !prev
        );
      }, []);


    return (

      <View style={styles.container}>

        <TextInput
          ref={ref}

          style={[
            styles.input,
            style,
          ]}

          value={value ?? ""}

          placeholder={placeholder}

          placeholderTextColor="#999"

          secureTextEntry={secure}


          onChangeText={(text) => {
            onChangeText?.(text);
          }}
          onChange={(event) => {
            if (Platform.OS !== "ios") {
              return;
            }

            const text = event?.nativeEvent?.text;

            if (typeof text === "string") {
              onNativeChange?.(text);
            }
          }}

          onEndEditing={(event) => {
            onEndEditing?.(event);
          }}

          onBlur={onBlur}

          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}

          enablesReturnKeyAutomatically

          {...props}
        />


        {allowToggle && (

          <Pressable
            onPress={toggleSecure}

            hitSlop={{
              top: 12,
              bottom: 12,
              left: 12,
              right: 12,
            }}

            style={
              styles.eyeButton
            }

            accessibilityRole="button"

            accessibilityLabel={
              secure
                ? "Passwort anzeigen"
                : "Passwort verbergen"
            }
          >

            {secure ? (

              <Eye
                size={22}
                color="#666"
              />

            ) : (

              <EyeOff
                size={22}
                color="#666"
              />

            )}

          </Pressable>

        )}

      </View>
    );
  }
);


const styles =
  StyleSheet.create({

    container: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 14,
      paddingHorizontal: 14,
      height: 52,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#EAECF0",
    },

    input: {
      flex: 1,
      fontSize: 16,
      color: "#000",
    },

    eyeButton: {
      width: 32,
      height: 32,
      justifyContent: "center",
      alignItems: "center",
    },

  });


export default PasswordInput;