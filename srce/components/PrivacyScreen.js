// srce/components/PrivacyScreen.js

import React from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";


export default function PrivacyScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.headerRow}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Feather
              name="arrow-left"
              size={22}
              color="#333"
            />
          </TouchableOpacity>

          <Text style={styles.header}>
            Datenschutz & Standort
          </Text>

        </View>


        <Text style={styles.intro}>
          Hier erfährst du kurz und verständlich, welche Daten bringit
          für die wichtigsten Funktionen verwendet.
        </Text>


        <PrivacySection
          icon="navigation"
          title="Dein aktueller Standort"
        >
          bringit verwendet deinen aktuellen Gerätestandort, um dir
          offene Todos in deiner Umgebung anzuzeigen. Der aktuelle
          Suchbereich liegt bei maximal 10 km um deinen Standort.
        </PrivacySection>


        <PrivacySection
          icon="home"
          title="Deine Profiladresse"
        >
          Deine hinterlegte Adresse wird verwendet, wenn du ein
          öffentliches Todo erstellst. Sie dient dazu, das Todo
          räumlich einzuordnen und passende Todos in der Umgebung
          anzuzeigen.
        </PrivacySection>


        <PrivacySection
          icon="map-pin"
          title="Was andere auf der Karte sehen"
        >
          Deine genaue Adresse wird nicht öffentlich auf der Karte
          angezeigt. Für öffentliche Todos wird stattdessen eine
          absichtlich verschobene Position angezeigt, damit dein
          genauer Wohnort nicht aus dem Karten-Pin abgeleitet werden
          kann.
        </PrivacySection>


        <PrivacySection
          icon="unlock"
          title="Wann deine genaue Adresse sichtbar wird"
        >
          Die genaue Adresse wird erst dann für den aktuell
          zugewiesenen Fulfiller sichtbar, wenn dieser dein Todo
          übernommen hat. Andere Nutzer erhalten darüber keinen
          Zugriff auf deine genaue Adresse.
        </PrivacySection>


        <PrivacySection
          icon="message-circle"
          title="Todos und Nachrichten"
        >
          Todo-Inhalte und Chatnachrichten werden gespeichert, damit
          der Todo-Flow und die Kommunikation zwischen den beteiligten
          Nutzern funktionieren.
        </PrivacySection>


        <PrivacySection
          icon="clock"
          title="Übernahmen und Abbrüche"
        >
          bringit speichert Informationen über Todo-Übernahmen und
          deren Verlauf. Dazu können der Zeitpunkt einer Übernahme,
          ein Abbruchgrund, der Abschluss eines Todos und der Zeitpunkt
          gehören, zu dem einem Fulfiller die genaue Adresse angezeigt
          wurde.
        </PrivacySection>


        <PrivacySection
          icon="map"
          title="Mapbox"
        >
          bringit verwendet Mapbox für Karten-, Adress- und
          Standortfunktionen. Bei der Nutzung dieser Funktionen können
          Daten technisch an Mapbox übertragen werden.
        </PrivacySection>


        <PrivacySection
          icon="trash-2"
          title="Account und Daten löschen"
        >
          Du kannst deinen Account direkt in deinem Profil löschen.
          Dabei werden deine personenbezogenen Account-Daten sowie
          zugehörige Chat- und Assignment-Bezüge entfernt. Eigene
          Todos werden ebenfalls gelöscht.
        </PrivacySection>


        <PrivacySection
          icon="settings"
          title="Deine Kontrolle"
        >
          Die Standortberechtigung kannst du jederzeit in den
          Einstellungen deines Geräts ändern. Ohne Standortfreigabe
          können standortbezogene Funktionen der App eingeschränkt
          sein.
        </PrivacySection>


        <View style={styles.noteBox}>

          <Feather
            name="info"
            size={18}
            color="#4FB6B8"
          />

          <Text style={styles.noteText}>
            Diese Übersicht erklärt die wichtigsten Punkte in
            verständlicher Form. Maßgeblich ist die vollständige
            Datenschutzerklärung.
          </Text>

        </View>


        {/*
          Den Button zur vollständigen Datenschutzerklärung
          ergänzen wir, sobald deine öffentliche Privacy-URL
          feststeht bzw. aktualisiert wurde.
        */}

      </ScrollView>

    </View>
  );
}


function PrivacySection({
  icon,
  title,
  children,
}) {
  return (
    <View style={styles.section}>

      <View style={styles.sectionHeader}>

        <View style={styles.iconContainer}>
          <Feather
            name={icon}
            size={18}
            color="#4FB6B8"
          />
        </View>

        <Text style={styles.sectionTitle}>
          {title}
        </Text>

      </View>


      <Text style={styles.sectionText}>
        {children}
      </Text>

    </View>
  );
}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 40,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    marginRight: 12,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  header: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },

  intro: {
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
    marginBottom: 18,
  },

  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E9F7F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },

  sectionText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#666",
  },

  noteBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#EEF8F8",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  noteText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 13,
    lineHeight: 19,
    color: "#555",
  },

});