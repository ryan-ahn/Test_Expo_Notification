import React, { useEffect, useState, useRef } from 'react';
import { Platform, BackHandler, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// 토튼 서버로 보내기
// async function sendPushNotification(expoPushToken) {
//   const message = {
//     to: expoPushToken,
//     sound: 'default',
//     title: 'Original Title',
//     body: 'And here is the body!',
//     data: { someData: 'goes here' },
//   };

//   await fetch('https://exp.host/--/api/v2/push/send', {
//     method: 'POST',
//     headers: {
//       Accept: 'application/json',
//       'Accept-encoding': 'gzip, deflate',
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(message),
//   });
// }

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      console.log('hi');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

export default function App(props) {
  const [uri, setUri] = useState('https://www.longblack.co/');
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const [backButtonEnabled, setBackButtonEnabled] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  const WEBVIEW = useRef();

  // Webview content loaded
  function webViewLoaded() {
    setBackButtonEnabled(true);
  }

  // Webview navigation state change
  function onNavigationStateChange(navState) {
    setBackButtonEnabled(navState.canGoBack);
  }

  useEffect(() => {
    // Handle back event
    function backHandler() {
      if (backButtonEnabled) {
        WEBVIEW.current.goBack();
        return true;
      }
    }
    // Subscribe to back state vent
    BackHandler.addEventListener('hardwareBackPress', backHandler);

    // Unsubscribe
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', backHandler);
  }, [backButtonEnabled]);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token)
    );

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        setUri('https://www.longblack.co/weekend');
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#ffffff',
      }}>
      <StatusBar />
      <WebView
        style={{ marginTop: 30 }}
        onLoad={webViewLoaded}
        ref={WEBVIEW}
        onNavigationStateChange={onNavigationStateChange}
        source={{ uri: uri }}
      />
    </SafeAreaView>
  );
}
