import React, {
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";

import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";


const ONBOARDING_PAGES = [
  {
    id: "nearby",
    icon: "map-pin",
    title: "Hilfe in deiner Nähe",
    text:
      "Entdecke offene Todos bis zu 10 km rund um deine Profiladresse – oder erstelle selbst eines, wenn du Unterstützung brauchst.",
  },
  {
    id: "privacy",
    icon: "shield",
    title: "Deine Adresse bleibt geschützt",
    text:
      "Auf der öffentlichen Karte wird nur ein ungefährer Standort angezeigt. Deine genaue Adresse wird erst für die Person sichtbar, die dein Todo übernommen hat.",
  },
  {
    id: "flow",
    icon: "check-circle",
    title: "Gemeinsam erledigen",
    text:
      "Ein Todo kann übernommen und erledigt werden. Falls etwas dazwischenkommt, kann es wieder freigegeben werden, damit jemand anderes helfen kann.",
  },
  {
    id: "bringits",
    icon: "award",
    title: "Sammle BringIts",
    text:
      "Für erledigte Todos sammelst du BringIts. Sie zeigen deinen Beitrag zur Community und wie aktiv du anderen in deiner Umgebung hilfst.",
  },
  {
    id: "payment",
    icon: "credit-card",
    title: "Vereinbarungen & Bezahlung",
    text:
      "bringit wickelt keine Zahlungen ab. Etwaige Bezahlungen oder andere Gegenleistungen vereinbart und erledigt ihr direkt miteinander außerhalb der App.",
  },
];


export default function OnboardingScreen({
  onComplete,
}) {
  const navigation = useNavigation();

  const { width } =
    useWindowDimensions();

  const listRef =
    useRef(null);

  const [currentIndex, setCurrentIndex] =
    useState(0);


  const isLastPage =
    currentIndex ===
    ONBOARDING_PAGES.length - 1;

  const isPreview =
    !onComplete;


  const handleNext = () => {
    if (isLastPage) {
      handleComplete();
      return;
    }

    const nextIndex =
      currentIndex + 1;

    listRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });

    setCurrentIndex(nextIndex);
  };

  const handleComplete = () => {
    /*
     * First-Run-Onboarding:
     * AppRoot speichert "Onboarding gesehen"
     * und öffnet danach das Profil direkt
     * im Adress-Setup.
     */
    if (onComplete) {
      onComplete({
        openAddressSetup: true,
      });
      return;
    }

    /*
     * Onboarding wurde später manuell
     * aus dem Profil geöffnet.
     */
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };


  const handleMomentumScrollEnd = (
    event
  ) => {
    const offset =
      event.nativeEvent
        .contentOffset.x;

    const index =
      Math.round(
        offset / width
      );

    setCurrentIndex(index);
  };


  const renderPage = ({
    item,
  }) => (
    <View
      style={[
        styles.page,
        { width },
      ]}
    >

      <View
        style={
          styles.iconContainer
        }
      >
        <Feather
          name={item.icon}
          size={42}
          color="#4FB6B8"
        />
      </View>


      <Text
        style={
          styles.title
        }
      >
        {item.title}
      </Text>


      <Text
        style={
          styles.description
        }
      >
        {item.text}
      </Text>

    </View>
  );


  return (
    <View
      style={
        styles.container
      }
    >
      {isPreview && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
          activeOpacity={0.7}
        >
          <Feather
            name="chevron-left"
            size={20}
            color="#4FB6B8"
          />

          <Text style={styles.backButtonText}>
            Zurück
          </Text>
        </TouchableOpacity>
      )}
      <View
        style={
          styles.brandContainer
        }
      >
        <Text
          style={
            styles.brand
          }
        >
          bringit
        </Text>
      </View>


      <FlatList
        ref={listRef}

        data={
          ONBOARDING_PAGES
        }

        keyExtractor={
          item => item.id
        }

        renderItem={
          renderPage
        }

        horizontal

        pagingEnabled

        showsHorizontalScrollIndicator={
          false
        }

        bounces={false}

        onMomentumScrollEnd={
          handleMomentumScrollEnd
        }

        getItemLayout={(
          _,
          index
        ) => ({
          length: width,
          offset:
            width * index,
          index,
        })}
      />


      <View
        style={
          styles.bottomArea
        }
      >

        <View
          style={
            styles.dotsContainer
          }
        >

          {ONBOARDING_PAGES.map(
            (_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index ===
                  currentIndex &&
                  styles.activeDot,
                ]}
              />
            )
          )}

        </View>


        <TouchableOpacity
          style={
            styles.nextButton
          }
          onPress={
            handleNext
          }
          activeOpacity={0.85}
        >

          <Text
            style={
              styles.nextButtonText
            }
          >
            {isLastPage
              ? "Los geht's"
              : "Weiter"}
          </Text>


          {!isLastPage && (
            <Feather
              name="arrow-right"
              size={18}
              color="#fff"
            />
          )}

        </TouchableOpacity>




      </View>

    </View>
  );
}


const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: "#F9F9F9",
    },

    brandContainer: {
      paddingTop: 55,
      alignItems: "center",
    },

    brand: {
      fontSize: 20,
      fontWeight: "700",
      color: "#4FB6B8",
      letterSpacing: 0.5,
    },

    page: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 36,
    },

    iconContainer: {
      width: 94,
      height: 94,
      borderRadius: 47,

      backgroundColor:
        "#E9F7F7",

      justifyContent:
        "center",

      alignItems:
        "center",

      marginBottom: 30,
    },

    title: {
      fontSize: 28,
      fontWeight: "700",
      color: "#333",
      textAlign: "center",
      marginBottom: 16,
    },

    description: {
      fontSize: 18,
      lineHeight: 24,
      color: "#666",
      textAlign: "center",
      maxWidth: 420,
    },

    bottomArea: {
      paddingHorizontal: 24,
      paddingBottom: 34,
    },

    dotsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 22,
    },

    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "#D5D5D5",
      marginHorizontal: 4,
    },

    activeDot: {
      width: 20,
      backgroundColor: "#4FB6B8",
    },

    nextButton: {
      minHeight: 50,

      borderRadius: 10,

      backgroundColor:
        "#4FB6B8",

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "center",

      gap: 8,
    },

    nextButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },

    backButton: {
      position: "absolute",
      top: 54,
      left: 18,
      zIndex: 10,

      flexDirection: "row",
      alignItems: "center",

      paddingVertical: 8,
      paddingRight: 12,
    },

    backButtonText: {
      color: "#4FB6B8",
      fontSize: 15,
      fontWeight: "700",
      marginLeft: 2,
    },

  });