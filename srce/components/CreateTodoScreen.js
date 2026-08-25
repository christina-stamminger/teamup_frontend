import React, {
    useState,
    useCallback,
    useMemo
} from "react";

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
    Keyboard,
    ScrollView,
    ActivityIndicator
} from "react-native";

import * as SecureStore
    from "expo-secure-store";

import {
    useUser
} from "../components/context/UserContext";

import {
    useGroups
} from "../components/context/GroupContext";

import {
    Dropdown
} from "react-native-element-dropdown";

import Toast
    from "react-native-toast-message";

import {
    useFocusEffect,
    useNavigation
} from "@react-navigation/native";

import {
    ChevronDown,
    ChevronUp
} from "lucide-react-native";

import Icon
    from "react-native-vector-icons/FontAwesome";

import DateTimePickerModal
    from "react-native-modal-datetime-picker";

import {
    useNetwork
} from "../components/context/NetworkContext";

import {
    API_URL
} from "../config/env";


export default function CreateTodoScreen() {

    const navigation =
        useNavigation();

    const [hasAddress, setHasAddress] =
        useState(null);

    const [checkingAddress, setCheckingAddress] =
        useState(true);

    const [title, setTitle] =
        useState("");

    const [expiresAt, setExpiresAt] =
        useState(null);

    const [
        expiresAtDisplay,
        setExpiresAtDisplay
    ] = useState("");

    const [
        description,
        setDescription
    ] = useState("");

    const [
        showDescription,
        setShowDescription
    ] = useState(false);

    const [
        isTimeCritical,
        setIsTimeCritical
    ] = useState(false);

    const [
        isDatePickerVisible,
        setDatePickerVisible
    ] = useState(false);


    const {
        safeFetch
    } = useNetwork();

    const {
        userId,
        accessToken
    } = useUser();

    const {
        groups,
        selectedGroupId,
        setSelectedGroupId,
        loadingGroups,
        refreshGroups
    } = useGroups();


    // Nachbarschaft ist der Standard.
    // Gruppen stehen zusätzlich zur Auswahl.
    const groupOptions =
        useMemo(
            () => [
                {
                    label: "Nachbarschaft",
                    value: ""
                },

                ...groups.filter(
                    group =>
                        group.value !== ""
                )
            ],
            [groups]
        );


    const getAuthToken =
        useCallback(async () => {

            if (accessToken) {
                return accessToken;
            }

            return await SecureStore
                .getItemAsync(
                    "accessToken"
                );

        }, [accessToken]);


    const checkUserAddress =
        useCallback(async () => {

            if (
                !userId ||
                !accessToken
            ) {
                setHasAddress(false);
                setCheckingAddress(false);
                return;
            }


            try {

                setCheckingAddress(true);

                const response =
                    await safeFetch(
                        `${API_URL}/api/users/profile/${userId}`,
                        {
                            method: "GET",
                            headers: {
                                Authorization:
                                    `Bearer ${accessToken}`,

                                "Content-Type":
                                    "application/json",
                            },
                        }
                    );


                if (
                    response?.offline ||
                    !response?.ok
                ) {
                    return;
                }


                const data =
                    await response.json();

                const address =
                    data?.address;


                setHasAddress(
                    !!address &&
                    address.latitude != null &&
                    address.longitude != null
                );

            } catch (error) {

                console.error(
                    "Fehler beim Prüfen der Profiladresse:",
                    error
                );

            } finally {

                setCheckingAddress(false);
            }

        }, [
            userId,
            accessToken,
            safeFetch,
        ]);

    useFocusEffect(
        useCallback(() => {

            refreshGroups();
            checkUserAddress();

        }, [
            refreshGroups,
            checkUserAddress,
        ])
    );


    const showPicker = () =>
        setDatePickerVisible(true);

    const hidePicker = () =>
        setDatePickerVisible(false);


    const handleConfirm =
        (date) => {

            setExpiresAt(date);

            setExpiresAtDisplay(
                formatDateTime(date)
            );

            hidePicker();
        };


    const formatDateTime =
        (iso) => {

            const date =
                new Date(iso);

            const now =
                new Date();


            const isToday =
                date.toDateString() ===
                now.toDateString();


            const isTomorrow =
                date.toDateString() ===
                new Date(
                    now.getTime() +
                    86400000
                ).toDateString();


            if (isToday) {

                return `Heute, ${date.toLocaleTimeString(
                    "de-DE",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )}`;
            }


            if (isTomorrow) {

                return `Morgen, ${date.toLocaleTimeString(
                    "de-DE",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )}`;
            }


            return date.toLocaleString(
                "de-DE",
                {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }
            );
        };


    const applyQuickButton =
        (option) => {

            const now =
                new Date();

            let newDate =
                new Date();


            switch (option) {

                case "sofort":

                    newDate.setHours(
                        now.getHours() + 1
                    );

                    break;


                case "plus4":

                    newDate.setHours(
                        now.getHours() + 4
                    );

                    break;


                case "plus6":

                    newDate.setHours(
                        now.getHours() + 6
                    );

                    break;


                default:
                    newDate = now;
            }


            setExpiresAt(
                newDate
            );

            setExpiresAtDisplay(
                formatDateTime(newDate)
            );
        };


    const handleCreateTodo =
        async () => {

            Keyboard.dismiss();


            if (!userId) {

                Alert.alert(
                    "Fehler",
                    "Benutzer ist nicht eingeloggt. Bitte erneut anmelden."
                );

                return;
            }


            if (!title.trim()) {

                Alert.alert(
                    "Fehler",
                    "Bitte einen Titel eingeben!"
                );

                return;
            }


            if (!expiresAt) {

                Alert.alert(
                    "Fehler",
                    "Bitte eine Ablaufzeit wählen!"
                );

                return;
            }


            const newTodo = {

                userOfferedId:
                    userId,

                title:
                    title.trim(),

                expiresAt:
                    expiresAt.toISOString(),

                isTimeCritical,

                ...(description.trim() && {
                    description:
                        description.trim()
                }),

                ...(selectedGroupId && {
                    groupId:
                        Number(
                            selectedGroupId
                        )
                }),
            };


            console.log(
                "Creating todo:",
                newTodo
            );


            try {

                const token =
                    await getAuthToken();


                const response =
                    await safeFetch(
                        `${API_URL}/api/todo/create`,
                        {
                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`,
                            },

                            body:
                                JSON.stringify(
                                    newTodo
                                ),
                        }
                    );


                if (response?.offline) {

                    Alert.alert(
                        "Offline",
                        "Keine Internetverbindung."
                    );

                    return;
                }


                if (!response?.ok) {

                    throw new Error(
                        "Fehler beim Erstellen des Todos!"
                    );
                }


                console.log(
                    "✅ Todo created successfully"
                );


                Toast.show({
                    type:
                        "success",

                    text1:
                        "Todo erfolgreich erstellt!",

                    visibilityTime:
                        2000,
                });


                setTitle("");

                setExpiresAt(null);

                setExpiresAtDisplay("");

                setDescription("");

                setShowDescription(false);

                setIsTimeCritical(false);

                setSelectedGroupId(null);


            } catch (error) {

                console.error(
                    "❌ Fehler:",
                    error
                );


                Alert.alert(
                    "Fehler",
                    "Todo konnte nicht erstellt werden. Bitte erneut versuchen."
                );
            }
        };


    if (checkingAddress) {

        return (
            <View style={styles.addressLoadingContainer}>
                <ActivityIndicator
                    size="small"
                    color="#4FB6B8"
                />
            </View>
        );
    }


    if (!hasAddress) {

        return (

            <View style={styles.addressRequiredScreen}>

                <Text style={styles.screenTitle}>
                    Neues Todo erstellen
                </Text>


                <View style={styles.addressRequiredContainer}>

                    <View style={styles.addressIconCircle}>
                        <Text style={styles.addressIcon}>
                            📍
                        </Text>
                    </View>


                    <Text style={styles.addressRequiredTitle}>
                        Zuerst deine Adresse
                    </Text>


                    <Text style={styles.addressRequiredText}>
                        Hinterlege deine Profiladresse,
                        damit dein Todo Menschen in deiner
                        Umgebung angezeigt werden kann.
                    </Text>


                    <Text style={styles.addressPrivacyText}>
                        Deine genaue Adresse bleibt geschützt
                        und wird nicht öffentlich angezeigt.
                    </Text>


                    <TouchableOpacity
                        style={styles.addressButton}
                        onPress={() =>
                            navigation.navigate(
                                "ProfileScreen",
                                {
                                    openAddressEditor: true,
                                }
                            )
                        }
                        activeOpacity={0.85}
                    >
                        <Text style={styles.addressButtonText}>
                            Adresse hinzufügen
                        </Text>
                    </TouchableOpacity>

                </View>

            </View>
        );
    }


    return (

        <KeyboardAvoidingView
            behavior={
                Platform.OS === "ios"
                    ? "padding"
                    : "height"
            }

            keyboardVerticalOffset={
                Platform.OS === "ios"
                    ? 90
                    : 0
            }

            style={
                styles.container
            }
        >

            <TouchableWithoutFeedback
                onPress={
                    Keyboard.dismiss
                }
            >

                <ScrollView
                    contentContainerStyle={
                        styles.scrollContainer
                    }

                    keyboardShouldPersistTaps=
                    "handled"
                >

                    <View
                        style={
                            styles.inner
                        }
                    >

                        <Text
                            style={
                                styles.screenTitle
                            }
                        >
                            Neues Todo erstellen
                        </Text>


                        {/* EINZIGE CARD */}

                        <View
                            style={
                                styles.card
                            }
                        >

                            {/* TITEL */}

                            <TextInput
                                style={
                                    styles.titleInput
                                }

                                placeholder=
                                "z.B. Hafermilch kaufen"

                                placeholderTextColor=
                                "#B0B5BD"

                                value={
                                    title
                                }

                                onChangeText={
                                    setTitle
                                }
                            />


                            <View
                                style={
                                    styles.divider
                                }
                            />


                            {/* OPTIONALE DETAILS */}

                            <TouchableOpacity
                                style={
                                    styles.collapseRow
                                }

                                activeOpacity={
                                    0.7
                                }

                                onPress={() =>
                                    setShowDescription(
                                        !showDescription
                                    )
                                }
                            >

                                <Text
                                    style={
                                        styles.collapseRowText
                                    }
                                >
                                    {showDescription
                                        ? "Weitere Details ausblenden"
                                        : "Weitere Details hinzufügen ..."}
                                </Text>


                                {showDescription ? (

                                    <ChevronUp
                                        size={18}
                                        color="#9CA3AF"
                                    />

                                ) : (

                                    <ChevronDown
                                        size={18}
                                        color="#9CA3AF"
                                    />

                                )}

                            </TouchableOpacity>
                            {showDescription && (
                                <TextInput
                                    style={styles.textArea}
                                    placeholder="z.B. Marke, Menge oder besondere Hinweise"
                                    placeholderTextColor="#B0B5BD"
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                    value={description}
                                    onChangeText={setDescription}
                                />
                            )}


                            <View
                                style={
                                    styles.divider
                                }
                            />


                            {/* NACHBARSCHAFT / GRUPPE */}

                            <Dropdown
                                style={
                                    styles.dropdown
                                }

                                data={
                                    groupOptions
                                }

                                maxHeight={
                                    300
                                }

                                labelField=
                                "label"

                                valueField=
                                "value"

                                placeholder={
                                    loadingGroups
                                        ? "Lade Gruppen..."
                                        : "Nachbarschaft oder Gruppe wählen"
                                }

                                value={
                                    selectedGroupId ??
                                    ""
                                }

                                selectedTextStyle={
                                    selectedGroupId ===
                                        null
                                        ? styles.neighborhoodSelectedText
                                        : styles.selectedText
                                }

                                placeholderStyle={
                                    styles.dropdownPlaceholder
                                }

                                onChange={
                                    (item) => {

                                        setSelectedGroupId(
                                            item.value === ""
                                                ? null
                                                : item.value
                                        );

                                        console.log(
                                            "✅ Selected group:",
                                            item.label
                                        );
                                    }
                                }

                                disable={
                                    loadingGroups
                                }

                                renderItem={
                                    (item) => {

                                        const isNeighborhood =
                                            item.value === "";


                                        return (

                                            <View
                                                style={[
                                                    styles.dropdownItem,

                                                    isNeighborhood &&
                                                    styles.neighborhoodItem,
                                                ]}
                                            >

                                                <Text
                                                    style={[
                                                        styles.dropdownItemText,

                                                        isNeighborhood &&
                                                        styles.neighborhoodItemText,
                                                    ]}
                                                >
                                                    {item.label}
                                                </Text>


                                                {isNeighborhood && (

                                                    <Text
                                                        style={
                                                            styles.neighborhoodHint
                                                        }
                                                    >
                                                        Für Nutzer in deiner Nähe sichtbar
                                                    </Text>

                                                )}

                                            </View>
                                        );
                                    }
                                }
                            />


                            <View
                                style={
                                    styles.divider
                                }
                            />


                            {/* SCHNELLAUSWAHL */}

                            <View
                                style={
                                    styles.quickButtonContainer
                                }
                            >

                                <TouchableOpacity
                                    style={
                                        styles.quickButtonModern
                                    }

                                    onPress={() =>
                                        applyQuickButton(
                                            "sofort"
                                        )
                                    }
                                >

                                    <Text
                                        style={
                                            styles.quickButtonModernText
                                        }
                                    >
                                        Jetzt (1h)
                                    </Text>

                                </TouchableOpacity>


                                <TouchableOpacity
                                    style={
                                        styles.quickButtonModern
                                    }

                                    onPress={() =>
                                        applyQuickButton(
                                            "plus4"
                                        )
                                    }
                                >

                                    <Text
                                        style={
                                            styles.quickButtonModernText
                                        }
                                    >
                                        +4h
                                    </Text>

                                </TouchableOpacity>


                                <TouchableOpacity
                                    style={
                                        styles.quickButtonModern
                                    }

                                    onPress={() =>
                                        applyQuickButton(
                                            "plus6"
                                        )
                                    }
                                >

                                    <Text
                                        style={
                                            styles.quickButtonModernText
                                        }
                                    >
                                        +6h
                                    </Text>

                                </TouchableOpacity>

                            </View>


                            {/* DATUM / UHRZEIT */}

                            <TouchableOpacity
                                style={
                                    styles.dateTimeButton
                                }

                                onPress={
                                    showPicker
                                }

                                activeOpacity={
                                    0.8
                                }
                            >

                                <Icon
                                    name="calendar"
                                    size={15}
                                    color="#2B8A8C"

                                    style={{
                                        marginRight:
                                            8
                                    }}
                                />

                                <Text
                                    style={
                                        styles.dateTimeButtonText
                                    }
                                >
                                    {expiresAtDisplay
                                        ? expiresAtDisplay
                                        : "Datum & Uhrzeit wählen"}
                                </Text>

                            </TouchableOpacity>


                            <DateTimePickerModal
                                isVisible={
                                    isDatePickerVisible
                                }

                                mode="datetime"

                                date={
                                    expiresAt ||
                                    new Date()
                                }

                                minimumDate={
                                    new Date(
                                        Date.now()
                                    )
                                }

                                onConfirm={
                                    handleConfirm
                                }

                                onCancel={
                                    hidePicker
                                }
                            />


                            <View
                                style={
                                    styles.divider
                                }
                            />


                            {/* ZEITKRITISCH */}

                            <TouchableOpacity
                                style={[
                                    styles.timeCriticalContainer,

                                    isTimeCritical &&
                                    styles.timeCriticalContainerActive,
                                ]}

                                onPress={() =>
                                    setIsTimeCritical(
                                        !isTimeCritical
                                    )
                                }

                                activeOpacity={
                                    0.7
                                }
                            >

                                <View
                                    style={[
                                        styles.checkbox,

                                        isTimeCritical &&
                                        styles.checkboxChecked,
                                    ]}
                                >

                                    {isTimeCritical && (

                                        <Text
                                            style={
                                                styles.checkmark
                                            }
                                        >
                                            ✓
                                        </Text>

                                    )}

                                </View>


                                <View style={{ flex: 1 }}>
                                    <Text style={styles.timeCriticalTitle}>
                                        Zeitkritisch
                                    </Text>

                                    <Text style={styles.timeCriticalHint}>
                                        Nach diesem Zeitpunkt wird das Todo automatisch beendet.
                                    </Text>

                                    <Text style={styles.timeCriticalSubHint}>
                                        Nur wählen, wenn eine spätere Erledigung keinen Sinn mehr macht.
                                    </Text>
                                </View>
                            </TouchableOpacity>

                        </View>


                        {/* CREATE */}

                        <TouchableOpacity
                            style={[
                                styles.createButton,

                                (!title.trim() ||
                                    !expiresAt) &&
                                styles.createButtonDisabled,
                            ]}

                            onPress={
                                handleCreateTodo
                            }

                            disabled={
                                !title.trim() ||
                                !expiresAt
                            }

                            activeOpacity={
                                0.85
                            }
                        >

                            <Text
                                style={
                                    styles.createButtonText
                                }
                            >
                                Todo erstellen
                            </Text>

                        </TouchableOpacity>

                    </View>

                </ScrollView>

            </TouchableWithoutFeedback>

        </KeyboardAvoidingView>
    );
}


const styles =
    StyleSheet.create({

        container: {
            flex: 1,
            backgroundColor:
                "#F7F8FA",
        },


        scrollContainer: {
            flexGrow: 1,
            paddingBottom: 120,
        },


        inner: {
            padding: 16,
        },


        screenTitle: {
            marginTop: 20,
            marginBottom: 20,

            textAlign:
                "center",

            fontSize: 28,

            fontWeight:
                "800",

            color:
                "#12151A",

            letterSpacing:
                -0.5,
        },


        // =====================================================
        // CARD
        // =====================================================

        card: {
            backgroundColor:
                "#FFFFFF",

            borderRadius:
                22,

            padding: 18,

            marginBottom:
                18,

            borderWidth:
                1,

            borderColor:
                "#F1F2F4",

            shadowColor:
                "#12151A",

            shadowOpacity:
                0.05,

            shadowRadius:
                18,

            shadowOffset: {
                width: 0,
                height: 6,
            },

            elevation: 2,
        },


        divider: {
            height: 1,

            backgroundColor:
                "#F1F2F4",

            marginVertical:
                16,
        },


        // =====================================================
        // TITLE
        // =====================================================

        titleInput: {
            fontSize: 18,

            fontWeight:
                "700",

            color:
                "#12151A",

            paddingVertical:
                6,

            paddingHorizontal:
                0,
        },


        // =====================================================
        // OPTIONAL DETAILS
        // =====================================================

        collapseRow: {
            flexDirection:
                "row",

            alignItems:
                "center",

            justifyContent:
                "space-between",

            minHeight: 34,
        },


        collapseRowText: {
            fontSize: 14,

            fontWeight:
                "500",

            color:
                "#B0B5BD",
        },


        textArea: {
            marginTop: 14,

            minHeight: 90,

            fontSize: 15,

            color:
                "#B0B5BD",

            lineHeight: 21,

            paddingTop: 0,

            paddingHorizontal:
                0,
        },


        // =====================================================
        // DROPDOWN
        // =====================================================

        dropdown: {
            height: 44,
        },


        dropdownPlaceholder: {
            fontSize: 15,

            color:
                "#B0B5BD",
        },


        dropdownItem: {
            paddingVertical:
                12,

            paddingHorizontal:
                14,
        },


        dropdownItemText: {
            fontSize: 15,

            color:
                "#344054",
        },


        neighborhoodItem: {
            backgroundColor:
                "#E7F6F6",

            borderBottomWidth:
                1,

            borderBottomColor:
                "#D5EEEE",
        },


        neighborhoodItemText: {
            color:
                "#2B8A8C",

            fontWeight:
                "700",
        },


        neighborhoodHint: {
            marginTop: 3,

            fontSize: 12,

            color:
                "#6F9FA0",
        },


        selectedText: {
            fontSize: 16,

            color:
                "#12151A",

            fontWeight:
                "500",
        },


        neighborhoodSelectedText: {
            fontSize: 16,

            color:
                "#2B8A8C",

            fontWeight:
                "700",
        },


        // =====================================================
        // QUICK BUTTONS
        // =====================================================

        quickButtonContainer: {
            flexDirection:
                "row",

            marginHorizontal:
                -4,

            marginBottom:
                12,
        },


        quickButtonModern: {
            flex: 1,

            backgroundColor:
                "#E7F6F6",

            paddingVertical:
                12,

            marginHorizontal:
                4,

            borderRadius:
                14,

            alignItems:
                "center",
        },


        quickButtonModernText: {
            color:
                "#2B8A8C",

            fontWeight:
                "700",

            fontSize: 14,
        },


        // =====================================================
        // DATE / TIME
        // =====================================================

        dateTimeButton: {
            flexDirection:
                "row",

            backgroundColor:
                "#E7F6F6",

            borderRadius:
                14,

            paddingVertical:
                13,

            paddingHorizontal:
                16,

            alignItems:
                "center",

            justifyContent:
                "center",
        },


        dateTimeButtonText: {
            color:
                "#2B8A8C",

            fontWeight:
                "700",

            fontSize: 14,
        },


        // =====================================================
        // TIME CRITICAL
        // =====================================================

        timeCriticalContainer: {
            flexDirection:
                "row",

            alignItems:
                "center",

            paddingVertical:
                6,

            borderRadius:
                14,
        },


        timeCriticalContainerActive: {
            backgroundColor:
                "#FEF3F2",

            paddingHorizontal:
                10,

            paddingVertical:
                10,
        },


        checkbox: {
            width: 24,
            height: 24,

            borderRadius:
                7,

            borderWidth:
                2,

            borderColor:
                "#3FA9AB",

            justifyContent:
                "center",

            alignItems:
                "center",

            marginRight:
                12,
        },


        checkboxChecked: {
            backgroundColor:
                "#3FA9AB",

            borderColor:
                "#3FA9AB",
        },


        checkmark: {
            color:
                "#FFFFFF",

            fontSize: 14,

            fontWeight:
                "bold",
        },


        timeCriticalTextContainer: {
            flexDirection:
                "row",

            alignItems:
                "center",

            flex: 1,
        },

        timeCriticalTitle: {
            fontSize: 14,
            fontWeight: "700",
            color: "#344054",
            marginBottom: 2,
        },

        timeCriticalHint: {
            fontSize: 13,
            color: "#667085",
            lineHeight: 18,
        },

        timeCriticalSubHint: {
            marginTop: 3,
            fontSize: 12,
            color: "#98A2B3",
            lineHeight: 17,
        },


        // =====================================================
        // CREATE BUTTON
        // =====================================================

        createButton: {
            backgroundColor:
                "#3FA9AB",

            paddingVertical:
                17,

            borderRadius:
                18,

            alignItems:
                "center",

            marginTop:
                2,

            marginBottom:
                40,

            shadowColor:
                "#3FA9AB",

            shadowOpacity:
                0.22,

            shadowRadius:
                14,

            shadowOffset: {
                width: 0,
                height: 8,
            },

            elevation: 3,
        },


        createButtonDisabled: {
            backgroundColor:
                "#D1D5DB",

            shadowOpacity:
                0,

            elevation: 0,
        },


        createButtonText: {
            color:
                "#FFFFFF",

            fontSize: 16,

            fontWeight:
                "700",
        },

        // ===================================================== 
        //  BLOCKING STATE
        // =====================================================

                addressLoadingContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#F7F8FA",
        },

        addressRequiredScreen: {
            flex: 1,
            paddingTop: 20,
            backgroundColor: "#F7F8FA",
        },

        addressRequiredContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 34,
            paddingBottom: 80,
        },

        addressIconCircle: {
            width: 76,
            height: 76,
            borderRadius: 38,
            backgroundColor: "#EAF7F7",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 22,
        },

        addressIcon: {
            fontSize: 32,
        },

        addressRequiredTitle: {
            fontSize: 21,
            fontWeight: "800",
            color: "#12151A",
            textAlign: "center",
            marginBottom: 10,
        },

        addressRequiredText: {
            fontSize: 15,
            lineHeight: 22,
            color: "#62676D",
            textAlign: "center",
            maxWidth: 330,
        },

        addressPrivacyText: {
            marginTop: 8,
            fontSize: 13,
            lineHeight: 19,
            color: "#8A8F95",
            textAlign: "center",
            maxWidth: 330,
        },

        addressButton: {
            marginTop: 24,
            minHeight: 48,
            paddingHorizontal: 24,
            borderRadius: 12,
            backgroundColor: "#4FB6B8",
            justifyContent: "center",
            alignItems: "center",
        },

        addressButtonText: {
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: "700",
        },

    });