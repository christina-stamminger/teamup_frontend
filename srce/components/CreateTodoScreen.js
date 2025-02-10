import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';

export default function CreateTodoScreen() {
    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} // Adjust for iOS
            style={styles.container}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.inner}>
                    <Text style={styles.label}>Username</Text>
                    <TextInput style={styles.input} placeholder="Enter username" />

                    <Text style={styles.label}>Title</Text>
                    <TextInput style={styles.input} placeholder="Enter todo title" />

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Enter todo description"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity style={styles.button} onPress={() => Alert.alert("Todo Created!")}>
                        <Text style={styles.buttonText}>Create Todo</Text>
                    </TouchableOpacity>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    inner: {
        flex: 1,
        padding: 16,
        justifyContent: "center", // Center content when keyboard is dismissed
    },
    label: {
        fontSize: 16,
        marginVertical: 8,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 16,
    },
    textArea: {
        height: 100, // Increase height for multiline input
        textAlignVertical: "top",
    },
    button: {
        backgroundColor: '#5FC9C9',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
