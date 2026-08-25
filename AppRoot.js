import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  View,
  ActivityIndicator,
} from "react-native";

import * as SecureStore
  from "expo-secure-store";

import {
  useUser,
} from "./srce/components/context/UserContext";

import AuthNavigator
  from "./srce/components/AuthNavigator";

import AppStackNavigator
  from "./srce/components/AppStackNavigator";

import OnboardingScreen
  from "./srce/components/OnboardingScreen";


export default function AppRoot() {

  const {
    loading,
    authReady,
    accessToken,
    userId,
  } = useUser();


  const [
    onboardingChecked,
    setOnboardingChecked,
  ] = useState(false);

  const [
    hasSeenOnboarding,
    setHasSeenOnboarding,
  ] = useState(false);

  const [
    openInitialAddressSetup,
    setOpenInitialAddressSetup,
  ] = useState(false);


  /*
   * Onboarding wird pro Account gespeichert.
   */
  const onboardingKey =
    userId
      ? `onboarding_seen_${userId}`
      : null;


  const checkOnboarding =
    useCallback(async () => {

      if (
        !accessToken ||
        !userId ||
        !onboardingKey
      ) {
        setOnboardingChecked(false);
        setHasSeenOnboarding(false);
        setOpenInitialAddressSetup(false);

        return;
      }


      try {

        const value =
          await SecureStore.getItemAsync(
            onboardingKey
          );


        setHasSeenOnboarding(
          value === "true"
        );

      } catch (error) {

        console.error(
          "Fehler beim Prüfen des Onboardings:",
          error
        );

        /*
         * App bei SecureStore-Fehler
         * nicht blockieren.
         */
        setHasSeenOnboarding(true);

      } finally {

        setOnboardingChecked(true);
      }

    }, [
      accessToken,
      userId,
      onboardingKey,
    ]);


  useEffect(() => {

    if (
      loading ||
      !authReady
    ) {
      return;
    }


    if (!accessToken) {

      setOnboardingChecked(false);
      setHasSeenOnboarding(false);
      setOpenInitialAddressSetup(false);

      return;
    }


    checkOnboarding();

  }, [
    loading,
    authReady,
    accessToken,
    checkOnboarding,
  ]);


  const handleOnboardingComplete =
    async (options = {}) => {

      if (!onboardingKey) {
        return;
      }


      try {

        await SecureStore.setItemAsync(
          onboardingKey,
          "true"
        );

      } catch (error) {

        console.error(
          "Fehler beim Speichern des Onboardings:",
          error
        );
      }


      /*
       * Beim allerersten Durchlauf soll
       * direkt die Adresse eingerichtet werden.
       */
      setOpenInitialAddressSetup(
        options?.openAddressSetup === true
      );


      /*
       * Dadurch wird jetzt AppStackNavigator
       * eingeblendet.
       */
      setHasSeenOnboarding(true);
    };


  /*
   * Auth wird initialisiert.
   */
  if (
    loading ||
    !authReady
  ) {

    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color="#4FB6B8"
        />
      </View>
    );
  }


  /*
   * Nicht eingeloggt.
   */
  if (!accessToken) {
    return <AuthNavigator />;
  }


  /*
   * Onboarding-Status wird geprüft.
   */
  if (
    !userId ||
    !onboardingChecked
  ) {

    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color="#4FB6B8"
        />
      </View>
    );
  }


  /*
   * Erstes Login dieses Accounts
   * auf diesem Gerät.
   */
  if (!hasSeenOnboarding) {

    return (
      <OnboardingScreen
        onComplete={
          handleOnboardingComplete
        }
      />
    );
  }


  /*
   * Nach dem First-Run-Onboarding:
   * Stack startet einmalig direkt im Profil.
   *
   * Bei späteren App-Starts:
   * Stack startet normal bei HomeTabs.
   */
  return (
    <AppStackNavigator
      openInitialAddressSetup={
        openInitialAddressSetup
      }
    />
  );
}